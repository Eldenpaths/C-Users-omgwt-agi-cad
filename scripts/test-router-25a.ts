/**
 * scripts/test-router-25a.ts
 * Phase 25A scaffold — simulate multiple operator reward curves.
 * Note: Firestore writes are skipped unless client/admin SDKs are configured.
 */
import { __resetForTests, getSnapshot, recordOutcome, type AgentId } from '@/lib/routerWeights'
import { expectedUtility } from '@/lib/routerWeights'
import { updateProfile } from '@/lib/routerProfiles/profileStore'

function randBool(p = 0.5) { return Math.random() < p }

async function simulateFor(uid: string, steps = 5) {
  console.log(`\n-- Simulating for ${uid} --`)
  for (let i = 0; i < steps; i++) {
    // pick a random agent and emit an outcome
    const agents: AgentId[] = ['EchoArchivist', 'Fractalwright', 'Mathwright', 'Simwright']
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const success = randBool(0.6)
    const latency = Math.floor(500 + Math.random() * 1500)
    const taskId = `${uid}_t${i}_${Date.now()}`
    recordOutcome({ taskId, agent, success, latencyMs: latency, at: Date.now() })
    const stats = getSnapshot().agents[agent]
    const util = expectedUtility(stats)
    try {
      await updateProfile(uid, agent, taskId, success, util)
    } catch {
      // ignore Firestore errors in scaffold mode
    }
    console.log(`step ${i}: agent=${agent}, success=${success}, util=${util.toFixed(3)}`)
  }
}

async function main() {
  __resetForTests()
  await simulateFor('operator_A', 6)
  await simulateFor('operator_B', 6)
  console.log('\nDone.')
}

main().catch((e) => { console.error(e); process.exit(1) })

