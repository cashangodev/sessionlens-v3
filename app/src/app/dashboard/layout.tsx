import Link from 'next/link';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Top Navigation - minimal, clean, modern */}
      <header className="bg-white/95 border-b border-gray-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <h1 className="font-playfair text-2xl font-bold text-primary-dark group-hover:text-primary transition-colors tracking-tight">SessionLens</h1>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
            >
              <Users className="w-4 h-4" />
              Clients
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Mobile clients link */}
          <Link
            href="/dashboard/clients"
            className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
          >
            <Users className="w-4 h-4" />
          </Link>
          {/* User avatar */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Dr. Sarah Mitchell</span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              SM
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
