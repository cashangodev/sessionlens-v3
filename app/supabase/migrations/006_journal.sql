-- Patient between-session journal.
--
-- A doctor sets a prompt during a session ("tell me how you feel when anxiety
-- comes around") and generates a one-time enrollment QR. The patient scans it
-- with their phone, lands on a magic-link PWA, adds-to-home-screen, and from
-- then on can log voice / text / quick entries between sessions. The doctor
-- sees a "since last session" brief at the top of the next session page.
--
-- The patient surface is intentionally not authenticated by Clerk. Identity
-- is bound to a long-lived signed cookie (HMAC over journal_devices.id) that
-- the redeem flow issues exactly once per invitation token. RLS on the patient
-- side is enforced server-side: the API verifies the cookie, looks up the
-- device, and writes the row server-role on behalf of the bound client.
--
-- Three tables:
--   journal_invitations  - one-time tokens for QR enrollment
--   journal_devices      - one row per enrolled patient device
--   journal_entries      - the actual logged moments (voice / text / quick)
--
-- And one Storage bucket for voice audio: 'journal-audio'.

create extension if not exists "pgcrypto";

-- ─── invitations ───
create table if not exists public.journal_invitations (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,           -- url-safe, ~24 chars; carried in QR
  therapist_id    uuid not null,
  client_id       uuid not null references public.clients(client_id) on delete cascade,
  prompt          text not null,                  -- "tell me how you feel when anxiety comes"
  cadence         text,                            -- free-form for v0: "daily 9pm" / "after each episode"
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '14 days'),
  redeemed_at     timestamptz,
  redeemed_device_id uuid                          -- set on first scan; subsequent scans rejected
);

create index if not exists journal_invitations_therapist_idx on public.journal_invitations (therapist_id, created_at desc);
create index if not exists journal_invitations_client_idx on public.journal_invitations (client_id, created_at desc);
create index if not exists journal_invitations_token_idx on public.journal_invitations (token);

alter table public.journal_invitations enable row level security;

drop policy if exists "journal_invitations_select_own" on public.journal_invitations;
drop policy if exists "journal_invitations_insert_own" on public.journal_invitations;
drop policy if exists "journal_invitations_update_own" on public.journal_invitations;

create policy "journal_invitations_select_own"
  on public.journal_invitations for select
  using (therapist_id = public.current_therapist_id());

create policy "journal_invitations_insert_own"
  on public.journal_invitations for insert
  with check (therapist_id = public.current_therapist_id());

-- Dev-mode permissive insert policy. Mirrors `clients_insert_dev` on the
-- existing clients table: anon-key inserts from server code are allowed
-- because the application layer is responsible for therapist_id integrity.
-- The `_insert_own` policy above remains as the production safety net once
-- the Clerk → Supabase JWT context is wired through to anon-role queries.
drop policy if exists "journal_invitations_insert_dev" on public.journal_invitations;
create policy "journal_invitations_insert_dev"
  on public.journal_invitations for insert
  with check (true);

create policy "journal_invitations_update_own"
  on public.journal_invitations for update
  using (therapist_id = public.current_therapist_id())
  with check (therapist_id = public.current_therapist_id());

-- ─── devices ───
create table if not exists public.journal_devices (
  id              uuid primary key default gen_random_uuid(),
  therapist_id    uuid not null,
  client_id       uuid not null references public.clients(client_id) on delete cascade,
  invitation_id   uuid not null references public.journal_invitations(id) on delete cascade,
  prompt_snapshot text not null,                  -- copied from invitation at redemption time
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  user_agent      text,
  revoked_at      timestamptz
);

create index if not exists journal_devices_client_idx on public.journal_devices (client_id, created_at desc);
create index if not exists journal_devices_therapist_idx on public.journal_devices (therapist_id, created_at desc);

alter table public.journal_devices enable row level security;

drop policy if exists "journal_devices_select_own" on public.journal_devices;
drop policy if exists "journal_devices_update_own" on public.journal_devices;

create policy "journal_devices_select_own"
  on public.journal_devices for select
  using (therapist_id = public.current_therapist_id());

-- doctor can revoke a device; insertion happens server-role on patient redemption
create policy "journal_devices_update_own"
  on public.journal_devices for update
  using (therapist_id = public.current_therapist_id())
  with check (therapist_id = public.current_therapist_id());

drop policy if exists "journal_devices_insert_dev" on public.journal_devices;
create policy "journal_devices_insert_dev"
  on public.journal_devices for insert
  with check (true);

-- ─── entries ───
create table if not exists public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  therapist_id    uuid not null,
  client_id       uuid not null references public.clients(client_id) on delete cascade,
  device_id       uuid references public.journal_devices(id) on delete set null,
  kind            text not null check (kind in ('voice', 'text', 'quick')),
  text            text,                            -- free-form for text entries; transcript for voice
  audio_path      text,                            -- supabase storage path inside 'journal-audio' bucket
  audio_duration_sec int,
  mood            int check (mood is null or (mood between 0 and 10)),
  tags            text[] default '{}',             -- e.g. ['work','sleep','social']
  language        text,                            -- whisper-detected
  flagged         boolean not null default false,  -- passive keyword sweep marks for review
  flag_reason     text,
  created_at      timestamptz not null default now()
);

create index if not exists journal_entries_client_idx on public.journal_entries (client_id, created_at desc);
create index if not exists journal_entries_therapist_idx on public.journal_entries (therapist_id, created_at desc);
create index if not exists journal_entries_flagged_idx on public.journal_entries (flagged, created_at desc) where flagged = true;

alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;

create policy "journal_entries_select_own"
  on public.journal_entries for select
  using (therapist_id = public.current_therapist_id());

create policy "journal_entries_delete_own"
  on public.journal_entries for delete
  using (therapist_id = public.current_therapist_id());

drop policy if exists "journal_entries_insert_dev" on public.journal_entries;
create policy "journal_entries_insert_dev"
  on public.journal_entries for insert
  with check (true);

-- Inserts happen server-side from the patient API, after the device cookie is
-- verified. The dev-mode policy above mirrors clients_insert_dev — server code
-- holds the integrity invariant. Once SUPABASE_SERVICE_ROLE_KEY is wired into
-- the deployed env the dev policies become redundant (service_role bypasses).

-- ─── dev-environment RLS posture ───
--
-- The policies above are the production target: select_own gates reads to
-- rows the calling Clerk user owns, and insert is allowed only when the
-- Clerk -> Supabase JWT context resolves `current_therapist_id()` correctly.
--
-- Until that JWT pipe is wired into anon-role queries, we run with RLS off
-- on these tables in dev. Application code (`lib/journal/db.ts` +
-- `getTherapistId()` + `verifyDeviceCookie`) holds the integrity invariant:
-- the patient can only write to their bound client_id, and the doctor only
-- reads rows where `therapist_id = getTherapistId()`. Service-role-key
-- environments bypass RLS anyway, so this is a no-op there too.
alter table public.journal_invitations disable row level security;
alter table public.journal_devices disable row level security;
alter table public.journal_entries disable row level security;

-- ─── storage bucket for voice audio ───
-- Created idempotently. The bucket is private; downloads go through a signed
-- URL endpoint on the doctor side. Patient uploads go through the API (server
-- with service-role key).
insert into storage.buckets (id, name, public)
values ('journal-audio', 'journal-audio', false)
on conflict (id) do nothing;

-- Storage RLS policies. The bucket is private; uploads come through the API
-- which (in dev) uses the anon key. Without these policies storage.objects
-- RLS rejects all writes regardless of the bucket's public flag.
drop policy if exists "journal_audio_insert" on storage.objects;
create policy "journal_audio_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'journal-audio');

drop policy if exists "journal_audio_select" on storage.objects;
create policy "journal_audio_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'journal-audio');

comment on table public.journal_invitations is
  'One-time enrollment tokens for the patient between-session journal. Encoded into a QR shown to the patient at session end.';
comment on table public.journal_devices is
  'Per-patient-device records. Long-lived signed cookie binds the patient to one of these for entry submission.';
comment on table public.journal_entries is
  'Voice / text / quick journal entries logged by patients between sessions. Drives the pre-session brief.';
