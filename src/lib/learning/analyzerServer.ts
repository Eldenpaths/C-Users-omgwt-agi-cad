/**
 * Server-side analyzer using Firebase Admin.
 * Computes aggregated metrics by labType for a given user.
 */

import { getAdminDb } from '@/lib/server/firebaseAdmin'

export type LabTypeSegment = {
  experiments: number
  successes: number
  successRate: number
  avgRuntimeMs: number
}

export type ServerTotals = {
  experiments: number
  successes: number
  successRate: number
  avgRuntimeMs: number
}

export type ServerAnalytics = {
  userId?: string
  totals: ServerTotals
  segments: Record<string, LabTypeSegment>
}

export async function analyzeLearningTrendsServer(userId?: string): Promise<ServerAnalytics> {
  const db = getAdminDb()
  let snap
  if (userId) {
    snap = await db.collection('learning_sessions').where('userId', '==', userId).get()
  } else {
    snap = await db.collection('learning_sessions').get()
  }

  const rows = snap.docs.map(d => d.data() as any)
  const segments: Record<string, LabTypeSegment> = {}
  const totals: ServerTotals = { experiments: 0, successes: 0, successRate: 0, avgRuntimeMs: 0 }

  for (const s of rows) {
    const key = String(s.labType ?? 'unknown')
    if (!segments[key]) segments[key] = { experiments: 0, successes: 0, successRate: 0, avgRuntimeMs: 0 }
    segments[key].experiments += 1
    if (s.success) segments[key].successes += 1
    segments[key].avgRuntimeMs += s.runtimeMs ?? 0

    totals.experiments += 1
    if (s.success) totals.successes += 1
    totals.avgRuntimeMs += s.runtimeMs ?? 0
  }

  for (const k of Object.keys(segments)) {
    const seg = segments[k]
    seg.successRate = seg.experiments ? seg.successes / seg.experiments : 0
    seg.avgRuntimeMs = seg.experiments ? Math.round(seg.avgRuntimeMs / seg.experiments) : 0
  }

  totals.successRate = totals.experiments ? totals.successes / totals.experiments : 0
  totals.avgRuntimeMs = totals.experiments ? Math.round(totals.avgRuntimeMs / totals.experiments) : 0

  return { userId, totals, segments }
}

export default analyzeLearningTrendsServer
