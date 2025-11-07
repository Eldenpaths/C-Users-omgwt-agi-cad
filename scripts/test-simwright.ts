import { SimwrightAgent } from '../src/agents/simwright'

async function main() {
  const res = await SimwrightAgent.buildPrototype({ type: 'plasma_lab', target: 'stability_check' })
  console.log(JSON.stringify(res))
}

main().catch(e=>{ console.error(e); process.exit(1) })

