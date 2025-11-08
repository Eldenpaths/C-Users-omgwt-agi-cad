import { validateExperiment, AnyExperiment } from './validator';

/**
 * Server-only Learning Core: uses Firebase Admin Firestore and performs
 * Pinecone embeddings. Do not import this file in client code.
 */
export interface ServerLearningCoreOptions {
  pineconeIndex?: string;
}

export interface IngestServerResult {
  docId: string;
  embedded: boolean;
}

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

export class ServerLearningCore {
  private pineconeIndex?: string;

  constructor(options: ServerLearningCoreOptions = {}) {
    if (typeof window !== 'undefined') throw new Error('ServerLearningCore must not be used in client code');
    this.pineconeIndex = options.pineconeIndex;
  }

  async ingest(labType: AnyExperiment['labType'], data: unknown): Promise<IngestServerResult> {
    const exp = validateExperiment(labType, data);

    // Write telemetry via Admin (best-effort)
    await this.writeTelemetryAdmin({
      userId: exp.userId,
      agentId: exp.agentId,
      labType: exp.labType,
      event: 'experiment_ingest',
      timestamp: exp.timestamp,
      meta: { experimentId: exp.experimentId, success: exp.success },
    }).catch(() => {});

    const docId = await this.writeSessionAdmin(exp);

    let embedded = false;
    try {
      if (await this.canUseEmbeddings()) embedded = await this.generateAndUpsertEmbedding(exp);
    } catch (err) {
      // non-fatal
    }

    return { docId, embedded };
  }

  private async writeSessionAdmin(exp: AnyExperiment): Promise<string> {
    const { getFirestoreInstance } = await import('@/lib/firebase/server');
    const db = getFirestoreInstance();
    const payload = { ...exp, createdAt: (await import('firebase-admin/firestore')).FieldValue.serverTimestamp() } as any;
    const ref = await withRetry(async () => db.collection('learning_sessions').add(payload));
    return ref.id as string;
  }

  private async writeTelemetryAdmin(evt: { userId: string; agentId?: string; labType?: string; event: string; timestamp?: number; meta?: any }) {
    const { getFirestoreInstance } = await import('@/lib/firebase/server');
    const db = getFirestoreInstance();
    const { FieldValue } = await import('firebase-admin/firestore');
    await withRetry(async () => db.collection('telemetry').add({ ...evt, createdAt: FieldValue.serverTimestamp() }));
  }

  private async canUseEmbeddings(): Promise<boolean> {
    if (!this.pineconeIndex) return false;
    if (!process.env.PINECONE_API_KEY) return false;
    if (!process.env.OPENAI_API_KEY) return false;
    return true;
  }

  private async generateAndUpsertEmbedding(exp: AnyExperiment): Promise<boolean> {
    if (!exp.summary || exp.summary.trim().length === 0) return false;
    const { Pinecone } = (await import('@pinecone-database/pinecone')) as any;
    const { OpenAIEmbeddings } = (await import('@langchain/openai')) as any;
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index(this.pineconeIndex!);
    const embedder = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY! });
    const vector = await withRetry(async () => embedder.embedQuery(exp.summary));
    const record = {
      id: exp.experimentId,
      values: vector as number[],
      metadata: {
        userId: exp.userId,
        agentId: exp.agentId,
        labType: exp.labType,
        success: exp.success,
        runtimeMs: exp.runtimeMs ?? 0,
        timestamp: exp.timestamp,
      } as Record<string, any>,
    };
    await withRetry(async () => index.upsert([record]));
    return true;
  }
}

export default ServerLearningCore;

