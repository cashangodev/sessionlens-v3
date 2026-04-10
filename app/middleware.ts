import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const hasRealClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

export default async function middleware(req: NextRequest) {
  // Only enforce Clerk auth when real keys are configured
  if (hasRealClerkKey) {
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
    const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
    const handler = clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    });
    return handler(req, {} as any);
  }

  // No Clerk key — allow all routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
