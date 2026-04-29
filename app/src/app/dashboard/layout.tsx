import Link from 'next/link';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Dashboard top-level layout.
 *
 * Aligned with the landing-page design system:
 *   - bg-bg-warm page surface, white only when separation needed
 *   - hairline borders, never shadows
 *   - text-sm hover states with color shift only — no bg tints, no transforms
 *   - same wordmark size + weight as the landing nav
 *
 * UserButton: lazy-imported so the dev/demo build (no Clerk keys) renders
 * a static avatar instead. When Clerk is configured, the real user avatar +
 * sign-out menu shows.
 */
const hasRealClerkKey =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

let UserButton: React.ComponentType<{ afterSignOutUrl?: string }> | null = null;
if (hasRealClerkKey) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  UserButton = require('@clerk/nextjs').UserButton;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-warm text-gray-900">
      {/* Top nav — mirrors the landing nav shell so chrome reads as one
          continuous design language across public + signed-in surfaces. */}
      <header className="border-b border-gray-200 bg-bg-warm/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-playfair text-xl font-semibold tracking-tight">
              Session Polaris
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard/clients"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <Users className="w-4 h-4" strokeWidth={1.5} />
                Clients
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/clients"
              className="sm:hidden p-2 text-gray-700 hover:text-gray-900"
              aria-label="Clients"
            >
              <Users className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            {UserButton ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-primary-dark text-white flex items-center justify-center text-xs font-semibold"
                aria-hidden
              >
                SP
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
