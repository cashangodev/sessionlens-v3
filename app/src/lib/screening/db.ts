/**
 * DB helpers for screening assignments, responses, invitations, and intake notes.
 *
 * All callers are server-side. Therapist filtering is enforced at the
 * application layer (we pass therapist_id from getTherapistId() into
 * every query), matching the pattern in lib/supabase/db.ts.
 */

import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { getInstrumentOrThrow } from './catalog';
import type { ScoringResult } from './types';

function client() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return supabaseCreateClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bypass Next.js fetch cache. Without this, the API hits return stale
    // data on second-and-later loads of the same screening_assignments
    // query — same issue the journal db helpers hit before. (memory:
    // sessionpolaris_codebase)
    global: { fetch: (input, init) => fetch(input as RequestInfo, { ...init, cache: 'no-store' }) },
  });
}

// ─── therapist_settings ─────────────────────────────────────────────────

export interface TherapistSettings {
  therapistId: string;
  replyToEmail: string | null;
  displayName: string | null;
}

export async function getTherapistSettings(therapistId: string): Promise<TherapistSettings | null> {
  const { data, error } = await client()
    .from('therapist_settings')
    .select('therapist_id, reply_to_email, display_name')
    .eq('therapist_id', therapistId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    therapistId: data.therapist_id,
    replyToEmail: data.reply_to_email,
    displayName: data.display_name,
  };
}

export async function upsertTherapistSettings(input: {
  therapistId: string;
  replyToEmail?: string | null;
  displayName?: string | null;
}): Promise<void> {
  const { error } = await client()
    .from('therapist_settings')
    .upsert({
      therapist_id: input.therapistId,
      reply_to_email: input.replyToEmail ?? null,
      display_name: input.displayName ?? null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// ─── client_invitations ─────────────────────────────────────────────────

export interface ClientInvitationInput {
  clientId: string;
  therapistId: string;
  email?: string;
  deliveryMethod: 'email' | 'qr' | 'both';
  tokenValue: string;
  expiresAt: Date;
}

export interface ClientInvitation {
  id: string;
  clientId: string;
  therapistId: string;
  token: string;
  email: string | null;
  deliveryMethod: 'email' | 'qr' | 'both';
  status: 'pending' | 'sent' | 'opened' | 'completed' | 'expired';
  sentAt: Date | null;
  openedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date;
}

export async function createInvitation(input: ClientInvitationInput): Promise<ClientInvitation> {
  const { data, error } = await client()
    .from('client_invitations')
    .insert({
      client_id: input.clientId,
      therapist_id: input.therapistId,
      token: input.tokenValue,
      email: input.email ?? null,
      delivery_method: input.deliveryMethod,
      expires_at: input.expiresAt.toISOString(),
    })
    .select('*')
    .single();
  if (error || !data) throw error || new Error('Insert returned no row');
  return rowToInvitation(data);
}

export async function getInvitationById(id: string): Promise<ClientInvitation | null> {
  const { data, error } = await client()
    .from('client_invitations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToInvitation(data) : null;
}

export async function getInvitationByToken(token: string): Promise<ClientInvitation | null> {
  const { data, error } = await client()
    .from('client_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToInvitation(data) : null;
}

export async function markInvitationSent(id: string): Promise<void> {
  const { error } = await client()
    .from('client_invitations')
    .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markInvitationOpened(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client()
    .from('client_invitations')
    .update({ status: 'opened', opened_at: now, updated_at: now })
    .eq('id', id)
    .is('opened_at', null);
  if (error) throw error;
}

export async function markInvitationCompleted(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client()
    .from('client_invitations')
    .update({ status: 'completed', completed_at: now, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

function rowToInvitation(d: Record<string, unknown>): ClientInvitation {
  return {
    id: d.id as string,
    clientId: d.client_id as string,
    therapistId: d.therapist_id as string,
    token: d.token as string,
    email: (d.email as string | null),
    deliveryMethod: d.delivery_method as ClientInvitation['deliveryMethod'],
    status: d.status as ClientInvitation['status'],
    sentAt: d.sent_at ? new Date(d.sent_at as string) : null,
    openedAt: d.opened_at ? new Date(d.opened_at as string) : null,
    completedAt: d.completed_at ? new Date(d.completed_at as string) : null,
    expiresAt: new Date(d.expires_at as string),
  };
}

// ─── screening_assignments ──────────────────────────────────────────────

export interface ScreeningAssignment {
  id: string;
  clientId: string;
  therapistId: string;
  invitationId: string | null;
  instrumentId: string;
  required: boolean;
  assignedAt: Date;
  completedAt: Date | null;
  totalScore: number | null;
  subscaleScores: Record<string, number> | null;
  severity: string | null;
  flags: string[];
}

export async function createAssignment(input: {
  clientId: string;
  therapistId: string;
  invitationId?: string;
  instrumentId: string;
  required?: boolean;
}): Promise<ScreeningAssignment> {
  // Validate instrument exists in catalog before persisting.
  getInstrumentOrThrow(input.instrumentId);
  const { data, error } = await client()
    .from('screening_assignments')
    .insert({
      client_id: input.clientId,
      therapist_id: input.therapistId,
      invitation_id: input.invitationId ?? null,
      instrument_id: input.instrumentId,
      required: input.required ?? true,
    })
    .select('*')
    .single();
  if (error || !data) throw error || new Error('Insert returned no row');
  return rowToAssignment(data);
}

export async function getAssignmentsForInvitation(invitationId: string): Promise<ScreeningAssignment[]> {
  const { data, error } = await client()
    .from('screening_assignments')
    .select('*')
    .eq('invitation_id', invitationId)
    .order('assigned_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAssignment);
}

export async function getAssignmentsForClient(clientId: string): Promise<ScreeningAssignment[]> {
  const { data, error } = await client()
    .from('screening_assignments')
    .select('*')
    .eq('client_id', clientId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAssignment);
}

export async function recordAssignmentResult(input: {
  assignmentId: string;
  result: ScoringResult;
}): Promise<void> {
  const { error } = await client()
    .from('screening_assignments')
    .update({
      completed_at: new Date().toISOString(),
      total_score: input.result.total,
      subscale_scores: input.result.subscaleScores ?? null,
      severity: input.result.severity,
      flags: input.result.flags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.assignmentId);
  if (error) throw error;
}

function rowToAssignment(d: Record<string, unknown>): ScreeningAssignment {
  return {
    id: d.id as string,
    clientId: d.client_id as string,
    therapistId: d.therapist_id as string,
    invitationId: (d.invitation_id as string | null),
    instrumentId: d.instrument_id as string,
    required: d.required as boolean,
    assignedAt: new Date(d.assigned_at as string),
    completedAt: d.completed_at ? new Date(d.completed_at as string) : null,
    totalScore: d.total_score as number | null,
    subscaleScores: (d.subscale_scores as Record<string, number> | null),
    severity: d.severity as string | null,
    flags: (d.flags as string[] | null) ?? [],
  };
}

// ─── screening_responses ────────────────────────────────────────────────

export async function recordResponses(input: {
  assignmentId: string;
  responses: Record<string, number>;
}): Promise<void> {
  const rows = Object.entries(input.responses).map(([itemId, value]) => ({
    assignment_id: input.assignmentId,
    item_id: itemId,
    value,
  }));
  if (rows.length === 0) return;
  const { error } = await client().from('screening_responses').insert(rows);
  if (error) throw error;
}

/** Fetch every screening assignment for a client, hydrated with the
 *  instrument metadata and per-item responses. Therapist-side only. */
export async function getScreeningsForClient(clientId: string): Promise<Array<ScreeningAssignment & { responses: Record<string, number> }>> {
  const { data: assignments, error } = await client()
    .from('screening_assignments')
    .select('*')
    .eq('client_id', clientId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  if (!assignments || assignments.length === 0) return [];

  const ids = assignments.map((a) => a.id);
  const { data: responses, error: rErr } = await client()
    .from('screening_responses')
    .select('assignment_id, item_id, value')
    .in('assignment_id', ids);
  if (rErr) throw rErr;

  const responsesByAssignment = new Map<string, Record<string, number>>();
  for (const row of responses ?? []) {
    const r = row as { assignment_id: string; item_id: string; value: number };
    if (!responsesByAssignment.has(r.assignment_id)) {
      responsesByAssignment.set(r.assignment_id, {});
    }
    responsesByAssignment.get(r.assignment_id)![r.item_id] = r.value;
  }

  return assignments.map((row) => ({
    ...rowToAssignment(row),
    responses: responsesByAssignment.get(row.id) ?? {},
  }));
}

// ─── intake_notes ───────────────────────────────────────────────────────

export async function createIntakeNote(input: {
  clientId: string;
  therapistId: string;
  invitationId?: string;
  textContent?: string;
  audioStoragePath?: string;
  audioTranscript?: string;
  audioDurationSeconds?: number;
}): Promise<string> {
  const { data, error } = await client()
    .from('intake_notes')
    .insert({
      client_id: input.clientId,
      therapist_id: input.therapistId,
      invitation_id: input.invitationId ?? null,
      text_content: input.textContent ?? null,
      audio_storage_path: input.audioStoragePath ?? null,
      audio_transcript: input.audioTranscript ?? null,
      audio_duration_seconds: input.audioDurationSeconds ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw error || new Error('Insert returned no row');
  return data.id as string;
}

export async function getIntakeNoteForInvitation(invitationId: string): Promise<{ id: string; createdAt: Date } | null> {
  const { data, error } = await client()
    .from('intake_notes')
    .select('id, created_at')
    .eq('invitation_id', invitationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, createdAt: new Date(data.created_at) };
}

export async function getIntakeNoteForClient(clientId: string): Promise<{
  id: string;
  textContent: string | null;
  audioStoragePath: string | null;
  audioTranscript: string | null;
  audioDurationSeconds: number | null;
  createdAt: Date;
} | null> {
  const { data, error } = await client()
    .from('intake_notes')
    .select('id, text_content, audio_storage_path, audio_transcript, audio_duration_seconds, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    textContent: data.text_content,
    audioStoragePath: data.audio_storage_path,
    audioTranscript: data.audio_transcript,
    audioDurationSeconds: data.audio_duration_seconds,
    createdAt: new Date(data.created_at),
  };
}
