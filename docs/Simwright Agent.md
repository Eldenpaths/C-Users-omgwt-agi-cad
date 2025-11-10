/**
 * @file src/agents/simwright.ts
 * Agent responsible for building and running simulations
 * (e.g., Plasma, Crypto).
 */

import { promises as fs } from 'fs';
import path from 'path';

interface SimSpec {
  type: string; // e.g., 'plasma_lab', 'crypto_market'
  target: string; // e.g., 'check_stability', 'run_trade_bot'
}

interface SimResult {
  status: string;
  files: string[];
}

/**
 * [STUB] Builds a prototype simulation file.
 * Attempts to write to /tmp only in a Node.js environment.
 * Returns a mock response in Edge/client environments.
 */
const buildPrototype = async (spec: SimSpec): Promise<SimResult> => {
  const files: string[] = [];

  // Check if we are in a Node.js environment (not Edge or browser)
  if (typeof process !== 'undefined' && process.release.name === 'node') {
    try {
      const fileName = `sim_${spec.type}_${Date.now()}.stub`;
      const filePath = path.join('/tmp', fileName); // Use /tmp for safety
      const fileContent = `// AGI-CAD Simwright Prototype\n// Type: ${spec.type}\n// Target: ${spec.target}\n`;
      
      await fs.writeFile(filePath, fileContent);
      files.push(filePath);
      
      return {
        status: 'prototype_built_node',
        files,
      };
    } catch (e: any) {
      console.warn('Simwright: Failed to write to /tmp', e.message);
      return { status: 'prototype_failed_write', files };
    }
  }

  // Fallback for non-Node environments (Edge, client)
  return {
    status: 'prototype_mock_edge',
    files: ['mock://sim.stub'],
  };
};

export const SimwrightAgent = {
  buildPrototype,
};