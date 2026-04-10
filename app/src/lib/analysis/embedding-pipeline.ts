import { getOpenAIClient, hasOpenAI } from './openai-client';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding for a single text string.
 * Returns an empty array if OpenAI is not available.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!hasOpenAI()) {
    return [];
  }

  const client = getOpenAIClient();
  if (!client) {
    return [];
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[embedding-pipeline] Failed to embed text:', error);
    return [];
  }
}

/**
 * Generate an embedding for a therapy moment by combining its quote and context
 * into a single semantically rich input.
 */
export async function embedMoment(
  quote: string,
  context: string
): Promise<number[]> {
  const combined = `Patient quote: "${quote}"\nClinical context: ${context}`;
  return embedText(combined);
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * Returns an empty array of arrays if OpenAI is not available.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  if (!hasOpenAI()) {
    return texts.map(() => []);
  }

  const client = getOpenAIClient();
  if (!client) {
    return texts.map(() => []);
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to ensure correct ordering
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  } catch (error) {
    console.error('[embedding-pipeline] Failed to embed batch:', error);
    return texts.map(() => []);
  }
}

/**
 * Embed an array of session moments in a single batch call.
 */
export async function embedSessionMoments(
  moments: { quote: string; context: string; structures: string[] }[]
): Promise<number[][]> {
  const texts = moments.map(
    (m) =>
      `Patient quote: "${m.quote}"\nClinical context: ${m.context}\nStructures: ${m.structures.join(', ')}`
  );
  return embedBatch(texts);
}
