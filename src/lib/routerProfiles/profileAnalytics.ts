import type { RewardRecord } from './profileTypes'

export function groupRewardsByAgent(rewards: RewardRecord[]) {
  return (rewards || []).reduce((acc, r) => {
    const key = String(r.agent)
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {} as Record<string, RewardRecord[]>)
}

export function dailyRollup(rewards: RewardRecord[]) {
  const days: Record<string, { sum: number; count: number }> = {}
  for (const r of rewards || []) {
    const d = new Date(r.timestamp).toISOString().slice(0, 10)
    if (!days[d]) days[d] = { sum: 0, count: 0 }
    days[d].sum += Number(r.delta || 0)
    days[d].count++
  }
  return Object.entries(days).map(([date, { sum, count }]) => ({
    date,
    avg: Number((sum / Math.max(1, count)).toFixed(3)),
  }))
}

