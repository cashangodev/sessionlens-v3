'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, Heart, Stethoscope, TrendingUp, ArrowLeft } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Session Overview', icon: LayoutDashboard, href: 'summary' },
  { id: 'experiences', label: 'Lived Experiences', icon: Heart, href: 'experiences' },
  { id: 'analysis', label: 'Session Analysis', icon: Stethoscope, href: 'analysis' },
  { id: 'progress', label: 'Client Progress', icon: TrendingUp, href: 'progress' },
];

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div>
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Session Header */}
      <div className="mb-8">
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900">Session Analysis</h2>
        <p className="text-gray-500 text-xs mt-2 font-mono tracking-wider">SESSION {sessionId.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* 4-Tab Navigation */}
      <div className="mb-8 border-b border-gray-200 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-0 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname.includes(tab.href);
            return (
              <Link
                key={tab.id}
                href={`/dashboard/session/${sessionId}/${tab.href}`}
                className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-primary text-primary font-semibold bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="slide-in-up">{children}</div>
    </div>
  );
}
