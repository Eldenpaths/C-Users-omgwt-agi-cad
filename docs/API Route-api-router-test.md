/**
 * @file src/pages/api/router-test.ts
 * Test endpoint for the AGI-CAD Intelligence Router.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { routeTask } from '@/core/router/IntelligenceRouter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { type, context } = req.body;

  if (!type) {
    return res.status(400).json({ ok: false, error: 'Missing "type" in request body' });
  }

  try {
    const taskPayload = { type, context: context || {} };
    const result = await routeTask(taskPayload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API /router-test] Error:', error);
    return res.status(500).json({ ok: false, error: error.message, echo: req.body });
  }
}