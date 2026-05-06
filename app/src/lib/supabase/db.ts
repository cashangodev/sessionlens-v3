import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Uses the service-role key when available (bypasses RLS), falling back to
 * the anon key for local dev / preview where the service role key isn't set.
 *
 * This is safe ONLY because every call into this module is server-side
 * (Server Components, Route Handlers). Never import db.ts from a client
 * component.
 *
 * RLS still protects against:
 *   - direct anon-key queries from a leaked anon key
 *   - any future browser-direct access path
 * Server code remains responsible for filtering by `therapist_id` from
 * `getTherapistId()` — RLS is the safety net, not the primary check.
 */
function createClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return supabaseCreateClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Therapist resolution ───
//
// In production, the therapist_id is resolved from the Clerk user ID via the
// `users` mapping table (clerk_user_id -> therapist_id). In dev or when Clerk
// isn't configured, we fall back to a fixed UUID so the demo + local dev keep
// working without auth set up.
//
// All callers are already async, so they `await getTherapistId()`.
const DEV_THERAPIST_ID = 'a0000000-0000-0000-0000-000000000001';

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!key && !key.includes('placeholder');
}

export async function getTherapistId(): Promise<string> {
  if (!isClerkConfigured()) {
    return DEV_THERAPIST_ID;
  }

  try {
    // Dynamic require so the dev/demo build doesn't choke when Clerk env vars
    // aren't present.
    const { auth } = require('@clerk/nextjs/server') as {
      auth: () => Promise<{ userId: string | null }>;
    };
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      // Unauthenticated request reaching a server util — return a sentinel
      // that won't match any real row. (The middleware should catch this
      // before it gets here, but defense in depth.)
      return DEV_THERAPIST_ID;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('therapist_id')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (data?.therapist_id) return data.therapist_id as string;

    // First sign-in before the webhook ran (or webhook misconfigured): create
    // the row inline so the user can use the app immediately.
    const { data: created, error } = await supabase
      .from('users')
      .insert({ clerk_user_id: clerkUserId })
      .select('therapist_id')
      .single();
    if (error || !created) {
      console.error('getTherapistId: failed to create users row', error);
      return DEV_THERAPIST_ID;
    }
    return created.therapist_id as string;
  } catch (e) {
    console.error('getTherapistId: clerk lookup failed, using dev fallback', e);
    return DEV_THERAPIST_ID;
  }
}

// ─── Types ───

export interface OutcomeScoreEntry {
  date: string;
  phq9: number | null;
  gad7: number | null;
  note: string;
}

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
  outcome_tracking_enabled: boolean;
  outcome_scores: OutcomeScoreEntry[];
  email: string | null;
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
  const therapistId = await getTherapistId();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('client_id, client_code, gender, age_range, is_confirmed, presenting_concerns, total_sessions, created_at, status')
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    // Hide archived/inactive clients from the main client list. They remain in
    // the DB and can be surfaced in a dedicated "Archive" view later.
    .eq('status', 'active')
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
  const therapistId = await getTherapistId();

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
  email?: string;
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
  outcomeTrackingEnabled?: boolean;
  outcomeScores?: OutcomeScoreEntry[];
}): Promise<DbClientRow | null> {
  const supabase = createClient();
  const therapistId = await getTherapistId();

  // Check if client exists
  const existing = await dbGetClientProfile(profile.clientCode);

  const row = {
    therapist_id: therapistId,
    client_code: profile.clientCode,
    gender: profile.gender ?? existing?.gender ?? '',
    age_range: profile.ageRange ?? existing?.age_range ?? '',
    email: (profile.email ?? existing?.email ?? '') || null,
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
    outcome_tracking_enabled: profile.outcomeTrackingEnabled ?? existing?.outcome_tracking_enabled ?? false,
    outcome_scores: profile.outcomeScores ?? existing?.outcome_scores ?? [],
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
  clinicalNotes: string = '',
  email: string = '',
  presentingConcerns: string[] = [],
  treatmentGoals: string[] = []
): Promise<DbClientRow | null> {
  return dbUpsertClientProfile({
    clientCode,
    gender,
    ageRange,
    clinicalNotes,
    email,
    presentingConcerns,
    treatmentGoals,
    totalSessions: 0,
    isConfirmed: false,
  });
}

export async function dbGenerateClientCode(): Promise<string> {
  const supabase = createClient();
  const therapistId = await getTherapistId();

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
  const therapistId = await getTherapistId();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) { console.error('dbListClientProfiles error:', error); return []; }
  return (data || []) as DbClientRow[];
}

// ─── Audit log ───
//
// Append-only GDPR access log. Every read of a session's transcript or
// analysis writes a row so we can later answer "who saw what when".
// Failures are logged but never throw — audit must not break the user flow.
// See migration 004_audit_logs.sql.

export type AuditAction =
  | 'session.read'
  | 'session.export'
  | 'session.delete'
  | 'client.read'
  | 'client.update'
  | 'client.remove';

export async function dbWriteAuditLog(input: {
  action: AuditAction;
  resourceType: 'session' | 'client';
  resourceId?: string;
  clientCode?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createClient();
    const therapistId = await getTherapistId();
    await supabase.from('audit_logs').insert({
      therapist_id: therapistId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      client_code: input.clientCode ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    // Never throw from the audit path — clinician-facing flows must not
    // break because the log is unavailable.
    console.error('dbWriteAuditLog failed:', e);
  }
}

// ─── Session Operations ───

export type ConsentMethod = 'verbal' | 'written' | 'electronic';

export async function dbStoreSession(input: {
  clientCode: string;
  transcript: string;
  treatmentGoals: string;
  sessionNumber: number;
  date: string;
  time: string;
  analysisResult?: Record<string, unknown>;
  /**
   * GDPR consent attestation. Required for all new sessions; the API layer
   * rejects requests without it. Persisted on the row so we can prove (and
   * audit) that consent existed before any analysis ran.
   */
  consent?: {
    method: ConsentMethod;
    version: string;
  };
}): Promise<string | null> {
  const supabase = createClient();
  const therapistId = await getTherapistId();

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
      // Consent fields (GDPR — see migration 003_session_consent.sql)
      consent_recorded_at: input.consent ? new Date().toISOString() : null,
      consent_method: input.consent?.method ?? null,
      consent_version: input.consent?.version ?? null,
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
  consentRecordedAt: string | null;
  consentMethod: ConsentMethod | null;
  consentVersion: string | null;
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
    consentRecordedAt: (data.consent_recorded_at as string | null) ?? null,
    consentMethod: (data.consent_method as ConsentMethod | null) ?? null,
    consentVersion: (data.consent_version as string | null) ?? null,
  };
}

/**
 * Like `dbGetSession` but also writes an audit log entry. Use this from
 * pages/routes where the read is human-driven (clinician opening a session
 * page). The plain `dbGetSession` stays available for internal/system reads
 * (cron jobs, analysis pipelines) that shouldn't pollute the audit trail.
 *
 * Audit row is fire-and-forget — the session payload returns immediately and
 * the audit insert runs in parallel.
 */
export async function dbGetSessionAudited(sessionId: string) {
  const session = await dbGetSession(sessionId);
  if (session) {
    // Don't await — audit must not slow down the page render.
    void dbWriteAuditLog({
      action: 'session.read',
      resourceType: 'session',
      resourceId: session.id,
      clientCode: session.clientCode,
    });
  }
  return session;
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
  const therapistId = await getTherapistId();

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
  const therapistId = await getTherapistId();

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

/**
 * Remove (delete / archive / hide) a client with reason capture for the audit trail.
 *
 * Three actions:
 *  - 'delete': soft-delete (sets deleted_at). Sessions are also soft-deleted. Right-to-be-forgotten path.
 *  - 'archive': sets status='terminated'. Stays in the DB; hidden from default client list. Recoverable.
 *  - 'hide':    sets status='inactive'. Stays in the DB; hidden from default client list. Recoverable.
 *
 * The reason + free-text note is appended to clinical_notes with a timestamped
 * audit line so the action is traceable later.
 */
export async function dbRemoveClient(
  clientCode: string,
  action: 'delete' | 'archive' | 'hide',
  reason: string,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const therapistId = await getTherapistId();

  // Resolve client_id from code
  const { data: client, error: lookupErr } = await supabase
    .from('clients')
    .select('client_id, clinical_notes')
    .eq('client_code', clientCode)
    .eq('therapist_id', therapistId)
    .is('deleted_at', null)
    .maybeSingle();

  if (lookupErr || !client) {
    return { success: false, error: 'Client not found' };
  }

  const timestamp = new Date().toISOString();
  const auditLine = `[${timestamp}] Client ${action}: ${reason}${note ? ` — ${note}` : ''}`;
  const updatedNotes = client.clinical_notes
    ? `${client.clinical_notes}\n\n${auditLine}`
    : auditLine;

  if (action === 'delete') {
    // Soft-delete client + cascade to sessions
    const { error: sessErr } = await supabase
      .from('sessions')
      .update({ deleted_at: timestamp })
      .eq('client_id', client.client_id);
    if (sessErr) {
      console.error('dbRemoveClient (delete sessions) error:', sessErr);
      return { success: false, error: 'Failed to delete sessions' };
    }
    const { error: clientErr } = await supabase
      .from('clients')
      .update({ deleted_at: timestamp, clinical_notes: updatedNotes, updated_at: timestamp })
      .eq('client_id', client.client_id);
    if (clientErr) {
      console.error('dbRemoveClient (delete client) error:', clientErr);
      return { success: false, error: 'Failed to delete client' };
    }
    return { success: true };
  }

  // archive or hide — set status, preserve all data
  const newStatus = action === 'archive' ? 'terminated' : 'inactive';
  const { error: statusErr } = await supabase
    .from('clients')
    .update({ status: newStatus, clinical_notes: updatedNotes, updated_at: timestamp })
    .eq('client_id', client.client_id);
  if (statusErr) {
    console.error(`dbRemoveClient (${action}) error:`, statusErr);
    return { success: false, error: `Failed to ${action} client` };
  }
  return { success: true };
}
