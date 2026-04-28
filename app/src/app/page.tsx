/**
 * Public landing page (root route).
 *
 * - If the visitor is a signed-in Clerk user, redirect to /dashboard so
 *   returning therapists go straight to work.
 * - Otherwise, show the marketing page with hero, features, dataset stats,
 *   pricing, and "Request a demo" CTAs.
 *
 * Auth is checked server-side via Clerk's auth() so we don't flash the
 * landing page to authenticated users. Falls back to showing the landing
 * page if Clerk isn't configured (dev/demo build without keys).
 */
import { LandingPage } from '@/components/landing/LandingPage';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

export default async function HomePage() {
  if (isClerkConfigured) {
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      if (userId) redirect('/dashboard');
    } catch {
      // Clerk not loadable — fall through to landing page
    }
  }
  return <LandingPage />;
}
