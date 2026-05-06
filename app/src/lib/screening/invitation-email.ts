/**
 * Builds the HTML + plain-text body for the screening invitation email.
 * Kept inline (no external template engine) — content is short, branding is
 * minimal, and the email client compatibility tax is small at this scale.
 */

import type { ScreeningInstrument } from './types';

export interface InvitationEmailInput {
  patientFirstName?: string;
  /** Doctor display name, e.g. "Dr. Smith". Falls back to "your therapist". */
  therapistName?: string;
  /** Full URL the patient clicks. */
  inviteUrl: string;
  /** Instruments the patient will be asked to complete. */
  instruments: { instrument: ScreeningInstrument; required: boolean }[];
  /** True if a free-text/voice intake prompt is also attached. */
  intakeIncluded: boolean;
  intakeRequired: boolean;
}

export function buildInvitationEmail(input: InvitationEmailInput): { html: string; text: string; subject: string } {
  const therapist = input.therapistName?.trim() || 'your therapist';
  const greeting = input.patientFirstName?.trim() ? `Hi ${input.patientFirstName.trim()},` : 'Hello,';

  const totalMins = input.instruments.reduce((s, x) => s + x.instrument.estimatedMinutes, 0)
    + (input.intakeIncluded ? 3 : 0);

  const subject = `${therapist} has shared something with you before your first session`;

  const itemList = input.instruments
    .map(({ instrument, required }) =>
      `- ${instrument.name} — ${instrument.fullName} (~${instrument.estimatedMinutes} min)${required ? ' — required' : ' — optional'}`,
    )
    .join('\n');

  const intakeLine = input.intakeIncluded
    ? `\n- A short prompt to share what's bringing you to therapy, in your own words. You can write or record a voice note.${input.intakeRequired ? ' (required)' : ' (optional)'}\n`
    : '';

  const text = `${greeting}

${therapist} invited you to set up your Polaris account before your first session. Polaris is a private space where you can share what's on your mind between sessions and complete a few short questionnaires.

What you'll do (about ${totalMins} minutes total):
${itemList}${intakeLine}

Your answers are sent only to ${therapist}. They are not shared with anyone else.

Open your invitation:
${input.inviteUrl}

If you have any questions, just reply to this email — it goes directly to ${therapist}.

— Polaris`;

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">${greeting}</p>

  <p style="margin: 0 0 16px; line-height: 1.5;">
    <strong>${escapeHtml(therapist)}</strong> invited you to set up your Polaris account before your first session.
    Polaris is a private space where you can share what's on your mind between sessions and complete a few short questionnaires.
  </p>

  <p style="margin: 16px 0 8px; font-weight: 600;">What you'll do (about ${totalMins} minutes total):</p>
  <ul style="margin: 0 0 16px; padding-left: 20px; line-height: 1.6;">
    ${input.instruments.map(({ instrument, required }) => `
      <li><strong>${escapeHtml(instrument.name)}</strong> — ${escapeHtml(instrument.fullName)} (~${instrument.estimatedMinutes} min)
        <span style="color: ${required ? '#1D4343' : '#64748B'}; font-size: 0.9em;"> — ${required ? 'required' : 'optional'}</span>
      </li>
    `).join('')}
    ${input.intakeIncluded ? `
      <li>A short prompt to share what's bringing you to therapy, in your own words — write or record a voice note
        <span style="color: ${input.intakeRequired ? '#1D4343' : '#64748B'}; font-size: 0.9em;"> — ${input.intakeRequired ? 'required' : 'optional'}</span>
      </li>` : ''}
  </ul>

  <p style="margin: 0 0 24px; line-height: 1.5;">
    Your answers are sent only to ${escapeHtml(therapist)}. They are not shared with anyone else.
  </p>

  <p style="margin: 24px 0; text-align: center;">
    <a href="${escapeAttr(input.inviteUrl)}"
       style="display: inline-block; background: #2A5C5C; color: #FFFFFF; text-decoration: none;
              padding: 14px 28px; border-radius: 8px; font-weight: 600;">
      Open your invitation
    </a>
  </p>

  <p style="margin: 24px 0 0; font-size: 0.9em; color: #64748B; line-height: 1.5;">
    If you have any questions, just reply to this email — it goes directly to ${escapeHtml(therapist)}.
  </p>

  <p style="margin: 32px 0 0; font-size: 0.85em; color: #94A3B8;">
    — Polaris
  </p>
</body></html>`;

  return { html, text, subject };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
