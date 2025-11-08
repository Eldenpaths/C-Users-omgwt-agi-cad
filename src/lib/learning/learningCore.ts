import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';
import { validateExperiment, AnyExperiment } from './validator';
import Telemetry from './telemetry';

/**
 * Configuration for LearningCore.
 */
export interface LearningCoreOptions {}

/**
 * Result returned after ingesting an experiment.
 */
export interface IngestResult {
  docId: string;
  embedded: boolean;
}

/**
 * Utility: exponential backoff with jitter.
 */
async function withRetry<T>(fn: () => Promise<T>, opts?: { retries?: number; baseMs?: number; maxMs?: number }): Promise<T> {
  const retries = opts?.retries ?? 5;
  const baseMs = opts?.baseMs ?? 150;
  const maxMs = opts?.maxMs ?? 2000;

  let lastErr: unknown = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      const delay = Math.min(maxMs, baseMs * Math.pow(2, i)) * (0.75 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('withRetry failed');
}

/**
 * LearningCore coordinates validation, telemetry, persistence to Firestore,
 * and optional Pinecone embeddings for experiment summaries.
 */
export class LearningCore {
  constructor(_options: LearningCoreOptions = {}) {}

  /**
   * Ingest a raw experiment payload. Validates the data, logs telemetry,
   * persists to Firestore `learning_sessions`, and attempts to embed the
   * summary to Pinecone (server-side only, when configured).
   */
  async ingest(labType: AnyExperiment['labType'], data: unknown): Promise<IngestResult> {
    // 1) Validate
    const exp = validateExperiment(labType, data);

    // 2) Telemetry
    await Telemetry.logEvent({
      userId: exp.userId,
      agentId: exp.agentId,
      labType: exp.labType,
      event: 'experiment_ingest',
      timestamp: exp.timestamp,
      meta: { experimentId: exp.experimentId, success: exp.success },
    });

    // 3) Persist
    const docId = await this.writeToFirestore(exp);

    // Client-side LearningCore does not do embeddings; server handles that.
    return { docId, embedded: false };
  }

  /**
   * Firestore write with retry. Collection: `learning_sessions`.
   */
  private async writeToFirestore(exp: AnyExperiment): Promise<string> {
    const db = getDbInstance();
    if (!db) throw new Error('Firestore client not available');
    const payload = { ...exp, createdAt: serverTimestamp() } as any;
    const ref = await withRetry(async () => addDoc(collection(db, 'learning_sessions'), payload));
    return ref.id;
  }
}

export default LearningCore;
