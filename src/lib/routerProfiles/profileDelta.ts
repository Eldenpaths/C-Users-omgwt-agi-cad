import type { AgentStats, RouteTask } from '@/lib/routerWeights'
import { expectedUtility } from '@/lib/routerWeights'

export function computeDelta(success: boolean, util: number) {
  const actual = success ? 1 : 0
  return actual - util
}

export function utilityFor(stats: AgentStats, task?: RouteTask) {
  return expectedUtility(stats, task)
}

