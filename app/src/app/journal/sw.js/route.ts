const SW = `// Polaris Journal — minimal service worker.
// Existence + a fetch handler is what Chrome needs to surface the
// "Install app" prompt; we don't actually want offline-first behavior for
// the journal yet (entries must reach the server, not queue locally), so
// fetch is a pure pass-through.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', () => {
  // intentionally empty — let the network handle it
});
`;

export function GET() {
  return new Response(SW, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/journal',
      'Cache-Control': 'no-cache',
    },
  });
}
