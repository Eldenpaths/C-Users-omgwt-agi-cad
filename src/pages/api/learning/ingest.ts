import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { verifyFirebaseToken } from '@/lib/security/auth';
import { validateExperiment } from '@/lib/learning/validator';
import { ServerLearningCore } from '@/lib/learning/serverCore';
import type { LabType } from '@/lib/learning/validator';

type IngestBody = {
  labType: LabType | string;
  payload: unknown; // raw experiment object
  userId?: string; // optional; defaults to auth user
  agentId?: string;
};

const BodySchema = z.object({
  labType: z.string().min(1),
  payload: z.unknown(),
  userId: z.string().optional(),
  agentId: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const verification = await verifyFirebaseToken(req);
  if (!verification.valid || !verification.user) {
    return res.status(401).json({ ok: false, error: verification.error ?? 'Unauthorized' });
  }

  try {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid body', details: parsed.error.flatten() });
    }

    const { labType, payload } = parsed.data as IngestBody;
    const uid = parsed.data.userId ?? verification.user.uid;

    // Enforce uid in payload
    const raw = { ...(payload as any), userId: uid };

    // Validate payload by lab type (throws on error)
    const valid = validateExperiment(labType as LabType, raw);

    // Server-only ingestion with embeddings and admin writes
    const core = new ServerLearningCore({ pineconeIndex: process.env.LEARNING_PINECONE_INDEX });
    const result = await core.ingest(valid.labType, valid);
    const metrics = { success: !!valid.success, runtimeMs: valid.runtimeMs ?? 0 };
    return res.status(200).json({ ok: true, id: result.docId, embedded: result.embedded, metrics });
  } catch (err: any) {
    const message = err?.message ?? 'Ingest failed';
    return res.status(422).json({ ok: false, error: message });
  }
}
