import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="font-playfair text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 mt-1">Manage your clients and sessions</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/session/new"
          className="bg-primary text-white rounded-xl p-6 hover:bg-primary-dark transition-colors group">
          <div className="w-8 h-8 mb-3">✨</div>
          <h3 className="font-semibold text-lg">New Session</h3>
          <p className="text-white/80 text-sm mt-1">Analyze a therapy session</p>
        </Link>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-2xl mb-3">👥</div>
          <h3 className="font-semibold text-lg text-gray-900">Clients</h3>
          <p className="text-gray-500 text-sm mt-1">0 active clients</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-2xl mb-3">📄</div>
          <h3 className="font-semibold text-lg text-gray-900">Sessions</h3>
          <p className="text-gray-500 text-sm mt-1">0 sessions analyzed</p>
        </div>
      </div>

      {/* Recent Sessions (empty state) */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-4xl mx-auto mb-4">⏱️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
        <p className="text-gray-500 mb-6">Start by creating a new session analysis</p>
        <Link href="/dashboard/session/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
          ✨ New Session
        </Link>
      </div>
    </div>
  );
}
