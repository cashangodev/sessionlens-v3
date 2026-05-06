/**
 * Helpers for creating and verifying client invitation tokens.
 *
 * Token format: base64url(payload).base64url(hmac)
 * Payload: { i: <invitation_id>, e: <expires_unix> }
 * HMAC:    HMAC-SHA256 of the payload bytes, keyed by INVITE_SIGNING_SECRET.
 *
 * The token is what the patient receives in their email link. It's
 * stateless (we don't need a DB lookup on every page nav, only on
 * actions), but the invitation_id can also be used to look up the
 * client_invitations row when we need to mark it opened/completed.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SECRET_ENV = 'INVITE_SIGNING_SECRET';
const TOKEN_VERSION = 'v1';

function getSecret(): Buffer {
  const s = process.env[SECRET_ENV];
  if (!s || s.length < 32) {
    throw new Error(`${SECRET_ENV} must be set to a random string of at least 32 bytes`);
  }
  return Buffer.from(s, 'utf8');
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad), 'base64');
}

interface TokenPayload {
  v: typeof TOKEN_VERSION;
  i: string;       // invitation_id (uuid)
  e: number;       // expires_at unix seconds
}

/** Create a signed token for a given invitation. */
export function signInvitationToken(invitationId: string, expiresAt: Date): string {
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    i: invitationId,
    e: Math.floor(expiresAt.getTime() / 1000),
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBuf = Buffer.from(payloadJson, 'utf8');
  const sig = createHmac('sha256', getSecret()).update(payloadBuf).digest();
  return `${b64url(payloadBuf)}.${b64url(sig)}`;
}

export interface VerifiedToken {
  invitationId: string;
  expiresAt: Date;
}

/** Verify a token and return its payload. Throws on tampering or expiration. */
export function verifyInvitationToken(token: string): VerifiedToken {
  const [payloadPart, sigPart] = token.split('.');
  if (!payloadPart || !sigPart) throw new Error('Malformed token');

  const payloadBuf = fromB64url(payloadPart);
  const sigBuf = fromB64url(sigPart);

  const expectedSig = createHmac('sha256', getSecret()).update(payloadBuf).digest();
  if (sigBuf.length !== expectedSig.length || !timingSafeEqual(sigBuf, expectedSig)) {
    throw new Error('Invalid token signature');
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(payloadBuf.toString('utf8'));
  } catch {
    throw new Error('Invalid token payload');
  }
  if (payload.v !== TOKEN_VERSION) throw new Error('Unsupported token version');

  const expiresAt = new Date(payload.e * 1000);
  if (Date.now() > expiresAt.getTime()) throw new Error('Token expired');

  return { invitationId: payload.i, expiresAt };
}

/** Generate a fresh random token component used as the unique
 *  client_invitations.token column value (separate from the signed token).
 *  We store a stable random token in the row so it can be revoked even
 *  if the signing secret rotates. */
export function generateInvitationTokenValue(): string {
  return b64url(randomBytes(24));
}
