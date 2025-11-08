/**
 * Learning Infrastructure Core - Orchestrator
 *
 * Handles experiment ingestion for labs:
 *  - Validates with Zod schemas (validator.ts)
 *  - Logs telemetry events (telemetry.ts)
 *  - Persists to Firestore collection `learning_sessions`
 *  - Optionally generates embeddings and upserts to Pinecone (graceful fallback)
 *  - Supports batch writes with exponential backoff
 */

import {
  collection,
  CollectionReference,
  doc,
  Firestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { getFirestoreInstance } from '@/lib/firebase'
import {
  AnyExperiment,
  LabType,
  validateExperiment,
} from './validator'
import { Telemetry } from './telemetry'

/** Options for ingest calls */
export type IngestOptions = {
  /** Optional human summary to embed */
  summary?: string
  /** Whether to attempt embeddings + Pinecone upsert (default true) */
  embed?: boolean
}

/**
 * Attempts to dynamically load an embeddings implementation from LangChain
 * or OpenAI. Returns undefined if dependencies/env are missing.
 */
async function getEmbeddingsImpl() {
  try {
    // Try LangChain v0.2+ first
    const mod = await import('@langchain/openai')
    if ((mod as any).OpenAIEmbeddings) {
      return new (mod as any).OpenAIEmbeddings({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      })
    }
  } catch {}
  try {
    // Try older LangChain location
    const mod = await import('langchain/embeddings/openai')
    if ((mod as any).OpenAIEmbeddings) {
      return new (mod as any).OpenAIEmbeddings({
        modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      })
    }
  } catch {}
  // Graceful fallback (no embeddings)
  return undefined
}

/**
 * Attempts to initialize Pinecone client and return an index handle.
 * Returns undefined on failure or missing configuration.
 */
async function getPineconeIndex() {
  try {
    const apiKey = process.env.PINECONE_API_KEY
    const indexName = process.env.PINECONE_INDEX || 'agi-cad-learning'
    if (!apiKey) return undefined
    const { Pinecone } = await import('@pinecone-database/pinecone')
    const pc = new Pinecone({ apiKey })
    const index = pc.index(indexName)
    return index
  } catch {
    return undefined
  }
}

/**
 * Build a concise summary string for embeddings when caller does not provide one.
 */
function buildAutoSummary(exp: AnyExperiment): string {
  const { labType, userId, agentId, runId } = exp as any
  const core = `[lab=${labType}] user=${userId} agent=${agentId} run=${runId ?? 'n/a'}`
  const p = (exp as any).parameters ? JSON.stringify((exp as any).parameters) : ''
  const m = (exp as any).measurements ? JSON.stringify((exp as any).measurements) : ''
  return `${core} parameters=${p} measurements=${m}`.slice(0, 1500)
}

export class LearningCore {
  private db: Firestore
  private sessionsCol: CollectionReference

  constructor(db?: Firestore) {
    this.db = db ?? (getFirestoreInstance() as any)
    if (!this.db) throw new Error('Firestore is not available in this context.')
    this.sessionsCol = collection(this.db, 'learning_sessions') as CollectionReference
  }

  /**
   * Ingest a single experiment record.
   * - Validates payload
   * - Persists to Firestore
   * - Emits telemetry for timing and result
   * - Optionally generates embeddings + Pinecone upsert
   */
  async ingest(
    labType: LabType,
    data: unknown,
    options: IngestOptions = { embed: true }
  ): Promise<{ id: string }>
  {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const validated = validateExperiment(labType, data) as AnyExperiment
    const ref = doc(this.sessionsCol)

    // Write with retries (100ms, 200ms, 400ms)
    const delays = [100, 200, 400]
    let attempt = 0
    while (true) {
      try {
        await setDoc(ref, {
          ...validated,
          createdAt: serverTimestamp(),
          summary: options.summary,
        })
        const latencyMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
        await Telemetry.logEvent({
          userId: validated.userId,
          agentId: validated.agentId,
          labType: validated.labType,
          event: 'learning.write.single',
          runId: (validated as any).runId,
          meta: { latencyMs }
        })

        // Embeddings + Pinecone (best-effort)
        if (options.embed !== false) {
          this.embedAndUpsert(ref.id, options.summary ?? buildAutoSummary(validated), validated).catch(() => {})
        }

        return { id: ref.id }
      } catch (e: any) {
        attempt++
        if (attempt > delays.length) {
          await Telemetry.logEvent({
            userId: validated.userId,
            agentId: validated.agentId,
            labType: validated.labType,
            event: 'learning.write.error',
            runId: (validated as any).runId,
            meta: { message: e?.message }
          }).catch(() => {})
          throw e
        }
        await new Promise((r) => setTimeout(r, delays[attempt - 1]))
      }
    }
  }

  /**
   * Batch ingest multiple records with Firestore writeBatch (500 writes max per batch).
   * Tracks latency and batch size telemetry, applies exponential backoff (100/200/400ms).
   */
  async ingestBatch(items: Array<{ labType: LabType; data: unknown; summary?: string }>): Promise<{ ids: string[] }> {
    const ids: string[] = []
    const db = this.db
    const colRef = this.sessionsCol

    const chunks: typeof items[] = []
    for (let i = 0; i < items.length; i += 500) chunks.push(items.slice(i, i + 500))

    for (const chunk of chunks) {
      const batch = writeBatch(db)
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()

      for (const it of chunk) {
        const validated = validateExperiment(it.labType, it.data) as AnyExperiment
        const ref = doc(colRef)
        batch.set(ref, { ...validated, createdAt: serverTimestamp(), summary: it.summary })
        ids.push(ref.id)
      }

      let attempt = 0
      const delays = [100, 200, 400]
      while (true) {
        try {
          await batch.commit()
          const latency = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
          await Telemetry.logEvent({ userId: 'batch', agentId: 'learning-core', labType: 'system', event: 'learning.batch.commit', meta: { batchSize: chunk.length, latencyMs: latency, attempt } }).catch(() => {})
          break
        } catch (e:any) {
          attempt++
          if (attempt > delays.length) {
            await Telemetry.logEvent({ userId: 'batch', agentId: 'learning-core', labType: 'system', event: 'learning.batch.error', meta: { batchSize: chunk.length, error: e?.message } }).catch(() => {})
            throw e
          }
          await new Promise(r => setTimeout(r, delays[attempt-1]))
        }
      }
    }
    return { ids }
  }

  /**
   * Generate embeddings for the provided summary and upsert to Pinecone.
   * This method is best-effort and will silently no-op if dependencies
   * or configuration are missing.
   */
  private async embedAndUpsert(id: string, summary: string, exp: AnyExperiment): Promise<void> {
    try {
      const embeddings = await getEmbeddingsImpl()
      if (!embeddings) return
      const [vec] = await embeddings.embedDocuments([summary])
      if (!vec || !Array.isArray(vec)) return

      const index = await getPineconeIndex()
      if (!index) return

      await index.upsert([
        {
          id,
          values: vec as number[],
          metadata: {
            userId: (exp as any).userId,
            agentId: (exp as any).agentId,
            labType: (exp as any).labType,
            runId: (exp as any).runId,
            summary,
          } as Record<string, any>,
        },
      ])
    } catch {
      // Best-effort: ignore embedding/indexing failures
    }
  }
}

