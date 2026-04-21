import { NextResponse } from 'next/server';
import { dbGetClientProfile, getTherapistId } from '@/lib/supabase/db';
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

interface OutcomeHistoryEntry {
  sessionId: string;
  sessionNumber: number;
  date: string;
  phq9: number | null;
  gad7: number | null;
}

function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const { clientCode } = await params;

  try {
    // Get client profile to get client_id
    const client = await dbGetClientProfile(clientCode);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const supabase = createClient();
    const therapistId = getTherapistId();

    // Query all completed sessions for this client in chronological order
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('session_id, session_number, session_date, analysis_result, status')
      .eq('client_id', client.client_id)
      .eq('therapist_id', therapistId)
      .is('deleted_at', null)
      .order('session_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch outcome history' },
        { status: 500 }
      );
    }

    // Extract outcome measures from each session
    const history: OutcomeHistoryEntry[] = (sessions || [])
      .map((session: Record<string, unknown>) => {
        const analysisResult = session.analysis_result as Record<string, unknown> | null;
        const outcomeMeasures = analysisResult?.outcomeMeasures as {
          phq9?: number;
          gad7?: number;
        } | undefined;

        // Format date from ISO format
        const sessionDate = session.session_date as string;
        const dateStr = sessionDate ? sessionDate.split('T')[0] : '';

        return {
          sessionId: session.session_id as string,
          sessionNumber: session.session_number as number,
          date: dateStr,
          phq9: outcomeMeasures?.phq9 ?? null,
          gad7: outcomeMeasures?.gad7 ?? null,
        };
      })
      // Only include sessions that have at least one outcome measure
      .filter((entry) => entry.phq9 !== null || entry.gad7 !== null);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('GET /api/clients/[clientCode]/outcome-history error:', error);
    return NextResponse.json(
      { error: 'Failed to get outcome history' },
      { status: 500 }
    );
  }
}
