import { MathwrightAgent } from '../src/agents/mathwright'

async function main() {
  const res = await MathwrightAgent.verify({ equation: '1+1=2', kind: 'algebra' })
  console.log(JSON.stringify(res))
}

main().catch(e=>{ console.error(e); process.exit(1) })

