/**
 * Phase 25C test harness — validate analytics helpers.
 */
import { groupRewardsByAgent, dailyRollup } from '@/lib/routerProfiles/profileAnalytics'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'

const now = Date.now()
const agents = ['EchoArchivist', 'Fractalwright', 'Mathwright', 'Simwright']

function fakeRewards(n = 20): RewardRecord[] {
  const out: RewardRecord[] = []
  for (let i = 0; i < n; i++) {
    const a = agents[i % agents.length]
    const delta = (Math.random() - 0.5) * 0.8
    const ts = now - i * 24 * 3600 * 1000 // daily steps back
    out.push({ taskId: `t_${i}`, agent: a, delta, timestamp: ts })
  }
  return out
}

async function main() {
  const rewards = fakeRewards(40)
  const grouped = groupRewardsByAgent(rewards)
  const roll = dailyRollup(rewards)
  console.log('Grouped agents:', Object.keys(grouped))
  console.log('Daily rollup sample:', roll.slice(0, 5))
}

main().catch((e) => { console.error(e); process.exit(1) })

