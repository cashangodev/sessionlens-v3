import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import {
  createEntryForDevice,
  getDevice,
  uploadJournalAudio,
} from '@/lib/journal/db';
import { JOURNAL_COOKIE_NAME, verifyDeviceCookie } from '@/lib/journal/cookie';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB; voice notes are short
const ALLOWED_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/aac',
]);

function extFromType(t: string): string {
  if (t.includes('webm')) return 'webm';
  if (t.includes('ogg')) return 'ogg';
  if (t.includes('mp4') || t.includes('m4a') || t.includes('aac')) return 'm4a';
  if (t.includes('mpeg')) return 'mp3';
  if (t.includes('wav')) return 'wav';
  return 'bin';
}

/**
 * POST /api/journal/upload-audio (multipart)
 *
 * Patient-facing. Cookie-authenticated.
 *
 * Fields:
 *   file: Blob (audio)
 *   tags?: comma-separated string
 *   mood?: number 0-10 as string
 *
 * Pipeline: upload to Supabase Storage (private bucket) → Whisper transcription
 * → write a `voice` journal_entry with both audio_path and transcribed text.
 *
 * Whisper failures don't lose the audio: the entry is still created with the
 * audio_path so the doctor can play it back manually.
 */
export async function POST(req: NextRequest) {
  try {
    const deviceId = verifyDeviceCookie(req.cookies.get(JOURNAL_COOKIE_NAME)?.value);
    if (!deviceId) {
      return NextResponse.json({ error: 'not_enrolled' }, { status: 401 });
    }
    const device = await getDevice(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'device_not_found' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'no_file' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'empty_file' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }
    const ct = file.type || 'audio/webm';
    if (!ALLOWED_TYPES.has(ct) && !ct.startsWith('audio/')) {
      return NextResponse.json({ error: 'unsupported_type', type: ct }, { status: 400 });
    }

    const moodRaw = formData.get('mood');
    const tagsRaw = formData.get('tags');
    const mood = typeof moodRaw === 'string' && moodRaw.length > 0 ? Number(moodRaw) : null;
    const tags = typeof tagsRaw === 'string' && tagsRaw.length > 0
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
      : [];

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = extFromType(ct);

    // 1. Persist audio to private bucket
    const upload = await uploadJournalAudio({
      clientId: device.client_id,
      buffer: buf,
      contentType: ct,
      ext,
    });
    if (!upload) {
      return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
    }

    // 2. Transcribe (best-effort). If Whisper hiccups we still keep the audio.
    let transcript: string | null = null;
    let language: string | null = null;
    let duration: number | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const upFile = await toFile(buf, `entry.${ext}`, { type: ct });
        const tx = await openai.audio.transcriptions.create({
          file: upFile,
          model: 'whisper-1',
          response_format: 'verbose_json',
        });
        transcript = (tx as unknown as { text?: string }).text ?? null;
        language = (tx as unknown as { language?: string }).language ?? null;
        duration = (tx as unknown as { duration?: number }).duration ?? null;
      } catch (e) {
        console.error('whisper transcription failed:', e);
      }
    }

    // 3. Create the entry
    const entry = await createEntryForDevice({
      deviceId,
      kind: 'voice',
      text: transcript,
      audioPath: upload.path,
      audioDurationSec: duration ? Math.round(duration) : null,
      mood: mood !== null && Number.isFinite(mood) && mood >= 0 && mood <= 10 ? mood : null,
      tags,
      language,
    });

    if (!entry) {
      return NextResponse.json({ error: 'entry_create_failed' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      entry: {
        id: entry.id,
        kind: entry.kind,
        text: entry.text,
        mood: entry.mood,
        tags: entry.tags,
        createdAt: entry.created_at,
        transcribed: transcript !== null,
      },
    });
  } catch (e) {
    console.error('POST /api/journal/upload-audio error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}

// Audio uploads can be a few MB; bump the body parser ceiling.
export const runtime = 'nodejs';
export const maxDuration = 60;
