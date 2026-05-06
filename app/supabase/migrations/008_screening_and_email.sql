-- ─────────────────────────────────────────────────────────────────────────
-- 008_screening_and_email.sql
--
-- Pre-session screening + email-invite flow.
--
-- Concept: when a therapist creates a new client, they can pick a set of
-- standardized screening instruments (PHQ-9, GAD-7, etc.) and an optional
-- intake prompt, then email the client a single link. The client opens
-- the link, completes whatever's required, and the journal unlocks.
-- The therapist sees scored results on the client profile before the
-- first session.
--
-- Tables:
--   therapist_settings    — per-therapist prefs (reply-to address, etc.)
--   client_invitations    — one row per email/QR invite, signed token
--   screening_assignments — therapist assigns instrument(s) to a client
--   screening_responses   — per-item answers
--   intake_notes          — free-text + voice note "what brings you here"
--
-- RLS: the journal tables (006) intentionally have RLS disabled because
-- the patient-facing API uses HMAC-signed device cookies, not Supabase
-- auth. These tables follow the same pattern. The application layer
-- enforces therapist_id filtering on every query (lib/supabase/db.ts).
-- ─────────────────────────────────────────────────────────────────────────


-- ─── therapist_settings ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.therapist_settings (
  therapist_id    uuid PRIMARY KEY,
  reply_to_email  text,
  display_name    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.therapist_settings DISABLE ROW LEVEL SECURITY;


-- ─── client_invitations ─────────────────────────────────────────────────
-- One row per invite the therapist sends. The token is what the email
-- link encodes; opening the link resolves the invitation and any
-- attached screening_assignments.

CREATE TABLE IF NOT EXISTS public.client_invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL,
  therapist_id     uuid NOT NULL,
  token            text NOT NULL UNIQUE,
  email            text,
  delivery_method  text NOT NULL CHECK (delivery_method IN ('email', 'qr', 'both')),
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at          timestamptz,
  opened_at        timestamptz,
  completed_at     timestamptz,
  expires_at       timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_invitations_client_idx
  ON public.client_invitations(client_id);
CREATE INDEX IF NOT EXISTS client_invitations_therapist_idx
  ON public.client_invitations(therapist_id);
CREATE INDEX IF NOT EXISTS client_invitations_token_idx
  ON public.client_invitations(token);

ALTER TABLE public.client_invitations DISABLE ROW LEVEL SECURITY;


-- ─── screening_assignments ──────────────────────────────────────────────
-- Therapist says "client X should take instrument Y". Created by the
-- invite flow OR ad-hoc later (e.g., re-screen at session 4).
-- instrument_id is a text key into the TS catalog (lib/screening/catalog).

CREATE TABLE IF NOT EXISTS public.screening_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL,
  therapist_id    uuid NOT NULL,
  invitation_id   uuid REFERENCES public.client_invitations(id) ON DELETE SET NULL,
  instrument_id   text NOT NULL,
  required        boolean NOT NULL DEFAULT true,
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  due_at          timestamptz,
  completed_at    timestamptz,
  total_score     numeric,
  subscale_scores jsonb,
  severity        text,
  flags           text[] DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screening_assignments_client_idx
  ON public.screening_assignments(client_id);
CREATE INDEX IF NOT EXISTS screening_assignments_therapist_idx
  ON public.screening_assignments(therapist_id);
CREATE INDEX IF NOT EXISTS screening_assignments_invitation_idx
  ON public.screening_assignments(invitation_id);
CREATE INDEX IF NOT EXISTS screening_assignments_instrument_idx
  ON public.screening_assignments(instrument_id);

ALTER TABLE public.screening_assignments DISABLE ROW LEVEL SECURITY;


-- ─── screening_responses ────────────────────────────────────────────────
-- Per-item answers. Stored normalized so we can re-score, audit, or
-- inspect individual items (e.g., "did the patient endorse PHQ-9 q9?").

CREATE TABLE IF NOT EXISTS public.screening_responses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES public.screening_assignments(id) ON DELETE CASCADE,
  item_id        text NOT NULL,
  value          integer,
  text_value     text,
  recorded_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screening_responses_assignment_idx
  ON public.screening_responses(assignment_id);

ALTER TABLE public.screening_responses DISABLE ROW LEVEL SECURITY;


-- ─── intake_notes ───────────────────────────────────────────────────────
-- Free-text and/or voice "what brings you here?" intake prompt. Optional
-- by default but the therapist can mark it required on the invite.
-- Audio is stored in the journal-audio bucket (created in 006); we keep
-- only the storage path here.

CREATE TABLE IF NOT EXISTS public.intake_notes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL,
  therapist_id       uuid NOT NULL,
  invitation_id      uuid REFERENCES public.client_invitations(id) ON DELETE SET NULL,
  text_content       text,
  audio_storage_path text,
  audio_transcript   text,
  audio_duration_seconds integer,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intake_notes_client_idx
  ON public.intake_notes(client_id);
CREATE INDEX IF NOT EXISTS intake_notes_invitation_idx
  ON public.intake_notes(invitation_id);

ALTER TABLE public.intake_notes DISABLE ROW LEVEL SECURITY;
