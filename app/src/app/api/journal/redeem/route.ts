import { NextRequest, NextResponse } from 'next/server';
import { redeemInvitation } from '@/lib/journal/db';
import {
  JOURNAL_COOKIE_NAME,
  signDeviceId,
  DEVICE_COOKIE_OPTIONS,
} from '@/lib/journal/cookie';

/**
 * POST /api/journal/redeem
 *
 * Body: { token: string }
 *
 * Patient-facing. Called from the enrollment landing page. On success creates
 * a `journal_devices` row, sets the signed device cookie, and returns the
 * doctor-set prompt so the entry surface can render immediately.
 *
 * Single-use: a successful redemption marks the invitation. Subsequent
 * attempts with the same token return 410.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') ?? null;
    const result = await redeemInvitation({ token, userAgent });

    if ('error' in result) {
      const status =
        result.error === 'not_found' ? 404 :
        result.error === 'already_redeemed' ? 410 :
        result.error === 'expired' ? 410 :
        500;
      return NextResponse.json({ error: result.error }, { status });
    }

    const cookieValue = signDeviceId(result.device.id);
    const res = NextResponse.json({
      ok: true,
      prompt: result.invitation.prompt,
    });
    res.cookies.set(JOURNAL_COOKIE_NAME, cookieValue, DEVICE_COOKIE_OPTIONS);
    return res;
  } catch (e) {
    console.error('POST /api/journal/redeem error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
