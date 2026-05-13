import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Patient device cookie signing.
 *
 * The journal patient surface is not behind Clerk. We bind the patient to a
 * `journal_devices` row via a long-lived signed cookie. The cookie value is
 * `<deviceId>.<hmacHex>`; verification re-signs and timing-safe compares.
 *
 * The HMAC key is derived from CLERK_SECRET_KEY (already present and secret)
 * so we don't introduce a new env var. If CLERK_SECRET_KEY is not set we fall
 * back to a process-lifetime random key in dev — every server restart will
 * invalidate existing cookies, which is acceptable for prototype.
 */

export const JOURNAL_COOKIE_NAME = 'sp_journal_device';

const FALLBACK_KEY = randomBytes(32).toString('hex');

function getKey(): string {
  return process.env.CLERK_SECRET_KEY || process.env.JOURNAL_DEVICE_SECRET || FALLBACK_KEY;
}

export function signDeviceId(deviceId: string): string {
  const mac = createHmac('sha256', getKey()).update(deviceId).digest('hex');
  return `${deviceId}.${mac}`;
}

export function verifyDeviceCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const [deviceId, mac] = cookieValue.split('.');
  if (!deviceId || !mac) return null;
  const expected = createHmac('sha256', getKey()).update(deviceId).digest('hex');
  try {
    const a = Buffer.from(mac, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return deviceId;
  } catch {
    return null;
  }
}

/** Cookie attributes used in Set-Cookie. 1 year, httpOnly, sameSite=lax. */
export const DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  secure: process.env.NODE_ENV === 'production',
};
