import { NextResponse } from 'next/server';

/**
 * PWA manifest for the patient journal surface.
 *
 * Served from /journal/manifest.webmanifest (referenced from journal/layout.tsx
 * metadata). When the patient hits "Add to Home Screen", iOS / Android use
 * this to register the app.
 *
 * scope/start_url is `/journal` — opening the icon launches straight into the
 * entry surface, never the doctor dashboard.
 */
export function GET() {
  return NextResponse.json({
    name: 'Polaris Journal',
    short_name: 'Polaris',
    start_url: '/journal',
    scope: '/journal',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#2A5C5C',
    orientation: 'portrait',
    icons: [
      {
        src: '/journal/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/journal/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/journal/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  });
}
