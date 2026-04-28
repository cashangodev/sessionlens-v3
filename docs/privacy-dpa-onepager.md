# SessionLens — Privacy & Data Processing One-Pager

**Status:** Draft for legal review (v1.0 · 2026-04-27)
**Owner:** Founders / Cashango Ltd
**Audience:** Therapists evaluating SessionLens, their clients, and our DPA counterparties

> This document is the high-level summary that a clinician can read in five
> minutes before signing up — and that we hand to a lawyer as the starting
> point for a full Privacy Notice + Data Processing Agreement. It is **not
> itself a legal contract**; it describes what the product actually does.

---

## 1. Who is the data controller?

The **therapist** (the SessionLens user) is the data controller for any
client-identifying information they upload — including session transcripts,
audio recordings, presenting concerns, and outcome scores.

SessionLens (Cashango Ltd) is the **data processor**: we process that data on
the therapist's instructions, only for the purposes of providing clinical
decision support and the agreed-upon services.

This relationship is governed by a Data Processing Agreement (DPA), signed at
sign-up.

## 2. What data do we process?

| Category | Examples | Source | Retention |
|----------|----------|--------|-----------|
| **Account data** | Therapist email, name, password hash | Sign-up | Until account deletion |
| **Client identifiers** | Anonymous client codes (e.g. CL-1042), age range, gender, presenting concerns | Therapist input | Until therapist deletes the client |
| **Session content** | Transcripts (pasted or transcribed from audio), session notes, treatment goals | Therapist input | Until therapist deletes the session or client |
| **Audio recordings** | Optional uploaded session audio | Therapist input | Discarded after transcription unless therapist explicitly retains |
| **Analysis outputs** | AI-generated summaries, structure codings, risk flags, similar-case matches | Derived | Same as the source session |
| **Outcome measures** | PHQ-9, GAD-7 scores | Therapist input | Same as session |
| **Audit logs** | Who read which session when | System | 12 months minimum (for GDPR Subject Access Requests) |
| **Consent records** | Per-session consent timestamp + method (verbal/written/electronic) | Therapist attestation | For the lifetime of the session |

**We do NOT collect:** real client names, addresses, government IDs, payment
data on behalf of the client, biometric identifiers, or anything that would
let us re-identify a client from session content alone (provided the
therapist follows the anonymous-code workflow).

## 3. Where is data stored?

- **Primary database:** Supabase (Postgres) — EU region (Frankfurt).
- **Authentication:** Clerk — US-based with EU data residency available.
- **AI processing:** OpenAI API (GPT-4o, Whisper) — processed in OpenAI's
  infrastructure under their zero-retention API agreement (no training on
  inputs, no storage beyond the request lifetime).
- **Hosting:** Vercel — global edge with primary compute in EU regions.

EU clients' data is processed in the EU. US-based service providers operate
under Standard Contractual Clauses (SCCs).

## 4. Sub-processors

| Sub-processor | Purpose | Legal basis for transfer |
|---------------|---------|--------------------------|
| Supabase (US-headquartered, EU-hosted) | Database, file storage | SCCs |
| Clerk (US) | Authentication | SCCs |
| OpenAI (US) | LLM analysis, audio transcription | SCCs + zero-retention agreement |
| Vercel (US) | Application hosting | SCCs |
| Stripe (US) | Payment processing (therapist subscription only) | SCCs |

We notify therapists 30 days before adding or changing any sub-processor.

## 5. Security measures

- **Encryption in transit:** TLS 1.2+ for all client-server traffic.
- **Encryption at rest:** AES-256 (Supabase + Vercel storage).
- **Access controls:** Multi-tenant isolation via Postgres Row-Level Security;
  every query is filtered by `therapist_id` resolved from the authenticated
  Clerk session.
- **Audit logging:** Every read of session content writes a row to
  `audit_logs` (action, actor, resource, timestamp).
- **Authentication:** Clerk-managed; therapists may enable MFA at any time.
- **Consent gate:** No transcript reaches the AI pipeline without an
  explicit per-session consent attestation by the therapist.

## 6. Client rights (data subjects)

A client whose session was uploaded can, via their therapist, exercise:

| Right | How |
|-------|-----|
| **Access** | Therapist can export the client's full record (sessions, transcripts, analyses) as a single archive |
| **Rectification** | Therapist edits the client profile / session content directly |
| **Erasure ("right to be forgotten")** | Therapist deletes the client → all linked sessions and analyses are soft-deleted; hard-purge runs within 30 days |
| **Restriction** | Therapist can mark a client as "archived" (hidden but retained) |
| **Portability** | Same as Access — exportable in machine-readable JSON |
| **Object** | Withdraw consent → analysis stops; existing data deleted on request |
| **Audit log of access** | Therapist can pull the audit log for any client |

Clients should direct requests to their therapist; the therapist contacts us
if they need help fulfilling them.

## 7. Breach notification

In the event of a confirmed personal data breach, we will notify affected
therapists within **72 hours** of discovery, with:
- The nature of the breach
- The categories and approximate number of data subjects affected
- Likely consequences
- Measures taken or proposed

Therapists are then responsible for notifying their clients and any
applicable supervisory authority.

## 8. AI-specific commitments

- **No training on customer data.** OpenAI's API tier with zero-retention is
  used for all LLM calls — your transcripts never enter their training data.
- **Clinical decision support, not diagnosis.** All AI outputs are decision
  support for the licensed clinician. The therapist remains the
  sole clinical decision-maker.
- **Hallucination removal.** Every claim in the analysis ties back to a
  verbatim transcript moment via lineage popovers. Claims that can't be
  grounded in the transcript are not surfaced.
- **No autonomous patient communication.** Patient-facing summaries are
  drafts that the therapist must explicitly send.

## 9. Pricing & billing

Therapists subscribe directly. Clients are never billed by SessionLens.

## 10. Contact

- **Data protection enquiries:** privacy@cashango.com
- **Security disclosures:** security@cashango.com
- **General support:** contact@cashango.com

---

### Document control

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-27 | Initial draft for legal review |

**Pending legal review on:** SCC clauses for OpenAI data flows, retention
exact figures, breach notification framing, exact wording of "data controller
vs. processor" for jurisdictions outside EU/UK (CA, AU).
