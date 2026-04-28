import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

/**
 * GET /api/corpus-stats
 *
 * Returns real corpus counts pulled directly from Supabase. Used by the
 * Experiences page to replace previously-hardcoded marketing numbers.
 *
 * Response: { livedExperiences, codedMoments, practitionerMethods }
 *
 * If Supabase is unreachable or counts cannot be obtained, the route returns
 * 503 with an empty payload so the UI can hide stats lines entirely.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const supabase = supabaseCreateClient(url, key);

    const [livedRes, momentRes, practitionerRes] = await Promise.all([
      supabase.from('lived_experiences').select('*', { count: 'exact', head: true }),
      supabase.from('moments').select('*', { count: 'exact', head: true }),
      supabase.from('practitioner_methods').select('*', { count: 'exact', head: true }),
    ]);

    if (livedRes.error || momentRes.error || practitionerRes.error) {
      console.error('[corpus-stats]', livedRes.error || momentRes.error || practitionerRes.error);
      return NextResponse.json({ error: 'Count query failed' }, { status: 503 });
    }

    return NextResponse.json({
      livedExperiences: livedRes.count ?? 0,
      codedMoments: momentRes.count ?? 0,
      practitionerMethods: practitionerRes.count ?? 0,
    });
  } catch (err) {
    console.error('[corpus-stats] unexpected', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 503 });
  }
}
