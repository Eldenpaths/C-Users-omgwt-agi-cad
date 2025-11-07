/**
 * @file scripts/smokeAgents.ts
 * Lightweight runner to verify Deep-Scan & Lab agents.
 *
 * Run with: pnpm exec tsx scripts/smokeAgents.ts
 */

import { EchoArchivistAgent } from '../src/agents/archivistAgent';
import { FractalwrightAgent } from '../src/agents/fractalwright';
import { MathwrightAgent } from '../src/agents/mathwright';
import { SimwrightAgent } from '../src/agents/simwright';

async function runSmoke() {
  console.log('--- AGI-CAD Smoke Runner ---');

  try {
    const echo = await EchoArchivistAgent.deepScan({ mode: 'auto' });
    console.log('\nEchoArchivist ?', JSON.stringify(echo));
  } catch (err) {
    console.error('EchoArchivist failed:', err);
  }

  try {
    const fractal = await FractalwrightAgent.monitor({
      embedding: Array.from({ length: 16 }, (_, i) => Math.sin(i) * 5 + Math.random()),
    });
    console.log('\nFractalwright ?', JSON.stringify(fractal));
  } catch (err) {
    console.error('Fractalwright failed:', err);
  }

  try {
    const proof = await MathwrightAgent.verify({ equation: '1+1=2', kind: 'algebra' });
    console.log('\nMathwright ?', JSON.stringify(proof));
  } catch (err) {
    console.error('Mathwright failed:', err);
  }

  try {
    const sim = await SimwrightAgent.buildPrototype({ type: 'plasma_lab', target: 'stability_check' });
    console.log('\nSimwright ?', JSON.stringify(sim));
  } catch (err) {
    console.error('Simwright failed:', err);
  }

  console.log('\nSmoke Runner Complete');
}

runSmoke().catch((e) => {
  console.error('Smoke Runner crashed:', e);
  process.exit(1);
});
