/**
 * Resend wrapper for sending transactional email from Polaris.
 *
 * Sender model — "via Polaris" pattern (option C in the design discussion):
 *   From:     <doctor display name> via Polaris <noreply@sessionpolaris.com>
 *   Reply-To: <doctor's reply_to_email from therapist_settings>
 *
 * This means:
 *   - Mail is authenticated by sessionpolaris.com (SPF/DKIM/DMARC), so it
 *     never gets flagged as phishing.
 *   - Doctors don't have to touch their own DNS.
 *   - Patient replies go straight to the doctor's real inbox.
 *
 * Domain verification is a one-time setup at https://resend.com — add the
 * SPF + DKIM records to sessionpolaris.com DNS, wait for green check.
 */

import { Resend } from 'resend';

const FROM_DOMAIN = 'sessionpolaris.com';
const FROM_LOCAL  = 'noreply';

let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  _client = new Resend(key);
  return _client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Doctor display name shown before "via Polaris". Defaults to "Your therapist". */
  senderName?: string;
  /** Doctor's real address — replies route here. Required when the email
   *  is from a therapist; omit only for system-generated emails. */
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const client = getClient();
  const senderName = input.senderName?.trim() || 'Your therapist';

  const result = await client.emails.send({
    from: `${senderName} via Polaris <${FROM_LOCAL}@${FROM_DOMAIN}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
  if (!result.data?.id) {
    throw new Error('Resend send returned no message id');
  }
  return { id: result.data.id };
}
