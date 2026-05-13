import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

/**
 * Server-only Supabase client for journal tables.
 *
 * Mirrors the pattern in lib/supabase/db.ts: prefer service_role to bypass RLS,
 * fall back to anon key for local dev where the service role key isn't set.
 * RLS is the safety net; this module is responsible for filtering by
 * therapist_id / device_id explicitly.
 */
function createClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return supabaseCreateClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bypass the Next.js fetch cache. Without this, mutations in one request
    // can be invisible to subsequent reads in the same dev session because
    // Next stamps GETs as cacheable and serves the prior response.
    global: {
      fetch: (input, init) =>
        fetch(input as RequestInfo, { ...(init ?? {}), cache: 'no-store' }),
    },
  });
}

// ─── Types ───

export interface JournalInvitation {
  id: string;
  token: string;
  therapist_id: string;
  client_id: string;
  prompt: string;
  cadence: string | null;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_device_id: string | null;
}

export interface JournalDevice {
  id: string;
  therapist_id: string;
  client_id: string;
  invitation_id: string;
  prompt_snapshot: string;
  created_at: string;
  last_seen_at: string;
  user_agent: string | null;
  revoked_at: string | null;
}

export type JournalEntryKind = 'voice' | 'text' | 'quick';

export interface JournalEntry {
  id: string;
  therapist_id: string;
  client_id: string;
  device_id: string | null;
  kind: JournalEntryKind;
  text: string | null;
  audio_path: string | null;
  audio_duration_sec: number | null;
  mood: number | null;
  tags: string[];
  language: string | null;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

// ─── Token generation ───

/** URL-safe random token, ~22 chars. */
function generateToken(): string {
  return randomBytes(16)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── Doctor-side: invitations ───

export async function createInvitation(input: {
  therapistId: string;
  clientId: string;
  prompt: string;
  cadence?: string;
}): Promise<JournalInvitation | null> {
  const supabase = createClient();
  const token = generateToken();

  const { data, error } = await supabase
    .from('journal_invitations')
    .insert({
      token,
      therapist_id: input.therapistId,
      client_id: input.clientId,
      prompt: input.prompt,
      cadence: input.cadence ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createInvitation error:', error);
    return null;
  }
  return data as JournalInvitation;
}

export async function getActiveInvitationForClient(
  therapistId: string,
  clientId: string,
): Promise<JournalInvitation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('journal_invitations')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_id', clientId)
    .is('redeemed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('getActiveInvitationForClient error:', error);
    return null;
  }
  return (data as JournalInvitation | null) ?? null;
}

export async function getDevicesForClient(
  therapistId: string,
  clientId: string,
): Promise<JournalDevice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('journal_devices')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_id', clientId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getDevicesForClient error:', error);
    return [];
  }
  return (data as JournalDevice[]) || [];
}

// ─── Patient-side: token redemption ───

export async function redeemInvitation(input: {
  token: string;
  userAgent?: string | null;
}): Promise<{ device: JournalDevice; invitation: JournalInvitation } | { error: string }> {
  const supabase = createClient();

  const { data: inv, error: invErr } = await supabase
    .from('journal_invitations')
    .select('*')
    .eq('token', input.token)
    .maybeSingle();

  if (invErr) {
    console.error('redeemInvitation lookup error:', invErr);
    return { error: 'lookup_failed' };
  }
  if (!inv) return { error: 'not_found' };
  if (inv.redeemed_at) return { error: 'already_redeemed' };
  if (new Date(inv.expires_at) < new Date()) return { error: 'expired' };

  const { data: device, error: devErr } = await supabase
    .from('journal_devices')
    .insert({
      therapist_id: inv.therapist_id,
      client_id: inv.client_id,
      invitation_id: inv.id,
      prompt_snapshot: inv.prompt,
      user_agent: input.userAgent ?? null,
    })
    .select('*')
    .single();

  if (devErr || !device) {
    console.error('redeemInvitation device-insert error:', devErr);
    return { error: 'device_create_failed' };
  }

  const { error: markErr } = await supabase
    .from('journal_invitations')
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_device_id: device.id,
    })
    .eq('id', inv.id);

  if (markErr) {
    console.error('redeemInvitation mark-redeemed error:', markErr);
    // device exists but invitation not marked — still ok for v0
  }

  return {
    device: device as JournalDevice,
    invitation: inv as JournalInvitation,
  };
}

export async function getDevice(deviceId: string): Promise<JournalDevice | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('journal_devices')
    .select('*')
    .eq('id', deviceId)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) {
    console.error('getDevice error:', error);
    return null;
  }
  return (data as JournalDevice | null) ?? null;
}

export async function touchDevice(deviceId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('journal_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', deviceId);
}

// ─── Entries ───

const CRISIS_KEYWORDS = [
  'kill myself',
  'end my life',
  'suicide',
  'suicidal',
  'hurt myself',
  "i want to die",
  'overdose',
  'no reason to live',
];

function flagFromText(text: string | null | undefined): { flagged: boolean; reason: string | null } {
  if (!text) return { flagged: false, reason: null };
  const lower = text.toLowerCase();
  const hit = CRISIS_KEYWORDS.find((k) => lower.includes(k));
  if (hit) return { flagged: true, reason: `crisis_keyword:${hit}` };
  return { flagged: false, reason: null };
}

export async function createEntryForDevice(input: {
  deviceId: string;
  kind: JournalEntryKind;
  text?: string | null;
  audioPath?: string | null;
  audioDurationSec?: number | null;
  mood?: number | null;
  tags?: string[];
  language?: string | null;
}): Promise<JournalEntry | null> {
  const device = await getDevice(input.deviceId);
  if (!device) return null;

  const { flagged, reason } = flagFromText(input.text);

  const supabase = createClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      therapist_id: device.therapist_id,
      client_id: device.client_id,
      device_id: device.id,
      kind: input.kind,
      text: input.text ?? null,
      audio_path: input.audioPath ?? null,
      audio_duration_sec: input.audioDurationSec ?? null,
      mood: input.mood ?? null,
      tags: input.tags ?? [],
      language: input.language ?? null,
      flagged,
      flag_reason: reason,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createEntryForDevice error:', error);
    return null;
  }
  await touchDevice(device.id);
  return data as JournalEntry;
}

export async function listEntriesForDevice(deviceId: string, limit = 20): Promise<JournalEntry[]> {
  const device = await getDevice(deviceId);
  if (!device) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('listEntriesForDevice error:', error);
    return [];
  }
  return (data as JournalEntry[]) || [];
}

export async function listEntriesForClient(input: {
  therapistId: string;
  clientId: string;
  sinceIso?: string;
}): Promise<JournalEntry[]> {
  const supabase = createClient();
  let q = supabase
    .from('journal_entries')
    .select('*')
    .eq('therapist_id', input.therapistId)
    .eq('client_id', input.clientId)
    .order('created_at', { ascending: false });
  if (input.sinceIso) {
    q = q.gt('created_at', input.sinceIso);
  }
  const { data, error } = await q;
  if (error) {
    console.error('listEntriesForClient error:', error);
    return [];
  }
  return (data as JournalEntry[]) || [];
}

// ─── Audio storage ───

export const JOURNAL_AUDIO_BUCKET = 'journal-audio';

export async function uploadJournalAudio(input: {
  clientId: string;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ path: string } | null> {
  const supabase = createClient();
  const path = `${input.clientId}/${Date.now()}-${randomBytes(4).toString('hex')}.${input.ext}`;
  const { error } = await supabase.storage
    .from(JOURNAL_AUDIO_BUCKET)
    .upload(path, input.buffer, {
      contentType: input.contentType,
      upsert: false,
    });
  if (error) {
    console.error('uploadJournalAudio error:', error);
    return null;
  }
  return { path };
}

export async function signedUrlForJournalAudio(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(JOURNAL_AUDIO_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) {
    console.error('signedUrlForJournalAudio error:', error);
    return null;
  }
  return data?.signedUrl ?? null;
}
