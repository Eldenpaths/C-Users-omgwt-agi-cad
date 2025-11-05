/**
 * VECTOR EMBEDDING SERVICE
 *
 * Handles embedding generation and vector storage using Pinecone.
 * Enables similarity search across VAULT experiments.
 */

import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Pinecone configuration
const PINECONE_INDEX_NAME = 'agi-cad-experiments';
const EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small

// Singleton instances
let pineconeClient: Pinecone | null = null;
let openaiClient: OpenAI | null = null;

/**
 * Initialize Pinecone client
 */
function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey || apiKey.includes('your-key-here')) {
      throw new Error('PINECONE_API_KEY not configured in .env.local');
    }

    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
  }

  return pineconeClient;
}

/**
 * Initialize OpenAI client for embeddings
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.includes('your-openai-key-here')) {
      throw new Error('OPENAI_API_KEY not configured for embeddings');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openaiClient;
}

/**
 * Generate embedding vector for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Service] Embedding generation failed:', message);
    throw error;
  }
}

/**
 * Store embedding in Pinecone with metadata
 */
export async function storeEmbedding(
  id: string,
  vector: number[],
  metadata: RecordMetadata
): Promise<void> {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    await index.upsert([
      {
        id,
        values: vector,
        metadata,
      },
    ]);

    console.log(`[Vector Service] Stored embedding for ${id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Service] Storage failed:', message);
    throw error;
  }
}

/**
 * Find similar vectors using semantic search
 */
export async function findSimilar(
  vector: number[],
  topK = 5,
  filter?: RecordMetadata
): Promise<Array<{ id: string; score: number; metadata: RecordMetadata }>> {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter,
    });

    return queryResponse.matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: (match.metadata || {}) as RecordMetadata,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Service] Similarity search failed:', message);
    throw error;
  }
}

/**
 * Find similar experiments by text query
 */
export async function findSimilarByText(
  query: string,
  topK = 5,
  filter?: RecordMetadata
): Promise<Array<{ id: string; score: number; metadata: RecordMetadata }>> {
  const embedding = await generateEmbedding(query);
  return findSimilar(embedding, topK, filter);
}

/**
 * Delete embedding from Pinecone
 */
export async function deleteEmbedding(id: string): Promise<void> {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    await index.deleteOne(id);

    console.log(`[Vector Service] Deleted embedding ${id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Service] Deletion failed:', message);
    throw error;
  }
}

/**
 * Check if Pinecone is configured
 */
export function isPineconeConfigured(): boolean {
  const apiKey = process.env.PINECONE_API_KEY;
  return !!(apiKey && !apiKey.includes('your-key-here'));
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && !apiKey.includes('your-openai-key-here'));
}

/**
 * Get service status
 */
export function getServiceStatus(): {
  pineconeConfigured: boolean;
  openaiConfigured: boolean;
  ready: boolean;
  message: string;
} {
  const pineconeConfigured = isPineconeConfigured();
  const openaiConfigured = isOpenAIConfigured();
  const ready = pineconeConfigured && openaiConfigured;

  let message = '';
  if (!pineconeConfigured) message += 'Pinecone API key not configured. ';
  if (!openaiConfigured) message += 'OpenAI API key not configured. ';
  if (ready) message = 'Vector service ready';

  return {
    pineconeConfigured,
    openaiConfigured,
    ready,
    message: message.trim(),
  };
}

/**
 * Initialize Pinecone index (run once during setup)
 */
export async function initializePineconeIndex(): Promise<void> {
  try {
    const pinecone = getPineconeClient();

    // Check if index exists
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

    if (!indexExists) {
      console.log(`[Vector Service] Creating index: ${PINECONE_INDEX_NAME}`);

      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: EMBEDDING_DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      console.log('[Vector Service] Index created successfully');
    } else {
      console.log('[Vector Service] Index already exists');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Service] Index initialization failed:', message);
    throw error;
  }
}
