/**
 * Ingest Research Data Script
 *
 * Parses participants, moments, and structures CSVs, generates OpenAI embeddings,
 * and inserts everything into Supabase tables.
 *
 * Usage:
 *   npx tsx scripts/ingest-research-data.ts
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (or SUPABASE_SERVICE_KEY for admin access)
 *   OPENAI_API_KEY
 *
 * Options:
 *   --skip-embeddings   Skip embedding generation (just insert data)
 *   --embeddings-only   Only generate embeddings for rows missing them
 *   --dry-run           Parse and validate but don't insert
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ─── Config ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../../mh-agents/data');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 50; // OpenAI allows up to 2048 inputs per batch

const ARGS = process.argv.slice(2);
const SKIP_EMBEDDINGS = ARGS.includes('--skip-embeddings');
const EMBEDDINGS_ONLY = ARGS.includes('--embeddings-only');
const DRY_RUN = ARGS.includes('--dry-run');

// ─── Clients ───
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ─── Types ───
interface ParticipantRow {
  participant_id: string;
  nationality: string;
  lived_locations: string;
  age_range: string;
  gender: string;
  cultural_background: string;
  profession: string;
  industry: string;
  expertise_domains: string;
  speaking_style: string;
  formative_contexts: string;
  language: string;
  primary_topic: string;
  categories: string;
  tags: string;
  content_warnings: string;
  key_themes: string;
  summary: string;
  total_moments: string;
  avg_intensity: string;
}

interface MomentRow {
  participant_id: string;
  moment_id: string;
  verbatim_quote: string;
  moment_anchor: string;
  life_categories: string;
  life_category_axes: string;
  moment_type: string;
  emotional_valence: string;
  intensity: string;
  ekman_emotions: string;
  ekman_reasoning: string;
  structures_present: string;
  structures_absent: string;
}

interface StructureRow {
  participant_id: string;
  moment_id: string;
  structure_name: string;
  present: string;
  description: string;
  verbatim_excerpt: string;
  intensity: string;
  keywords: string;
}

// ─── Helpers ───
function readCSV<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  }) as T[];
}

function parseSemicolonList(val: string): string[] {
  if (!val || val.trim() === '') return [];
  return val.split(';').map(s => s.trim()).filter(Boolean);
}

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

// ─── Embedding ───
async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'placeholder') {
    throw new Error('OPENAI_API_KEY is not set or is a placeholder. Set a real key to generate embeddings.');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }
  // Normalize to unit vector
  const norm = Math.sqrt(avg.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      avg[i] /= norm;
    }
  }
  return avg;
}

// ─── Step 1: Insert Participants ───
async function insertParticipants(): Promise<number> {
  log('Reading participants.csv...');
  const rows = readCSV<ParticipantRow>('participants.csv');
  log(`  Parsed ${rows.length} participants`);

  if (DRY_RUN) { log('  [DRY RUN] Skipping insert'); return rows.length; }

  let inserted = 0;
  for (const row of rows) {
    const { error } = await supabase
      .from('lived_experiences')
      .upsert({
        participant_id: row.participant_id,
        nationality: row.nationality || null,
        lived_locations: row.lived_locations || null,
        age_range: row.age_range || null,
        gender: row.gender || null,
        cultural_background: row.cultural_background || null,
        profession: row.profession || null,
        industry: row.industry || null,
        expertise_domains: row.expertise_domains || null,
        speaking_style: row.speaking_style || null,
        formative_contexts: row.formative_contexts || null,
        language: row.language || null,
        primary_topic: row.primary_topic || null,
        categories: row.categories || null,
        tags: row.tags || null,
        content_warnings: row.content_warnings || null,
        key_themes: row.key_themes || null,
        summary: row.summary || null,
        total_moments: parseInt(row.total_moments) || 0,
        avg_intensity: parseFloat(row.avg_intensity) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'participant_id' });

    if (error) {
      console.error(`  Error inserting ${row.participant_id}:`, error.message);
    } else {
      inserted++;
    }
  }

  log(`  Inserted/updated ${inserted}/${rows.length} participants`);
  return rows.length;
}

// ─── Step 2: Insert Moments ───
async function insertMoments(): Promise<MomentRow[]> {
  log('Reading moments.csv...');
  const rows = readCSV<MomentRow>('moments.csv');
  log(`  Parsed ${rows.length} moments`);

  if (DRY_RUN) { log('  [DRY RUN] Skipping insert'); return rows; }

  let inserted = 0;
  let errors = 0;

  // Batch by 50s for efficiency
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const records = batch.map(row => ({
      moment_id: row.moment_id,
      participant_id: row.participant_id,
      verbatim_quote: row.verbatim_quote,
      moment_anchor: row.moment_anchor || null,
      life_categories: row.life_categories || null,
      life_category_axes: row.life_category_axes || null,
      moment_type: row.moment_type || null,
      emotional_valence: row.emotional_valence || null,
      intensity: parseFloat(row.intensity) || null,
      ekman_emotions: row.ekman_emotions || null,
      ekman_reasoning: row.ekman_reasoning || null,
      structures_present: parseSemicolonList(row.structures_present),
      structures_absent: parseSemicolonList(row.structures_absent),
    }));

    const { error } = await supabase
      .from('moments')
      .upsert(records, { onConflict: 'participant_id,moment_id' });

    if (error) {
      console.error(`  Batch error at row ${i}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  log(`  Inserted/updated ${inserted}/${rows.length} moments (${errors} errors)`);
  return rows;
}

// ─── Step 3: Insert Structure Codings ───
async function insertStructures(): Promise<number> {
  log('Reading structures.csv...');
  const rows = readCSV<StructureRow>('structures.csv');
  log(`  Parsed ${rows.length} structure codings`);

  if (DRY_RUN) { log('  [DRY RUN] Skipping insert'); return rows.length; }

  // Delete existing to avoid duplicates on re-run
  log('  Clearing existing structure_codings...');
  const { error: delError } = await supabase
    .from('structure_codings')
    .delete()
    .neq('id', 0); // delete all

  if (delError) {
    console.error('  Error clearing structure_codings:', delError.message);
  }

  let inserted = 0;
  let errors = 0;

  // Batch insert in groups of 200
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const records = batch.map(row => ({
      participant_id: row.participant_id,
      moment_id: row.moment_id,
      structure_name: row.structure_name,
      present: row.present === 'True' || row.present === 'true',
      description: row.description || null,
      verbatim_excerpt: row.verbatim_excerpt || null,
      intensity: parseFloat(row.intensity) || null,
      keywords: row.keywords || null,
    }));

    const { error } = await supabase
      .from('structure_codings')
      .insert(records);

    if (error) {
      console.error(`  Batch error at row ${i}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }

    // Progress
    if ((i + 200) % 1000 === 0 || i + 200 >= rows.length) {
      log(`  Progress: ${Math.min(i + 200, rows.length)}/${rows.length}`);
    }
  }

  log(`  Inserted ${inserted}/${rows.length} structure codings (${errors} errors)`);
  return rows.length;
}

// ─── Step 4: Generate Moment Embeddings ───
async function generateMomentEmbeddings(momentRows: MomentRow[]): Promise<void> {
  if (SKIP_EMBEDDINGS) {
    log('Skipping embeddings (--skip-embeddings flag)');
    return;
  }

  log('Generating moment embeddings...');

  // If embeddings-only, fetch moments missing embeddings
  let momentsToEmbed: { participant_id: string; moment_id: string; text: string }[];

  if (EMBEDDINGS_ONLY) {
    const { data, error } = await supabase
      .from('moments')
      .select('participant_id, moment_id, verbatim_quote, moment_anchor')
      .is('embedding_moment_level', null);

    if (error) { console.error('Error fetching moments:', error.message); return; }
    momentsToEmbed = (data || []).map(m => ({
      participant_id: m.participant_id,
      moment_id: m.moment_id,
      text: buildMomentEmbeddingText(m.verbatim_quote, m.moment_anchor || ''),
    }));
  } else {
    momentsToEmbed = momentRows.map(m => ({
      participant_id: m.participant_id,
      moment_id: m.moment_id,
      text: buildMomentEmbeddingText(m.verbatim_quote, m.moment_anchor || ''),
    }));
  }

  log(`  ${momentsToEmbed.length} moments to embed`);
  if (momentsToEmbed.length === 0) { log('  No moments need embedding'); return; }

  let embedded = 0;

  for (let i = 0; i < momentsToEmbed.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = momentsToEmbed.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map(m => m.text);

    try {
      const embeddings = await embedBatch(texts);

      // Update each moment with its embedding
      for (let j = 0; j < batch.length; j++) {
        const m = batch[j];
        const embedding = embeddings[j];

        if (DRY_RUN) { embedded++; continue; }

        const { error } = await supabase
          .from('moments')
          .update({
            embedding_moment_level: JSON.stringify(embedding),
            embedding_updated_at: new Date().toISOString(),
          })
          .eq('participant_id', m.participant_id)
          .eq('moment_id', m.moment_id);

        if (error) {
          console.error(`  Error updating embedding for ${m.participant_id}/${m.moment_id}:`, error.message);
        } else {
          embedded++;
        }
      }

      log(`  Embedded ${Math.min(i + EMBEDDING_BATCH_SIZE, momentsToEmbed.length)}/${momentsToEmbed.length}`);

      // Rate limiting: small delay between batches
      if (i + EMBEDDING_BATCH_SIZE < momentsToEmbed.length) {
        await sleep(200);
      }
    } catch (err) {
      console.error(`  Embedding batch error at ${i}:`, err);
      // Continue with next batch
    }
  }

  log(`  Embedded ${embedded}/${momentsToEmbed.length} moments`);
}

function buildMomentEmbeddingText(quote: string, anchor: string): string {
  const parts = [`QUOTE: ${quote}`];
  if (anchor) parts.push(`CONTEXT: ${anchor}`);
  return parts.join('\n');
}

// ─── Step 5: Build Participant-Level Embeddings ───
async function buildParticipantEmbeddings(): Promise<void> {
  if (SKIP_EMBEDDINGS) return;

  log('Building participant-level embeddings (averaging moment vectors)...');

  // Get all participants
  const { data: participants, error: pErr } = await supabase
    .from('lived_experiences')
    .select('participant_id');

  if (pErr || !participants) { console.error('Error fetching participants:', pErr?.message); return; }

  let updated = 0;

  for (const p of participants) {
    // Get all moment embeddings for this participant
    const { data: moments, error: mErr } = await supabase
      .from('moments')
      .select('embedding_moment_level')
      .eq('participant_id', p.participant_id)
      .not('embedding_moment_level', 'is', null);

    if (mErr || !moments || moments.length === 0) continue;

    // Parse embeddings and average them
    const embeddings: number[][] = moments
      .map(m => {
        const emb = m.embedding_moment_level;
        if (typeof emb === 'string') return JSON.parse(emb);
        if (Array.isArray(emb)) return emb;
        return null;
      })
      .filter(Boolean);

    if (embeddings.length === 0) continue;

    const avgEmbedding = averageEmbeddings(embeddings);

    if (DRY_RUN) { updated++; continue; }

    const { error: uErr } = await supabase
      .from('lived_experiences')
      .update({
        embedding_participant_level: JSON.stringify(avgEmbedding),
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('participant_id', p.participant_id);

    if (uErr) {
      console.error(`  Error updating participant embedding for ${p.participant_id}:`, uErr.message);
    } else {
      updated++;
    }
  }

  log(`  Built participant embeddings for ${updated}/${participants.length} participants`);
}

// ─── Step 6: Create HNSW Indexes (after data is loaded) ───
async function createVectorIndexes(): Promise<void> {
  if (SKIP_EMBEDDINGS || DRY_RUN) return;

  log('Creating vector indexes (IVFFlat)...');

  // Check if we have enough rows for the index
  const { count } = await supabase
    .from('moments')
    .select('moment_id', { count: 'exact', head: true })
    .not('embedding_moment_level', 'is', null);

  if (!count || count < 100) {
    log(`  Only ${count || 0} embedded moments — skipping IVFFlat index (need 100+)`);
    return;
  }

  log(`  ${count} embedded moments — indexes will be created via migration`);
}

// ─── Utilities ───
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ───
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  SessionLens Research Data Ingestion Script  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  if (DRY_RUN) log('*** DRY RUN MODE — no data will be written ***');
  if (SKIP_EMBEDDINGS) log('*** SKIP EMBEDDINGS MODE ***');
  if (EMBEDDINGS_ONLY) log('*** EMBEDDINGS ONLY MODE ***');

  log(`Supabase URL: ${SUPABASE_URL}`);
  log(`Data dir: ${DATA_DIR}`);
  log(`Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS} dims)`);
  console.log('');

  const startTime = Date.now();

  try {
    if (!EMBEDDINGS_ONLY) {
      // Step 1: Participants
      await insertParticipants();
      console.log('');

      // Step 2: Moments
      const momentRows = await insertMoments();
      console.log('');

      // Step 3: Structures
      await insertStructures();
      console.log('');

      // Step 4: Moment embeddings
      await generateMomentEmbeddings(momentRows);
      console.log('');

      // Step 5: Participant embeddings
      await buildParticipantEmbeddings();
      console.log('');

      // Step 6: Vector indexes
      await createVectorIndexes();
    } else {
      // Embeddings only mode
      const momentRows = readCSV<MomentRow>('moments.csv');
      await generateMomentEmbeddings(momentRows);
      console.log('');
      await buildParticipantEmbeddings();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    log(`Done! Total time: ${elapsed}s`);

    // Print summary
    const { count: pCount } = await supabase.from('lived_experiences').select('*', { count: 'exact', head: true });
    const { count: mCount } = await supabase.from('moments').select('*', { count: 'exact', head: true });
    const { count: sCount } = await supabase.from('structure_codings').select('*', { count: 'exact', head: true });
    const { count: eCount } = await supabase.from('moments').select('*', { count: 'exact', head: true }).not('embedding_moment_level', 'is', null);

    console.log('');
    console.log('┌─────────────────────────────────┐');
    console.log('│  Final Database State            │');
    console.log('├─────────────────────────────────┤');
    console.log(`│  Participants:      ${String(pCount || 0).padStart(10)} │`);
    console.log(`│  Moments:           ${String(mCount || 0).padStart(10)} │`);
    console.log(`│  Structure Codings: ${String(sCount || 0).padStart(10)} │`);
    console.log(`│  Moments w/ embed:  ${String(eCount || 0).padStart(10)} │`);
    console.log('└─────────────────────────────────┘');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
