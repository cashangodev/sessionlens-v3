/**
 * Auth middleware (Clerk Next.js v6 API).
 *
 * Behavior is conditional on Clerk being configured:
 *
 *  - When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or contains
 *    "placeholder" (dev / demo / preview without auth), the middleware is a
 *    no-op pass-through. The app keeps using the dev therapist fallback in
 *    getTherapistId() so local dev and the public demo continue to work
 *    without sign-in.
 *
 *  - When Clerk IS configured, every route except a small public allow-list
 *    requires an authenticated session. clerkMiddleware() handles the
 *    redirect to /sign-in for protected pages and 401 responses for protected
 *    APIs. The public allow-list uses createRouteMatcher() per Clerk v6 docs.
 *
 * NOTE: This file MUST use Clerk's clerkMiddleware() rather than manually
 * calling getAuth(req). The old v4-style getAuth(req) doesn't work in v6 and
 * causes a 500 MIDDLEWARE_INVOCATION_FAILED on every protected route.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

// Routes that don't require sign-in. Everything else is protected by default.
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
]);

// Branch the export so the dev/demo build (no Clerk keys) doesn't try to
// initialize Clerk's middleware at all.
const noopMiddleware = (_req: NextRequest) => NextResponse.next();

export default isClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) return;
      // Throws a redirect to /sign-in for HTML routes; returns a 401 JSON
      // response for /api routes. Clerk handles both cases internally.
      await auth.protect();
    })
  : noopMiddleware;

export const config = {
  // Skip Next.js internals and all static files; always run on /api and /trpc.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
