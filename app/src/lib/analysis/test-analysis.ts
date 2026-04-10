// Quick test to verify the analysis pipeline compiles and works
import { analyzeSession } from './transcript-analyzer';
import { DEMO_TRANSCRIPT } from './demo-transcript';

export async function testAnalysisPipeline() {
  const input = {
    transcript: DEMO_TRANSCRIPT,
    treatmentGoals: 'Reduce anxiety, improve emotional regulation',
    sessionNumber: 3,
    clientId: 'test-client'
  };

  try {
    const result = await analyzeSession(input);
    console.log('Analysis completed successfully');
    console.log(`Identified ${result.moments.length} moments`);
    console.log(`Risk flags: ${result.riskFlags.length}`);
    console.log(`Practitioner matches: ${result.practitionerMatches.length}`);
    console.log(`Similar cases: ${result.similarCases.length}`);
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}
