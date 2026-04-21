import { NextResponse } from 'next/server';
import { dbGetClientProfile, getTherapistId } from '@/lib/supabase/db';
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { LongitudinalSessionData } from '@/lib/longitudinal-data';
import { StructureName } from '@/types';

function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface AnalysisResult {
  structureProfile?: Record<string, number>;
  outcomeMeasures?: {
    phq9?: number;
    gad7?: number;
  };
  quickInsight?: {
    riskLevel?: 'high' | 'medium' | 'low';
  };
  moments?: Array<{ intensity?: number }>;
  riskFlags?: string[];
}

function mapStructureNameKey(key: string): StructureName {
  // Map from snake_case or other formats to valid StructureName enum values
  const mapping: Record<string, StructureName> = {
    'body': StructureName.BODY,
    'immediate_experience': StructureName.IMMEDIATE_EXPERIENCE,
    'emotion': StructureName.EMOTION,
    'behaviour': StructureName.BEHAVIOUR,
    'behavior': StructureName.BEHAVIOUR,
    'social': StructureName.SOCIAL,
    'cognitive': StructureName.COGNITIVE,
    'reflective': StructureName.REFLECTIVE,
    'narrative': StructureName.NARRATIVE,
    'ecological': StructureName.ECOLOGICAL,
    'normative': StructureName.NORMATIVE,
  };
  return mapping[key.toLowerCase()] || StructureName.EMOTION;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const { clientCode } = await params;

  try {
    // Get client profile to verify it exists and get client_id
    const client = await dbGetClientProfile(clientCode);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch all completed sessions for this client
    const supabase = createClient();
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('session_id, session_number, session_date, status, analysis_result')
      .eq('client_id', client.client_id)
      .eq('therapist_id', getTherapistId())
      .eq('status', 'complete')
      .is('deleted_at', null)
      .order('session_number', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Transform session data into LongitudinalSessionData format
    const longitudinalData: LongitudinalSessionData[] = (sessions || []).map(
      (session: Record<string, unknown>) => {
        const analysis = (session.analysis_result || {}) as AnalysisResult;
        const structureProfile = analysis.structureProfile || {};

        // Count high-intensity moments
        const moments = analysis.moments || [];
        const highIntensityCount = moments.filter(
          (m) => m.intensity && m.intensity > 6
        ).length;
        const emotionalIntensity =
          moments.length > 0
            ? (highIntensityCount / moments.length) * 10
            : 5;

        // Extract risk level from analysis
        const riskLevel = (analysis.quickInsight?.riskLevel || 'low') as 'high' | 'medium' | 'low';

        // Find dominant structure (highest value)
        const dominantStructureEntry = Object.entries(structureProfile).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0];
        const dominantStructure = dominantStructureEntry
          ? mapStructureNameKey(dominantStructureEntry[0])
          : StructureName.EMOTION;

        return {
          sessionNumber: session.session_number as number,
          date: ((session.session_date as string) || '').split('T')[0],
          structureIntensity: {
            body: structureProfile.body || 0,
            immediateExperience: structureProfile.immediate_experience || 0,
            emotion: structureProfile.emotion || 0,
            behaviour: structureProfile.behaviour || 0,
            social: structureProfile.social || 0,
            cognitive: structureProfile.cognitive || 0,
            reflective: structureProfile.reflective || 0,
            narrative: structureProfile.narrative || 0,
            ecological: structureProfile.ecological || 0,
            normative: structureProfile.normative || 0,
          },
          outcomeMeasures: {
            phq9: analysis.outcomeMeasures?.phq9,
            gad7: analysis.outcomeMeasures?.gad7,
          },
          riskLevel,
          dominantStructure,
          keyTheme: analysis.quickInsight?.riskLevel
            ? `Session ${session.session_number} checkpoint`
            : 'Progress checkpoint',
          emotionalIntensity: Math.min(10, emotionalIntensity),
          therapeuticAlliance: 6, // Default baseline
          emotionalRegulation: 5, // Default baseline
          reflectiveCapacity: 5, // Default baseline
        };
      }
    );

    return NextResponse.json({
      sessions: longitudinalData,
      sessionCount: longitudinalData.length,
    });
  } catch (error) {
    console.error('GET /api/clients/[clientCode]/progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get progress data' },
      { status: 500 }
    );
  }
}
