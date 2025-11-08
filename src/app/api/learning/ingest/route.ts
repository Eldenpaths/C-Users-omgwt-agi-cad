import { NextResponse } from 'next/server'
import { LabType, validateExperiment } from '@/lib/learning'
import { getAdminDb, serverTimestamp } from '@/lib/server/firebaseAdmin'

export const runtime = 'nodejs'

/**
 * POST /api/learning/ingest
 * Body: { labType: LabType, data: unknown, enableEmbeddings?: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const labType = LabType.parse(body?.labType)
    const rawData = body?.data ?? body // allow direct payloads

    // Validate experiment payload (throws on error)
    const data = validateExperiment(labType, rawData) as any

    // Build a compact summary (duplicated from LearningCore to avoid client imports)
    const base = `lab=${data.labType} success=${data.success ? '✓' : '✕'} runtimeMs=${data.runtimeMs}`
    let summary = base
    switch (data.labType) {
      case 'plasma':
        summary = `${base} T=${data.temperatureK}K ρ=${data.densityKgM3} conf=${data.confinementMethod}`
        break
      case 'spectral':
        summary = `${base} λ=${data.wavelengthNm}nm I=${data.intensity} inst=${data.instrument}`
        break
      case 'chemistry':
        summary = `${base} reagents=${data.reagents?.length ?? 0} T=${data.temperatureC}C yield=${data.yieldPercent ?? 'n/a'}%`
        break
      case 'crypto':
        summary = `${base} algo=${data.algorithm} size=${data.inputSizeBytes}B thr=${data.throughputOpsSec ?? 'n/a'}`
        break
    }

    const adminDb = getAdminDb()
    const docRef = await adminDb.collection('learning_sessions').add({
      ...data,
      summary,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ ok: true, id: docRef.id, summary })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
