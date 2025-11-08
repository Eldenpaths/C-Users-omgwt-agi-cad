import { getAdminDb } from '@/lib/server/firebaseAdmin'

export type TaskMetricRow = {
  agentId: string
  taskType: string
  generation: number
  speed: number
  accuracy: number
  efficiency: number
  fitness: number
  createdAt?: any
}

export async function recordTaskPerformance(row: TaskMetricRow) {
  const db = getAdminDb()
  await db.collection('evolution_metrics').add({
    ...row,
    createdAt: new Date(),
  })
}

