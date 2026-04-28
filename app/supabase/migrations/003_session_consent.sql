-- GDPR consent tracking on sessions.
--
-- Every analyzed session must record explicit therapist-confirmed client
-- consent for processing. We store:
--
--   consent_recorded_at  WHEN consent was confirmed (timestamp)
--   consent_method       HOW it was obtained: 'verbal' | 'written' | 'electronic'
--   consent_version      WHICH version of the consent text the client agreed to
--                        (so we can reconstruct exactly what they consented to
--                        if they exercise data rights later)
--
-- Backfill is intentional: existing sessions get the legacy version 'pre-v1'
-- and a NULL recorded_at, so any audit can distinguish pre-consent rows.
-- New sessions MUST set these (enforced in the app, not the DB, so existing
-- rows don't fail validation).

alter table public.sessions
  add column if not exists consent_recorded_at timestamptz,
  add column if not exists consent_method      text check (consent_method in ('verbal', 'written', 'electronic')),
  add column if not exists consent_version     text;

create index if not exists sessions_consent_recorded_at_idx
  on public.sessions (consent_recorded_at);

comment on column public.sessions.consent_recorded_at is
  'Timestamp the therapist confirmed client consent for AI analysis. NULL for pre-v1 rows.';
comment on column public.sessions.consent_method is
  'How consent was obtained: verbal (clinician attests), written (form on file), electronic (signed in-app).';
comment on column public.sessions.consent_version is
  'Version tag of the consent text the client agreed to (e.g. "v1.0"). Lets us reconstruct exact wording for audits.';
