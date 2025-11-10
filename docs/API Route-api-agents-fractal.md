/**
 * @file src/pages/api/agents/fractal.ts
 * API endpoint to trigger the Fractalwright (monitor) agent manually.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { FractalwrightAgent } from '@/agents/fractalwright';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { embedding, context } = req.body;

  if (!embedding || !Array.isArray(embedding)) {
    return res.status(400).json({ ok: false, error: 'Missing "embedding" (array) in request body' });
  }

  try {
    const monitorInput = {
      embedding: embedding,
      context: context || 'manual_api_call',
    };
    
    const result = await FractalwrightAgent.monitor(monitorInput);
    return res.status(200).json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[API /api/agents/fractal] Error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}