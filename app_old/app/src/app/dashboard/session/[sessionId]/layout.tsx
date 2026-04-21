'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

const tabs = [
  { id: 'summary', label: 'Clinical Summary', icon: '📋', href: 'summary' },
  { id: 'analysis', label: 'Detailed Analysis', icon: '📊', href: 'analysis' },
  { id: 'cases', label: 'Similar Cases', icon: '🔍', href: 'cases' },
  { id: 'insights', label: 'Expert Insights', icon: '💡', href: 'insights' },
  { id: 'report', label: 'Full Report', icon: '📄', href: 'report' },
];

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div>
      {/* Session Header */}
      <div className="mb-6">
        <h2 className="font-playfair text-2xl font-bold text-gray-900">Session Analysis</h2>
        <p className="text-gray-500 text-sm mt-1">Session ID: {sessionId}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 mb-6 border-b border-gray-200 pb-px">
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.href);
          return (
            <Link
              key={tab.id}
              href={`/dashboard/session/${sessionId}/${tab.href}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}
