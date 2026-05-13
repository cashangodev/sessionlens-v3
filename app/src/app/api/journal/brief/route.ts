import { NextRequest, NextResponse } from 'next/server';
import { getTherapistId, dbGetClientProfile, dbGetSessionsByClient } from '@/lib/supabase/db';
import { listEntriesForClient, type JournalEntry } from '@/lib/journal/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/journal/brief?clientCode=CL-1234
 *
 * Doctor-facing. Aggregates the journal entries logged since the last
 * completed session into a "since last session" brief: counts, mood trend,
 * trigger-tag clusters, recent verbatim quotes, and a flagged-for-review list.
 *
 * Heavy AI analysis (CBT distortions, structures) is intentionally NOT done
 * here yet — that hooks into the existing analysis engine in a follow-up.
 * v0 returns the data the brief panel needs to render meaningfully today.
 */
export async function GET(req: NextRequest) {
  try {
    const therapistId = await getTherapistId();
    const clientCode = req.nextUrl.searchParams.get('clientCode');
    if (!clientCode) {
      return NextResponse.json({ error: 'clientCode required' }, { status: 400 });
    }

    const client = await dbGetClientProfile(clientCode);
    if (!client) {
      return NextResponse.json({ error: 'client not found' }, { status: 404 });
    }

    // Anchor "since" to the most recent session date. If no prior sessions,
    // fall back to all entries so the doctor sees everything pre-session-1.
    const sessions = await dbGetSessionsByClient(clientCode);
    const lastSession = sessions[0]; // dbGetSessionsByClient orders desc
    const sinceIso = lastSession?.createdAt || undefined;

    const entries = await listEntriesForClient({
      therapistId,
      clientId: client.client_id,
      sinceIso,
    });

    return NextResponse.json({
      clientCode,
      since: sinceIso ?? null,
      lastSessionDate: lastSession?.date ?? null,
      ...summarize(entries),
    });
  } catch (e) {
    console.error('GET /api/journal/brief error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}

function summarize(entries: JournalEntry[]) {
  if (entries.length === 0) {
    return {
      count: 0,
      timeline: [] as { date: string; count: number }[],
      moodTrend: [] as { date: string; mood: number }[],
      tagCounts: {} as Record<string, number>,
      recentQuotes: [] as { id: string; text: string; createdAt: string }[],
      flagged: [] as { id: string; text: string | null; reason: string | null; createdAt: string }[],
    };
  }

  // Timeline: count per day
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const d = e.created_at.split('T')[0];
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const timeline = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Mood trend (only entries with a mood score)
  const moodTrend = entries
    .filter((e) => e.mood !== null)
    .map((e) => ({ date: e.created_at, mood: e.mood as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Tag counts
  const tagCounts: Record<string, number> = {};
  for (const e of entries) {
    for (const t of e.tags || []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }

  // Recent quotes — most recent text-bearing entries
  const recentQuotes = entries
    .filter((e) => e.text && e.text.trim().length > 0)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      text: e.text as string,
      createdAt: e.created_at,
    }));

  // Flagged entries (crisis keyword sweep)
  const flagged = entries
    .filter((e) => e.flagged)
    .map((e) => ({
      id: e.id,
      text: e.text,
      reason: e.flag_reason,
      createdAt: e.created_at,
    }));

  return {
    count: entries.length,
    timeline,
    moodTrend,
    tagCounts,
    recentQuotes,
    flagged,
  };
}
