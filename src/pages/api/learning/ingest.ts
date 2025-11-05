import type { NextApiRequest, NextApiResponse } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreInstance } from '@/lib/firebase/server';
import { validateExperiment, formatZodIssues, LabType } from '@/lib/learning/validator';
import { generateEmbedding, storeEmbedding, getServiceStatus } from '@/lib/embeddings/vector-service';

type IngestBody = {
  labType: LabType | string;
  data: unknown;
  userId: string;
  agentId?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { labType, data, userId, agentId } = req.body as IngestBody;
    if (!labType || !userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'labType and userId are required' });
    }

    // Validate
    const v = validateExperiment(labType as LabType, data);
    if (!v.success) {
      const errors = formatZodIssues(v.errors);
      await writeTelemetry({ userId, agentId, labType, event: 'experiment_validation_failed', payload: { errors } });
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }

    const validData = v.data;

    // Persist learning session
    const firestore = getFirestoreInstance();
    const summary = buildSummary(labType as LabType, validData);
    const dataWithCommonFields = validData as { success: boolean; runtimeMs?: number; errors?: string[] };
    const metrics = {
      success: !!dataWithCommonFields.success,
      runtimeMs: dataWithCommonFields.runtimeMs,
      errorCount: Array.isArray(dataWithCommonFields.errors) ? dataWithCommonFields.errors.length : undefined,
    };

    const sessionRef = await firestore.collection('learning_sessions').add({
      userId,
      agentId,
      labType,
      data: validData,
      summary,
      metrics,
      createdAt: FieldValue.serverTimestamp(),
    });

    await writeTelemetry({ userId, agentId, labType, event: 'learning_session_created', payload: { sessionId: sessionRef.id } });

    // Embeddings (best-effort)
    let embeddingStored = false;
    try {
      const status = getServiceStatus();
      if (status.ready) {
        const vector = await generateEmbedding(summary);
        const metadata: Record<string, string | number | boolean> = {
          userId,
          labType,
          success: metrics.success
        };
        if (agentId) metadata.agentId = agentId;
        await storeEmbedding(sessionRef.id, vector, metadata);
        embeddingStored = true;
      }
    } catch (err) {
      // non-fatal
    }

    return res.status(200).json({ sessionId: sessionRef.id, embeddingStored });
  } catch (err: any) {
    console.error('[Learning Ingest API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function writeTelemetry(evt: { userId?: string; agentId?: string; labType?: string; event: string; payload?: unknown }) {
  try {
    const firestore = getFirestoreInstance();
    await firestore.collection('telemetry').add({
      ...evt,
      createdAt: FieldValue.serverTimestamp(),
      clientTimestamp: new Date(),
    });
  } catch (e) {
    // swallow
  }
}

function buildSummary<T extends LabType>(labType: T, data: unknown): string {
  const d = data as Record<string, unknown>;
  switch (labType) {
    case 'plasma':
      return `Plasma exp ${d.experimentId}: T=${d.temperatureKeV}keV, n=${d.density}, tau=${d.confinementTimeMs}ms, success=${d.success}`;
    case 'spectral':
      return `Spectral exp ${d.experimentId}: method=${d.method}, samples=${(d.wavelengthsNm as unknown[])?.length}, success=${d.success}`;
    case 'chemistry':
      return `Chemistry exp ${d.experimentId}: ${d.reaction}, yield=${d.yieldPercent}%, success=${d.success}`;
    case 'crypto':
      return `Crypto exp ${d.experimentId}: strat=${d.strategy}, pair=${d.pair}, profit=${d.profitPct}%, success=${d.success}`;
    default:
      return `Experiment ${String(d?.experimentId || '')} in ${String(labType)}`;
  }
}

