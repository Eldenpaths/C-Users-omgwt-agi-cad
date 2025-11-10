/**
 * @file src/pages/api/agents/scan.ts
 * API endpoint to trigger the EchoArchivist (deep-scan) agent manually.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { EchoArchivistAgent } from '@/agents/echoArchivist';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { threads, embedding } = req.body;

  try {
    const scanInput = {
      mode: 'manual' as const,
      threads: threads || [],
      embedding: embedding || [],
    };
    
    const result = await EchoArchivistAgent.deepScan(scanInput);
    return res.status(200).json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[API /api/agents/scan] Error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}