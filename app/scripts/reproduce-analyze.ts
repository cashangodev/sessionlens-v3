/**
 * Run analyzeSession() locally against the same transcript that's failing in
 * production, with the same env vars. The point: stop guessing at what's
 * dying in the lambda and just see the exception.
 *
 * Usage: npx tsx scripts/reproduce-analyze.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  console.log('env check:');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `set (${process.env.OPENAI_API_KEY.slice(0, 10)}...)` : 'MISSING');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const sessionId = '663c2117-5d88-4332-9fd2-ff6028c77a6c';
  const { data: session, error } = await supabase
    .from('sessions')
    .select('transcript, treatment_goals, session_number')
    .eq('session_id', sessionId)
    .single();

  if (error || !session) {
    console.error('Failed to fetch session:', error);
    process.exit(1);
  }

  console.log('transcript length:', session.transcript.length);
  console.log('session number:', session.session_number);

  const { analyzeSession } = await import('@/lib/analysis/transcript-analyzer');

  const t0 = Date.now();
  try {
    const result = await analyzeSession({
      transcript: session.transcript,
      treatmentGoals: session.treatment_goals || '',
      sessionNumber: session.session_number || 1,
    });
    const elapsed = Date.now() - t0;
    console.log('\n=== ANALYSIS COMPLETED ===');
    console.log('elapsed:', elapsed, 'ms');
    console.log('moments:', result.moments.length);

    // Now reproduce the persist step that's failing in production.
    console.log('\n=== ATTEMPTING PERSIST (anon key, same as prod) ===');
    const serialized = JSON.parse(JSON.stringify(result));
    const updateResp = await supabase
      .from('sessions')
      .update({
        analysis_result: serialized,
        status: 'complete',
        analysis_complete_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select('session_id');
    console.log('update data:', updateResp.data);
    console.log('update error:', updateResp.error);
    console.log('update status:', updateResp.status, updateResp.statusText);
  } catch (err) {
    const elapsed = Date.now() - t0;
    console.error('\n=== ANALYSIS FAILED ===');
    console.error('elapsed:', elapsed, 'ms');
    console.error('error:', err);
    if (err instanceof Error) {
      console.error('name:', err.name);
      console.error('message:', err.message);
      console.error('stack:', err.stack);
    }
    process.exit(1);
  }
}

main();
