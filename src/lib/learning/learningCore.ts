
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
      const t0 = performance.now()

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
          const latency = Math.round(performance.now() - t0)
          await Telemetry.logEvent({ userId: 'batch', agentId: 'learning-core', labType: 'system', event: 'learning.batch.commit', meta: { batchSize: chunk.length, latencyMs: latency, attempt } })
          break
        } catch (e:any) {
          attempt++
          if (attempt > delays.length) {
            await Telemetry.logEvent({ userId: 'batch', agentId: 'learning-core', labType: 'system', event: 'learning.batch.error', meta: { batchSize: chunk.length, error: e?.message } })
            throw e
          }
          await new Promise(r => setTimeout(r, delays[attempt-1]))
        }
      }
    }
    return { ids }
  }

