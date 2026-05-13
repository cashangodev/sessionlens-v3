const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#2A5C5C"/>
  <g fill="none" stroke="#FAFAF8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="96" cy="96" r="48"/>
    <path d="M96 60 L96 96 L122 110"/>
  </g>
</svg>`;

export function GET() {
  return new Response(SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
