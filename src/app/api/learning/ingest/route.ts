import { NextResponse } from 'next/server'
import { LabType, validateExperiment } from '@/lib/learning/validator'
import { getAdminDb, serverTimestamp } from '@/lib/server/firebaseAdmin'

export const runtime = 'nodejs'

/**
 * POST /api/learning/ingest
 * Body options:
 * - Single: { labType: LabType, data: unknown }
 * - Batch:  { dataPoints: Array<{ labType: LabType, data: unknown }>} (up to many; commits in chunks of 500)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const adminDb = getAdminDb()

    if (Array.isArray(body?.dataPoints)) {
      // Batch path
      const points = body.dataPoints as Array<{ labType: LabType, data: unknown }>
      if (!points.length) return NextResponse.json({ ok: false, error: 'Empty dataPoints' }, { status: 400 })

      const chunks: typeof points[] = []
      for (let i = 0; i < points.length; i += 500) chunks.push(points.slice(i, i + 500))

      let total = 0
      let succeeded = 0
      let failed = 0
      const ids: string[] = []

      for (const chunk of chunks) {
        const batch = adminDb.batch()
        const t0 = Date.now()
        for (const item of chunk) {
          const labType = item.labType
          const data = validateExperiment(labType, item.data) as any
          const ref = adminDb.collection('learning_sessions').doc()
          batch.set(ref, { ...data, createdAt: serverTimestamp() })
          ids.push(ref.id)
        }
        
        // Retry logic: 3 attempts with exponential backoff (100ms, 200ms, 400ms)
        let attempt = 0
        const maxAttempts = 3
        const delays = [100, 200, 400]
        
        while (attempt < maxAttempts) {
          try {
            await batch.commit()
            const duration = Date.now() - t0
            total += chunk.length
            succeeded += chunk.length
            
            // Console logging for monitoring
            console.log(`[Firestore] Batch committed: ${chunk.length} writes in ${duration}ms${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`)
            
            // Telemetry logging
            await adminDb.collection('telemetry').add({
              userId: 'batch',
              agentId: 'learning-core',
              labType: 'system',
              event: 'learning.batch.commit',
              timestamp: serverTimestamp(),
              meta: { batchSize: chunk.length, latencyMs: duration, attempt: attempt + 1 }
            })
            break
          } catch (e: any) {
            attempt++
            if (attempt >= maxAttempts) {
              total += chunk.length
              failed += chunk.length
              console.error(`[Firestore] Batch failed after ${maxAttempts} attempts:`, e?.message)
              
              await adminDb.collection('telemetry').add({
                userId: 'batch',
                agentId: 'learning-core',
                labType: 'system',
                event: 'learning.batch.error',
                timestamp: serverTimestamp(),
                meta: { batchSize: chunk.length, error: e?.message, attempts: maxAttempts }
              })
              throw e
            }
            console.warn(`[Firestore] Batch attempt ${attempt} failed, retrying in ${delays[attempt - 1]}ms...`)
            await new Promise(r => setTimeout(r, delays[attempt - 1]))
          }
        }
      }

      console.log(`[Firestore] Batch processing complete. Total: ${total}, Succeeded: ${succeeded}, Failed: ${failed}, Success Rate: ${total > 0 ? (succeeded / total) * 100 : 100}%`);

      return NextResponse.json({ ok: true, total, succeeded, failed, ids });
    }

    // Single path (backwards compatible)
    const labType = body?.labType as LabType;
    const rawData = body?.data ?? body
    const data = validateExperiment(labType, rawData) as any

    const t0 = Date.now()
    const docRef = await getAdminDb().collection('learning_sessions').add({ ...data, createdAt: serverTimestamp() })
    const latency = Date.now() - t0
    await adminDb.collection('telemetry').add({
      userId: data.userId ?? 'unknown', agentId: data.agentId ?? 'unknown', labType, event: 'learning.write.single',
      timestamp: serverTimestamp(), meta: { latencyMs: latency }
    })

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
