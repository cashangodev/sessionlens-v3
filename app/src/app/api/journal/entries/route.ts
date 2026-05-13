import { NextRequest, NextResponse } from 'next/server';
import {
  createEntryForDevice,
  listEntriesForDevice,
  getDevice,
  type JournalEntryKind,
} from '@/lib/journal/db';
import { JOURNAL_COOKIE_NAME, verifyDeviceCookie } from '@/lib/journal/cookie';

function getDeviceIdFromCookie(req: NextRequest): string | null {
  const cookie = req.cookies.get(JOURNAL_COOKIE_NAME)?.value;
  return verifyDeviceCookie(cookie);
}

/**
 * POST /api/journal/entries
 *
 * Patient-facing. Cookie-authenticated.
 *
 * Body shape depends on `kind`:
 *   { kind: 'text', text: string, mood?: number, tags?: string[] }
 *   { kind: 'quick', mood: number, tags?: string[], text?: string }
 *
 * (Voice entries go through /api/journal/upload-audio which calls into the
 * same DB helper.)
 */
export async function POST(req: NextRequest) {
  try {
    const deviceId = getDeviceIdFromCookie(req);
    if (!deviceId) {
      return NextResponse.json({ error: 'not_enrolled' }, { status: 401 });
    }

    const body = await req.json();
    const kind = body.kind as JournalEntryKind | undefined;
    if (kind !== 'text' && kind !== 'quick') {
      return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
    }

    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 5000) : null;
    const mood = typeof body.mood === 'number' && body.mood >= 0 && body.mood <= 10 ? body.mood : null;
    const tags = Array.isArray(body.tags)
      ? (body.tags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 10)
      : [];

    if (kind === 'text' && (!text || text.length < 1)) {
      return NextResponse.json({ error: 'text_required' }, { status: 400 });
    }
    if (kind === 'quick' && mood === null) {
      return NextResponse.json({ error: 'mood_required' }, { status: 400 });
    }

    const entry = await createEntryForDevice({
      deviceId,
      kind,
      text,
      mood,
      tags,
    });

    if (!entry) {
      return NextResponse.json({ error: 'create_failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error('POST /api/journal/entries error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}

/**
 * GET /api/journal/entries
 *
 * Patient-facing. Returns this device's recent entries (so the patient can
 * see what they've logged). Doctor-side reads go through /api/journal/brief.
 */
export async function GET(req: NextRequest) {
  try {
    const deviceId = getDeviceIdFromCookie(req);
    if (!deviceId) {
      return NextResponse.json({ error: 'not_enrolled' }, { status: 401 });
    }
    const device = await getDevice(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'device_not_found' }, { status: 401 });
    }
    const entries = await listEntriesForDevice(deviceId, 20);
    return NextResponse.json({
      prompt: device.prompt_snapshot,
      entries: entries.map((e) => ({
        id: e.id,
        kind: e.kind,
        text: e.text,
        mood: e.mood,
        tags: e.tags,
        createdAt: e.created_at,
      })),
    });
  } catch (e) {
    console.error('GET /api/journal/entries error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
