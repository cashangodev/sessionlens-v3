/**
 * Clerk webhook — keeps the Supabase `users` table in sync with Clerk auth.
 *
 * Events handled:
 *  - user.created  → insert row (clerk_user_id, email) and let DB default
 *                    generate the `therapist_id` UUID.
 *  - user.updated  → update email if changed.
 *  - user.deleted  → soft-delete the row (sets deleted_at). Clinical data is
 *                    NOT cascade-deleted here — that's a separate erasure flow
 *                    triggered from the GDPR controls in the dashboard.
 *
 * Configure on Clerk dashboard:
 *   Endpoint URL:   https://<your-domain>/api/webhooks/clerk
 *   Events:         user.created, user.updated, user.deleted
 *   Signing secret: stored in env var CLERK_WEBHOOK_SECRET
 *
 * Note: this route is in the PUBLIC_ROUTES allow-list in middleware.ts so
 * Clerk can reach it without an auth header. We verify the signature using
 * Svix (Clerk's webhook signing library) before trusting the payload.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Service role for writes that bypass RLS (we trust the verified webhook).
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    primary_email_address_id?: string | null;
    deleted?: boolean;
  };
}

function primaryEmail(data: ClerkUserEvent['data']): string | null {
  const list = data.email_addresses || [];
  if (list.length === 0) return null;
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary || list[0]).email_address;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Clerk webhook: CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  };

  // Verify signature with svix. Lazy require so the dev build doesn't need it
  // until webhooks are actually wired up.
  let evt: ClerkUserEvent;
  try {
    const { Webhook } = require('svix') as { Webhook: new (s: string) => { verify: (p: string, h: Record<string, string>) => unknown } };
    const wh = new Webhook(secret);
    evt = wh.verify(payload, headers) as ClerkUserEvent;
  } catch (e) {
    console.error('Clerk webhook: signature verification failed', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = supabase();
  const clerkUserId = evt.data.id;
  const email = primaryEmail(evt.data);

  try {
    if (evt.type === 'user.created') {
      const { error } = await db
        .from('users')
        .insert({ clerk_user_id: clerkUserId, email })
        // Idempotent on retries: if row exists, ignore.
        .select('therapist_id')
        .maybeSingle();
      if (error && error.code !== '23505') {
        // 23505 = unique_violation (already inserted)
        console.error('Clerk webhook user.created insert error:', error);
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
      }
    } else if (evt.type === 'user.updated') {
      const { error } = await db
        .from('users')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('clerk_user_id', clerkUserId);
      if (error) {
        console.error('Clerk webhook user.updated error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }
    } else if (evt.type === 'user.deleted') {
      const { error } = await db
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('clerk_user_id', clerkUserId);
      if (error) {
        console.error('Clerk webhook user.deleted error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
      }
    }
  } catch (e) {
    console.error('Clerk webhook handler exception:', e);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
