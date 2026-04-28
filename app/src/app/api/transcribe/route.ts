import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

const WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)

// Supported audio formats for Whisper
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
];

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${file.type}. Supported formats: MP3, WAV, M4A, WebM, OGG, AAC, FLAC`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > WHISPER_MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `Audio file is too large (${sizeMB}MB). Maximum size is 25MB`,
        },
        { status: 413 }
      );
    }

    // Convert to in-memory buffer (no filesystem writes — compatible with serverless)
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadFile = await toFile(buffer, file.name, { type: file.type });

    // Optional `language` form field — caller can hint the language
    // (ISO-639-1 code) when they know it. If omitted, Whisper auto-detects.
    // Auto-detection is the new default; the previous hardcoded 'en' broke
    // sessions in any other language and was the #1 GDPR-cohort blocker for
    // EU therapists outside the UK.
    const langHint = (formData.get('language') as string | null) || undefined;

    // Call OpenAI Whisper API. Use verbose_json so we can return the detected
    // language back to the client (handy for the UI to confirm and for QA).
    const transcript = await client.audio.transcriptions.create({
      file: uploadFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      ...(langHint ? { language: langHint } : {}),
    });

    return NextResponse.json(
      {
        transcript: transcript.text,
        // verbose_json includes `language` (full name like "english")
        // and `duration` (seconds). Clients can ignore safely.
        language: (transcript as unknown as { language?: string }).language ?? null,
        duration: (transcript as unknown as { duration?: number }).duration ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Transcription API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'OpenAI API authentication failed. Check your API key.' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
}
