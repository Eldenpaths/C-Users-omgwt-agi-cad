import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { handleTaskCompleted, type TaskRunMetrics } from '@/lib/neuroevolution/simAdapter'
import type { TaskContext } from '@/lib/neuroevolution/tasks'
import type { MultiObjectiveAgent } from '@/lib/neuroevolution/agent'

export const config = { api: { bodyParser: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  try {
    const { agentId, generation, task, agent, metrics } = req.body || {}
    if (!agentId || typeof generation !== 'number' || !task || !agent || !metrics) {
      return res.status(400).json({ ok: false, error: 'agentId, generation, task, agent, metrics required' })
    }

    const taskCtx = task as TaskContext
    const m = metrics as TaskRunMetrics
    const a = agent as MultiObjectiveAgent

    const result = await handleTaskCompleted({ agentId, task: taskCtx, generation, agent: a, metrics: m })
    return res.status(200).json({ ok: true, fitness: result.fitness })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
}

