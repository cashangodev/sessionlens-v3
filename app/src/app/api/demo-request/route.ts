/**
 * POST /api/demo-request — public endpoint, no auth required.
 *
 * Captures "Request a Demo" form submissions from the landing page into the
 * Supabase `demo_requests` table. Used as a lead-capture funnel since direct
 * sign-up is restricted to a small allow-list during the founders cohort.
 *
 * Validation is intentionally minimal — we'd rather capture a partial lead
 * than reject it. Email is the only required field. Email format is checked
 * loosely (single @ + dot in domain) to filter obvious spam.
 *
 * No rate limiting yet — relying on Vercel's platform-level protection. If
 * this endpoint gets abused, add a Vercel Edge Config rate limit.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // service-role only — RLS denies anon writes on this table
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const trim = (s: unknown, max = 500) =>
      typeof s === 'string' ? s.trim().slice(0, max) : null;

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;

    const { error } = await db().from('demo_requests').insert({
      email,
      name: trim(body.name, 200),
      organization: trim(body.organization, 200),
      role: trim(body.role, 100),
      message: trim(body.message, 2000),
      source: trim(body.source, 50) || 'landing',
      ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error('demo-request insert error:', error);
      return NextResponse.json({ error: 'Failed to record request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('demo-request handler error:', e);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
