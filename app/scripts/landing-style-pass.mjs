// One-shot stylistic cleanup to align remaining dashboard surfaces with the
// landing-page design system: strip shadows, hover transforms, oversized
// rounded corners. Visual-only — no structural changes.
//
// Run from repo root: node app/scripts/landing-style-pass.mjs

import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve(process.cwd(), 'app/src');

// Files we manually rewrote and don't want touched again.
const SKIP = new Set([
  'app/dashboard/layout.tsx',
  'app/dashboard/page.tsx',
  'app/dashboard/clients/page.tsx',
  'components/landing/LandingPage.tsx',
  'components/landing/DemoRequestModal.tsx',
]);

// Match files inside the dashboard tree or shared components only.
const TARGET_RE = /^(app[\\/]dashboard|components[\\/](notes|clients|onboarding|outcomes|experiences|summary|ui))/;

const replacements = [
  // Strip noisy transitions
  [/\btransition-all duration-200\b/g, ''],
  [/\btransition-all duration-300\b/g, ''],
  [/\btransition-all duration-500\b/g, ''],
  // Remove hover translate effects
  [/\bgroup-hover:translate-x-1\b/g, ''],
  [/\bgroup-hover:translate-x-0\.5\b/g, ''],
  [/\bhover:translate-x-1\b/g, ''],
  [/\bhover:-translate-y-1\b/g, ''],
  // Strip shadows everywhere
  [/\bshadow-sm\b/g, ''],
  [/\bshadow-md\b/g, ''],
  [/\bshadow-lg\b/g, ''],
  [/\bshadow-xl\b/g, ''],
  [/\bshadow-2xl\b/g, ''],
  [/\bhover:shadow-sm\b/g, ''],
  [/\bhover:shadow-md\b/g, ''],
  [/\bhover:shadow-lg\b/g, ''],
  // Round-down massive corners
  [/\brounded-2xl\b/g, 'rounded-md'],
  [/\brounded-3xl\b/g, 'rounded-md'],
];

// Tidy up double spaces and spurious whitespace inside className strings
// produced by the strips above.
const tidyClassName = (s) =>
  s.replace(/className="([^"]+)"/g, (_, cls) => {
    const cleaned = cls
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');
    return `className="${cleaned}"`;
  });

let touched = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const rel = path.relative(SRC_ROOT, p).replace(/\\/g, '/');
    if (SKIP.has(rel)) continue;
    if (!TARGET_RE.test(rel.replace(/\//g, path.sep))) continue;

    const before = fs.readFileSync(p, 'utf8');
    let after = before;
    for (const [re, rep] of replacements) after = after.replace(re, rep);
    after = tidyClassName(after);
    if (after !== before) {
      fs.writeFileSync(p, after);
      touched++;
      console.log('cleaned:', rel);
    }
  }
}

walk(SRC_ROOT);
console.log('files cleaned:', touched);
