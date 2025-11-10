/**
 * @file src/scripts/smokeAgents.ts
 * A tiny dev script to verify that all Deep-Scan and Lab agents
 * can be imported and executed without network calls.
 *
 * Run with: ts-node src/scripts/smokeAgents.ts
 * (Assumes `db` is null or Firebase client is mocked globally)
 */

import { EchoArchivistAgent } from '@/agents/echoArchivist';
import { FractalwrightAgent } from '@/agents/fractalwright';
import { SimwrightAgent } from '@/agents/simwright';
import { MathwrightAgent } from '@/agents/mathwright';

const runSmokeTest = async () => {
  console.log('--- Running AGI-CAD Agent Smoke Test ---');

  // 1. Test EchoArchivist (deepScan)
  console.log('\n[Test 1: EchoArchivist.deepScan]');
  try {
    const scanInput = { mode: 'auto' as const };
    const indexResult = await EchoArchivistAgent.deepScan(scanInput);
    console.log('EchoArchivist OK. Result:', JSON.stringify(indexResult, null, 2));
  } catch (e: any) {
    console.error('EchoArchivist FAILED.', e.message);
  }

  // 2. Test Fractalwright (monitor)
  console.log('\n[Test 2: Fractalwright.monitor]');
  try {
    // Mock embedding vector with some variance
    const mockEmbedding = Array.from({ length: 100 }, (_, i) =>
      Math.sin(i) * 100 + Math.random() * 5
    );
    const monitorInput = { embedding: mockEmbedding, context: 'smoke_test' };
    const metricsResult = await FractalwrightAgent.monitor(monitorInput);
    console.log('Fractalwright OK. Result:', JSON.stringify(metricsResult, null, 2));
  } catch (e: any) {
    console.error('Fractalwright FAILED.', e.message);
  }

  // 3. Test Simwright (buildPrototype)
  console.log('\n[Test 3: Simwright.buildPrototype]');
  try {
    const simInput = { type: 'plasma_lab', target: 'check_stability' };
    const simResult = await SimwrightAgent.buildPrototype(simInput);
    console.log('Simwright OK. Result:', JSON.stringify(simResult, null, 2));
  } catch (e: any) {
    console.error('Simwright FAILED.', e.message);
  }

  // 4. Test Mathwright (verify)
  console.log('\n[Test 4: Mathwright.verify]');
  try {
    const mathInput = { equation: '1+1=2', kind: 'algebra' as const };
    const mathResult = await MathwrightAgent.verify(mathInput);
    console.log('Mathwright OK. Result:', JSON.stringify(mathResult, null, 2));
  } catch (e: any) {
    console.error('Mathwright FAILED.', e.message);
  }

  console.log('\n--- Smoke Test Complete ---');
};

// Execute the test
runSmokeTest();