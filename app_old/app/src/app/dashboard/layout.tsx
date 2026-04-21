import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="font-playfair text-xl font-bold text-primary">SessionLens</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/dashboard/session/new" className="hover:text-primary transition-colors">New Session</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Demo Mode</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
