#!/usr/bin/env node
/**
 * audit-fabrications.mjs
 *
 * Grep-walks the four session-tab pages and surfaces string literals that
 * look like clinical/quantitative content not derived from props or runtime
 * data. Anything we hit here is a candidate fabrication (hand-typed
 * percentages, hand-typed corpus sizes, fixed patient quotes, references to
 * non-existent sessions, etc.).
 *
 * Run: node scripts/audit-fabrications.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const TARGETS = [
  'src/app/dashboard/session/[sessionId]/summary/page.tsx',
  'src/app/dashboard/session/[sessionId]/experiences/page.tsx',
  'src/app/dashboard/session/[sessionId]/progress/page.tsx',
];

// Patterns we care about. Each entry: { id, regex, description }
const PATTERNS = [
  {
    id: 'corpus-thousands',
    description: 'Hardcoded large corpus sizes (e.g., "10,847 lived experiences", "14,600 coded moments")',
    // 4-6 digit number with comma, used in copy
    regex: /\b\d{1,3},\d{3}\b/g,
  },
  {
    id: 'corpus-bare-thousands',
    description: 'Hardcoded multi-thousand counts in copy ("778 patient journeys", "1536-dim embeddings")',
    regex: /\b(778|14600|10847|2156|1536)\b/g,
  },
  {
    id: 'session-three-ref',
    description: 'Hardcoded "session 3" / "session N" references in non-template copy',
    regex: /session\s+\d+(?!\s*\$\{|\s*\}|\s*number)/gi,
  },
  {
    id: 'hardcoded-percent-string',
    description: 'Percentages embedded in JSX string literals (not derived from data)',
    // matches "78%" "85%" inside JSX text. False-positive prone; we filter context after.
    regex: />\s*\d{1,3}%\s*</g,
  },
  {
    id: 'adjustment-disorder',
    description: 'Default "Adjustment Disorder F43.20" diagnostic',
    regex: /Adjustment Disorder|F43\.20/g,
  },
  {
    id: 'demo-data-tag',
    description: '"[Demo Data]" tag from mock fallback',
    regex: /\[Demo Data\]/g,
  },
  {
    id: 'dead-fields',
    description: 'References to AnalysisResult fields the pipeline never writes',
    regex: /\b(vectorInsights|experientialField|momentConfidence|coOccurrenceNetwork|narrativeArc|matchExplanation)\b/g,
  },
  {
    id: 'mock-longitudinal',
    description: 'Calls into generateMockLongitudinalData()',
    regex: /generateMockLongitudinalData/g,
  },
  {
    id: 'set-boundary-quote',
    description: 'Sample patient quote literals ("set boundary with mother", etc.)',
    regex: /set\s+boundary\s+with\s+mother|expressed\s+need\s+to\s+partner/gi,
  },
  {
    id: 'gated-false',
    description: 'Card hidden via `{false && …}` pattern',
    regex: /\{\s*false\s*&&/g,
  },
  {
    id: 'phq-gad-unguarded-display',
    description: 'PHQ-9 / GAD-7 numeric value displayed without nullish guard',
    // Match `PHQ-9: {something}` or `GAD-7: {something}` in JSX text where the
    // value is not wrapped in a `?? '—'` / `!= null ?` guard. This is a heuristic
    // — false positives are filtered below.
    regex: /(?:PHQ-?9|GAD-?7)\s*:\s*\{[^}]+\}/g,
  },
];

const findings = [];

for (const rel of TARGETS) {
  const abs = resolve(ROOT, rel);
  let src;
  try {
    src = readFileSync(abs, 'utf8');
  } catch {
    findings.push({ file: rel, line: 0, pattern: 'missing-file', snippet: 'File not found' });
    continue;
  }
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip imports and pure type declarations
    if (/^\s*import\s/.test(line)) continue;
    // Skip pure comment lines — comments may legitimately reference removed
    // fields (e.g., "matchExplanation removed in P0-1 audit").
    const isCommentLine = /^\s*(?:\/\/|\/\*|\*|\{\/\*)/.test(line);
    for (const p of PATTERNS) {
      const re = new RegExp(p.regex.source, p.regex.flags);
      if (re.test(line)) {
        // Suppress matches that obviously come from data (e.g., `{x}%` in JSX)
        const isInterpolated = /\{[^}]+\}\s*%/.test(line) || /Math\.round/.test(line);
        if (p.id === 'hardcoded-percent-string' && isInterpolated) continue;
        if (isCommentLine && (p.id === 'dead-fields' || p.id === 'mock-longitudinal' || p.id === 'phq-gad-unguarded-display')) continue;
        findings.push({
          file: rel,
          line: i + 1,
          pattern: p.id,
          description: p.description,
          snippet: line.trim().slice(0, 180),
        });
      }
    }
  }
}

// Group + report
const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}

console.log('SessionLens — Fabrication Audit');
console.log('='.repeat(70));
console.log(`Scanned ${TARGETS.length} files. Total flags: ${findings.length}`);
console.log('');

for (const [file, items] of byFile) {
  console.log(`\n${file}  (${items.length})`);
  console.log('-'.repeat(70));
  // Group by pattern within file
  const byPattern = new Map();
  for (const it of items) {
    if (!byPattern.has(it.pattern)) byPattern.set(it.pattern, []);
    byPattern.get(it.pattern).push(it);
  }
  for (const [pat, list] of byPattern) {
    console.log(`  [${pat}]  ${list[0].description}`);
    for (const it of list.slice(0, 5)) {
      console.log(`    L${it.line}: ${it.snippet}`);
    }
    if (list.length > 5) console.log(`    ...and ${list.length - 5} more`);
  }
}

if (findings.length === 0) {
  console.log('\nNo fabrications detected.');
  process.exit(0);
} else {
  console.log(`\n${findings.length} fabrication flag(s) remain. Review before demo.`);
  process.exit(1);
}
