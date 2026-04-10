import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Dev therapist (swap for Clerk auth later) ───
const DEV_THERAPIST_ID = 'a0000000-0000-0000-0000-000000000001';

export function getTherapistId(): string {
  return DEV_THERAPIST_ID;
}

// ─── Types ───

export interface DbClientRow {
  client_id: string;
  therapist_id: string;
  client_code: string;
  gender: string;
  age_range: string;
  treatment_goals: string[];
  presenting_concerns: string[];
  diagnostic_considerations: string[];
  current_risk_level: string;
  key_themes: string[];
  dominant_structures: string[];
  preferred_approach: string;
  clinical_notes: string;
  total_sessions: number;
  is_confirmed: boolean;
  last_confirmed_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbSessionRow {
  session_id: string;
  client_id: string;
  therapist_id: string;
  session_number: number;
  transcript: string | null;
  treatment_goals: string;
  session_date: string;
  status: string;
  analysis_result: Record<string, unknown> | null;
  analysis_complete_at: string | null;
  created_at: string;
}

export interface ClientInfo {
  clientCode: string;
  sessionCount: number;
  lastSessionDate: string;
  lastSessionTime: string;
  firstSessionDate: string;
  gender: string;
  ageRange: string;
  isConfirmed: boolean;
  presentingConcerns: string[];
}

export interface SessionSummary {
  id: string;
  clientCode: string;
  sessionNumber: number;
  date: string;
  time: string;
  createdAt: string;
  treatmentGoals: string;
  status: string;
}

// ─── Client Operations ───

export async function dbGetClientCodes(): Promise<ClientInfo[]> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('client_id, client_code, gender, age_range, is_confirmed, presenting_concerns, total_sessions, created_at')
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('dbGetClientCodes error:', error);
    return [];
  }

  // For each client, get session stats
  const result: ClientInfo[] = [];
  for (const c of clients || []) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('session_date, created_at')
      .eq('client_id', c.client_id)
      .is('deleted_at', null)
      .order('session_date', { ascending: false });

    const sessionCount = sessions?.length || 0;
    const dates = (sessions || []).map(s => s.session_date?.split('T')[0] || '');
    const lastDate = dates[0] || c.created_at?.split('T')[0] || '';
    const firstDate = dates[dates.length - 1] || lastDate;

    result.push({
      clientCode: c.client_code,
      sessionCount,
      lastSessionDate: lastDate,
      lastSessionTime: '00:00',
      firstSessionDate: firstDate,
      gender: c.gender || '',
      ageRange: c.age_range || '',
      isConfirmed: c.is_confirmed || false,
      presentingConcerns: c.presenting_concerns || [],
    });
  }

  return result;
}

export async function dbGetClientProfile(clientCode: string): Promise<DbClientRow | null> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_code', clientCode)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data as DbClientRow;
}

export async function dbUpsertClientProfile(profile: {
  clientCode: string;
  gender?: string;
  ageRange?: string;
  treatmentGoals?: string[];
  presentingConcerns?: string[];
  diagnosticConsiderations?: string[];
  currentRiskLevel?: string;
  keyThemes?: string[];
  dominantStructures?: string[];
  preferredApproach?: string;
  clinicalNotes?: string;
  totalSessions?: number;
  isConfirmed?: boolean;
}): Promise<DbClientRow | null> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  // Check if client exists
  const existing = await dbGetClientProfile(profile.clientCode);

  const row = {
    therapist_id: therapistId,
    client_code: profile.clientCode,
    gender: profile.gender ?? existing?.gender ?? '',
    age_range: profile.ageRange ?? existing?.age_range ?? '',
    treatment_goals: profile.treatmentGoals ?? existing?.treatment_goals ?? [],
    presenting_concerns: profile.presentingConcerns ?? existing?.presenting_concerns ?? [],
    diagnostic_considerations: profile.diagnosticConsiderations ?? existing?.diagnostic_considerations ?? [],
    current_risk_level: profile.currentRiskLevel ?? existing?.current_risk_level ?? 'low',
    key_themes: profile.keyThemes ?? existing?.key_themes ?? [],
    dominant_structures: profile.dominantStructures ?? existing?.dominant_structures ?? [],
    preferred_approach: profile.preferredApproach ?? existing?.preferred_approach ?? '',
    clinical_notes: profile.clinicalNotes ?? existing?.clinical_notes ?? '',
    total_sessions: profile.totalSessions ?? existing?.total_sessions ?? 0,
    is_confirmed: profile.isConfirmed ?? existing?.is_confirmed ?? false,
    last_confirmed_at: profile.isConfirmed ? new Date().toISOString() : (existing?.last_confirmed_at ?? null),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from('clients')
      .update(row)
      .eq('client_id', existing.client_id)
      .select()
      .single();
    if (error) { console.error('dbUpsertClientProfile update error:', error); return null; }
    return data as DbClientRow;
  } else {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...row, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) { console.error('dbUpsertClientProfile insert error:', error); return null; }
    return data as DbClientRow;
  }
}

export async function dbCreateBlankClient(
  clientCode: string,
  gender: string = '',
  ageRange: string = '',
  clinicalNotes: string = ''
): Promise<DbClientRow | null> {
  return dbUpsertClientProfile({
    clientCode,
    gender,
    ageRange,
    clinicalNotes,
    totalSessions: 0,
    isConfirmed: false,
  });
}

export async function dbGenerateClientCode(): Promise<string> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  for (let i = 0; i < 20; i++) {
    const num = Math.floor(Math.random() * 9000) + 1000;
    const code = `CL-${num}`;
    const { data } = await supabase
      .from('clients')
      .select('client_id')
      .eq('therapist_id', therapistId)
      .eq('client_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  return `CL-${Date.now().toString().slice(-6)}`;
}

export async function dbListClientProfiles(): Promise<DbClientRow[]> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) { console.error('dbListClientProfiles error:', error); return []; }
  return (data || []) as DbClientRow[];
}

// ─── Session Operations ───

export async function dbStoreSession(input: {
  clientCode: string;
  transcript: string;
  treatmentGoals: string;
  sessionNumber: number;
  date: string;
  time: string;
  analysisResult?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  // Resolve client_id from code
  const client = await dbGetClientProfile(input.clientCode);
  if (!client) {
    console.error('dbStoreSession: client not found', input.clientCode);
    return null;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      client_id: client.client_id,
      therapist_id: therapistId,
      session_number: input.sessionNumber,
      transcript: input.transcript,
      treatment_goals: input.treatmentGoals,
      session_date: `${input.date}T${input.time}:00`,
      status: input.analysisResult ? 'complete' : 'created',
      analysis_result: input.analysisResult || null,
      analysis_complete_at: input.analysisResult ? new Date().toISOString() : null,
      modality: 'in-person',
    })
    .select('session_id')
    .single();

  if (error) { console.error('dbStoreSession error:', error); return null; }
  return data?.session_id || null;
}

export async function dbGetSession(sessionId: string): Promise<{
  id: string;
  clientCode: string;
  sessionNumber: number;
  transcript: string;
  treatmentGoals: string;
  date: string;
  time: string;
  status: string;
  analysisResult: Record<string, unknown> | null;
  createdAt: string;
} | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*, clients!inner(client_code)')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) return null;

  const dateStr = data.session_date?.split('T')[0] || '';
  const timeStr = data.session_date ? new Date(data.session_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '00:00';

  return {
    id: data.session_id,
    clientCode: (data as Record<string, unknown> & { clients: { client_code: string } }).clients.client_code,
    sessionNumber: data.session_number || 1,
    transcript: data.transcript || '',
    treatmentGoals: data.treatment_goals || '',
    date: dateStr,
    time: timeStr,
    status: data.status || 'created',
    analysisResult: data.analysis_result as Record<string, unknown> | null,
    createdAt: data.created_at || '',
  };
}

export async function dbUpdateSessionAnalysis(
  sessionId: string,
  analysisResult: Record<string, unknown>
): Promise<boolean> {
  const supabase = createClient();

  const { data, error, status, statusText } = await supabase
    .from('sessions')
    .update({
      analysis_result: analysisResult,
      status: 'complete',
      analysis_complete_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .select('session_id');

  console.log('dbUpdateSessionAnalysis result:', { data, error, status, statusText, sessionId });
  if (error) { console.error('dbUpdateSessionAnalysis error:', JSON.stringify(error)); return false; }
  if (!data || data.length === 0) { console.error('dbUpdateSessionAnalysis: no rows updated'); return false; }
  return true;
}

export async function dbListSessions(): Promise<SessionSummary[]> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, session_number, session_date, treatment_goals, status, created_at, clients!inner(client_code)')
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .order('session_date', { ascending: false });

  if (error) { console.error('dbListSessions error:', error); return []; }

  return (data || []).map((s: Record<string, unknown>) => {
    const sessionDate = (s.session_date as string) || '';
    const dateStr = sessionDate.split('T')[0] || '';
    const timeStr = sessionDate ? new Date(sessionDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '00:00';
    return {
      id: s.session_id as string,
      clientCode: ((s as Record<string, unknown> & { clients: { client_code: string } }).clients).client_code,
      sessionNumber: (s.session_number as number) || 1,
      date: dateStr,
      time: timeStr,
      createdAt: (s.created_at as string) || '',
      treatmentGoals: (s.treatment_goals as string) || '',
      status: (s.status as string) || 'created',
    };
  });
}

export async function dbGetSessionsByClient(clientCode: string): Promise<SessionSummary[]> {
  const supabase = createClient();
  const therapistId = getTherapistId();

  const client = await dbGetClientProfile(clientCode);
  if (!client) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, session_number, session_date, treatment_goals, status, created_at')
    .eq('client_id', client.client_id)
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .order('session_date', { ascending: false });

  if (error) { console.error('dbGetSessionsByClient error:', error); return []; }

  return (data || []).map((s) => ({
    id: s.session_id,
    clientCode,
    sessionNumber: s.session_number || 1,
    date: s.session_date?.split('T')[0] || '',
    time: s.session_date ? new Date(s.session_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '00:00',
    createdAt: s.created_at || '',
    treatmentGoals: s.treatment_goals || '',
    status: s.status || 'created',
  }));
}

export async function dbDeleteSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('session_id', sessionId);

  if (error) { console.error('dbDeleteSession error:', error); return false; }
  return true;
}
