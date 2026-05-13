import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getTherapistId } from '@/lib/supabase/db';
import { dbGetClientProfile } from '@/lib/supabase/db';
import { createInvitation } from '@/lib/journal/db';

/**
 * POST /api/journal/invitations
 *
 * Body: { clientCode: string, prompt: string, cadence?: string }
 *
 * Doctor creates a one-time enrollment token. Returns the token, the
 * full enrollment URL (origin + /journal/<token>), and a base64 PNG QR
 * code data URL ready to drop into an <img>.
 */
export async function POST(req: NextRequest) {
  try {
    const therapistId = await getTherapistId();
    const { clientCode, prompt, cadence } = await req.json();

    if (!clientCode || typeof clientCode !== 'string') {
      return NextResponse.json({ error: 'clientCode required' }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 4) {
      return NextResponse.json({ error: 'prompt required (min 4 chars)' }, { status: 400 });
    }

    const client = await dbGetClientProfile(clientCode);
    if (!client) {
      return NextResponse.json({ error: 'client not found' }, { status: 404 });
    }

    const invitation = await createInvitation({
      therapistId,
      clientId: client.client_id,
      prompt: prompt.trim(),
      cadence: cadence?.trim() || undefined,
    });
    if (!invitation) {
      return NextResponse.json({ error: 'failed to create invitation' }, { status: 500 });
    }

    // Pick the public origin to encode in the QR.
    //   1) JOURNAL_PUBLIC_BASE_URL env var — set this in dev when the doctor
    //      runs the dashboard on localhost but patients reach via a tunnel
    //      (serveo / ngrok / cloudflared / Vercel preview).
    //   2) x-forwarded-* headers if the request itself came through a proxy.
    //   3) Whatever the request claims as Host — last resort, only useful if
    //      the doctor is hitting the API directly via the public URL.
    const envBase = process.env.JOURNAL_PUBLIC_BASE_URL?.replace(/\/$/, '');
    const xfHost = req.headers.get('x-forwarded-host');
    const xfProto = req.headers.get('x-forwarded-proto');
    const fallbackHost = req.headers.get('host') || req.nextUrl.host;
    const fallbackProto = xfProto || (fallbackHost.startsWith('localhost') ? 'http' : 'https');
    const origin = envBase
      || (xfHost ? `${xfProto || 'https'}://${xfHost}` : `${fallbackProto}://${fallbackHost}`);
    const enrollmentUrl = `${origin}/journal/${invitation.token}`;

    const qrDataUrl = await QRCode.toDataURL(enrollmentUrl, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
      color: { dark: '#1E293B', light: '#FAFAF8' },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        prompt: invitation.prompt,
        expiresAt: invitation.expires_at,
      },
      enrollmentUrl,
      qrDataUrl,
    });
  } catch (e) {
    console.error('POST /api/journal/invitations error:', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
