import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Session Polaris — Journal',
  description: 'Log how you\'re feeling between sessions.',
  manifest: '/journal/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Polaris Journal',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAFAF8',
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-warm text-gray-900">
      {children}
    </div>
  );
}
