import { addDoc, collection, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { Telemetry } from './telemetry';
import {
  LabType,
  validateExperiment,
  ValidationResult,
  LabDataMap,
  formatZodIssues,
} from './validator';
import { generateEmbedding, storeEmbedding, getServiceStatus } from '@/lib/embeddings/vector-service';

/**
 * Learning session record stored in Firestore under `learning_sessions`.
 */
export interface LearningSessionRecord<T extends LabType = LabType> {
  userId: string;
  agentId?: string;
  labType: T;
  data: LabDataMap[T];
  summary: string;
  metrics: {
    success: boolean;
    runtimeMs?: number;
    errorCount?: number;
  };
  createdAt?: Timestamp | FieldValue;
}

export interface ProcessContext {
  userId: string;
  agentId?: string;
}

export interface ProcessResult {
  sessionId: string;
  embeddingStored: boolean;
}

/**
 * Utility: sleep for ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Utility: exponential backoff with jitter
 */
async function retryAsync<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 250
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const jitter = Math.random() * 0.2 + 0.9; // 10% jitter
      const delay = Math.pow(2, attempt - 1) * baseDelayMs * jitter;
      await sleep(delay);
    }
  }
}

/**
 * LearningCore orchestrates validation, telemetry, persistence, and embeddings
 * for lab experiment data traveling through AGI-CAD.
 */
export class LearningCore {
  /**
   * Process a lab experiment payload end-to-end:
   * - Validate with Zod
   * - Emit telemetry
   * - Persist to Firestore (`learning_sessions`)
   * - Generate Pinecone embedding from a concise summary
   */
  async processExperiment<T extends LabType>(
    labType: T,
    rawData: unknown,
    ctx: ProcessContext
  ): Promise<ProcessResult> {
    // 1) Validate
    const result = validateExperiment(labType, rawData) as ValidationResult<T>;
    if (!result.success) {
      await Telemetry.logEvent({
        userId: ctx.userId,
        agentId: ctx.agentId,
        labType,
        event: 'experiment_validation_failed',
        payload: { errors: formatZodIssues(result.errors) },
      });
      throw new Error(`Validation failed: ${formatZodIssues(result.errors).join('; ')}`);
    }

    const data = result.data;
    const experimentId = 'experimentId' in data ? (data as { experimentId: string }).experimentId : 'unknown';
    await Telemetry.logEvent({
      userId: ctx.userId,
      agentId: ctx.agentId,
      labType,
      event: 'experiment_validated',
      payload: { experimentId },
    });

    // 2) Prepare persistence payload
    const dataWithCommonFields = data as { success: boolean; runtimeMs?: number; errors?: string[] };
    const metrics = {
      success: dataWithCommonFields.success === true,
      runtimeMs: dataWithCommonFields.runtimeMs,
      errorCount: Array.isArray(dataWithCommonFields.errors) ? dataWithCommonFields.errors.length : undefined,
    };

    const summary = this.buildSummary(labType, data);

    const record: LearningSessionRecord<T> = {
      userId: ctx.userId,
      agentId: ctx.agentId,
      labType,
      data,
      summary,
      metrics,
      createdAt: serverTimestamp(),
    };

    // 3) Persist to Firestore with retry
    const db = getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized (client).');

    const sessionRef = await retryAsync(async () => {
      const ref = await addDoc(collection(db, 'learning_sessions'), record);
      return ref;
    }, 3, 300);

    await Telemetry.logEvent({
      userId: ctx.userId,
      agentId: ctx.agentId,
      labType,
      event: 'learning_session_created',
      payload: { sessionId: sessionRef.id },
    });

    // 4) Embeddings (best-effort)
    let embeddingStored = false;
    try {
      const status = getServiceStatus();
      if (status.ready) {
        const vector = await retryAsync(() => generateEmbedding(summary), 3, 500);
        const metadata: Record<string, string | number | boolean> = {
          userId: ctx.userId,
          labType,
          success: metrics.success,
        };
        if (ctx.agentId) metadata.agentId = ctx.agentId;

        await retryAsync(
          () => storeEmbedding(sessionRef.id, vector, metadata),
          3,
          500
        );
        embeddingStored = true;
      } else {
        // Non-fatal: embeddings are optional
        console.warn('[LearningCore] Embedding service not configured:', status.message);
      }
    } catch (err) {
      console.error('[LearningCore] Embedding pipeline failed:', err);
    }

    return { sessionId: sessionRef.id, embeddingStored };
  }

  /**
   * Build a concise textual summary for embeddings & dashboards.
   */
  private buildSummary<T extends LabType>(labType: T, data: LabDataMap[T]): string {
    if (labType === 'plasma') {
      const d = data as LabDataMap['plasma'];
      return `Plasma exp ${d.experimentId}: T=${d.temperatureKeV}keV, n=${d.density}, tau=${d.confinementTimeMs}ms, success=${d.success}`;
    }
    if (labType === 'spectral') {
      const d = data as LabDataMap['spectral'];
      return `Spectral exp ${d.experimentId}: method=${d.method}, samples=${d.wavelengthsNm?.length}, success=${d.success}`;
    }
    if (labType === 'chemistry') {
      const d = data as LabDataMap['chemistry'];
      return `Chemistry exp ${d.experimentId}: ${d.reaction}, yield=${d.yieldPercent}%, success=${d.success}`;
    }
    if (labType === 'crypto') {
      const d = data as LabDataMap['crypto'];
      return `Crypto exp ${d.experimentId}: strat=${d.strategy}, pair=${d.pair}, profit=${d.profitPct}%, success=${d.success}`;
    }
    const experimentId = 'experimentId' in data ? (data as { experimentId: string }).experimentId : '';
    return `Experiment ${String(experimentId)} in ${labType}`;
  }
}

export default LearningCore;

