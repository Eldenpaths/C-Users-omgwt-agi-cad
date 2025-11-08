/**
 * Learning Infrastructure Core — LearningCore
 *
 * Orchestrates validation, telemetry, Firestore persistence and optional
 * embedding generation for experiment sessions.
 */

import { collection, addDoc, serverTimestamp, Firestore, CollectionReference } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { validateExperiment, AnyExperiment, LabType } from './validator';
import { Telemetry } from './telemetry';

/** Optional embedding integration types (LangChain + Pinecone) */
export type EmbeddingProvider = {
  /** Generates an embedding vector for input text */
  embed(text: string): Promise<number[]>;
};

export type VectorIndex = {
  /** Upsert a single (id, vector, metadata) */
  upsert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
};

export type LearningCoreOptions = {
  db?: Firestore;
  /** If provided, LearningCore will generate an embedding per session summary */
  embeddingProvider?: EmbeddingProvider | null;
  /** Optional vector index (Pinecone or compatible) */
  vectorIndex?: VectorIndex | null;
  /** Namespace/collection name for sessions */
  collectionName?: string; // default: learning_sessions
  /** Max retries for writes */
  maxRetries?: number; // default: 3
};

/** A persisted session doc shape */
export type LearningSessionRecord = AnyExperiment & {
  createdAt: any;
  summary?: string;
  embeddingId?: string;
  embeddingDim?: number;
};

function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

async function withExponentialRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(1000 * Math.pow(2, attempt), 10_000);
      await delay(backoff);
      attempt += 1;
    }
  }
  throw lastErr;
}

export class LearningCore {
  private db: Firestore;
  private sessionsCol: CollectionReference;
  private embed?: EmbeddingProvider | null;
  private index?: VectorIndex | null;
  private maxRetries: number;

  constructor(opts?: LearningCoreOptions) {
    this.db = opts?.db ?? getFirestoreInstance();
    if (!this.db) throw new Error('Firestore is not available in this context.');

    this.sessionsCol = collection(this.db, opts?.collectionName ?? 'learning_sessions') as CollectionReference;
    this.embed = opts?.embeddingProvider ?? null;
    this.index = opts?.vectorIndex ?? null;
    this.maxRetries = opts?.maxRetries ?? 3;
  }

  /**
   * Ingests raw experiment payload:
   * - Validates against Zod schemas
   * - Logs telemetry (received, validated, persisted)
   * - Persists to Firestore with server timestamp
   * - Optionally generates embeddings and upserts to vector index
   */
  async ingest(labType: LabType, rawData: unknown, options?: { summary?: string }): Promise<string> {
    // Log receipt
    await Telemetry.logEvent({
      userId: (rawData as any)?.userId ?? 'unknown',
      agentId: (rawData as any)?.agentId ?? 'unknown',
      labType,
      event: 'experiment.received',
      runId: (rawData as any)?.runId,
    });

    // Validate
    const validated = validateExperiment(labType, rawData) as AnyExperiment;

    await Telemetry.logEvent({
      userId: validated.userId,
      agentId: validated.agentId,
      labType,
      event: 'experiment.validated',
      runId: validated.runId,
    });

    // Prepare record
    const record: LearningSessionRecord = {
      ...validated,
      createdAt: serverTimestamp(),
      summary: options?.summary,
    };

    // Persist with retry
    const docRef = await withExponentialRetry(
      () => addDoc(this.sessionsCol, record),
      this.maxRetries,
    );

    // Optionally embed and index
    if (this.embed && this.index && options?.summary) {
      try {
        const vector = await this.embed.embed(options.summary);
        await this.index.upsert(docRef.id, vector, {
          labType,
          userId: validated.userId,
          agentId: validated.agentId,
          runId: validated.runId,
        });
      } catch (err) {
        // Non-fatal; log telemetry and continue
        await Telemetry.logEvent({
          userId: validated.userId,
          agentId: validated.agentId,
          labType,
          event: 'embedding.error',
          runId: validated.runId,
          meta: { error: (err as Error).message },
        });
      }
    }

    // Log success
    await Telemetry.logEvent({
      userId: validated.userId,
      agentId: validated.agentId,
      labType,
      event: 'experiment.persisted',
      runId: validated.runId,
    });

    return docRef.id;
  }
}