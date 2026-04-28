/**
 * Auth middleware.
 *
 * Behavior is conditional on Clerk being configured:
 *
 *  - When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing or contains
 *    "placeholder" (dev / demo / preview without auth), the middleware is a
 *    no-op. The app keeps using the dev therapist fallback in
 *    `getTherapistId()` so local development and the public demo continue to
 *    work without sign-in.
 *
 *  - When Clerk IS configured, every route except a small public allow-list
 *    requires an authenticated session. Unauthenticated requests to protected
 *    pages are redirected to /sign-in; unauthenticated API requests get 401.
 *
 * The Clerk SDK is loaded lazily inside the handler so the dev build doesn't
 * import @clerk/nextjs/server when no key is set.
 */
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/webhooks/clerk',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!key && !key.includes('placeholder');
}

export default async function middleware(req: NextRequest) {
  if (!isClerkConfigured()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // Lazy-load Clerk so the dev build doesn't pull it in.
  const { clerkClient, getAuth } = await import('@clerk/nextjs/server').catch(
    () => ({ clerkClient: null, getAuth: null }),
  );
  if (!getAuth) return NextResponse.next();

  // getAuth in @clerk/nextjs v6 expects the request and returns { userId, ... }
  const { userId } = getAuth(req as unknown as Parameters<typeof getAuth>[0]);

  if (!userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signIn);
  }

  // Touching clerkClient avoids unused-import lint when extended later
  void clerkClient;
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals & static files
  matcher: ['/((?!_next/|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|woff2?)$).*)'],
};
