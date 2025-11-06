import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestoreInstance } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { LabType } from '@/lib/learning/validator';
import type { CVRASuggestion, LearningSessionLite, MetricAnomaly, CanonDeviation } from '@/lib/cognitive/interface';
import { summarize, zScore } from '@/lib/cognitive/anomaly';

type Body = {
  userId?: string;
  maxSessions?: number;
  threshold?: number; // z-score threshold, default 1.5
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, maxSessions = 300, threshold = 1.5 } = (req.body || {}) as Body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const firestore = getFirestoreInstance();
    const q = firestore
      .collection('learning_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(maxSessions);

    const snap = await q.get();
    const sessions: LearningSessionLite[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    // Group by lab
    const byLab = new Map<string, LearningSessionLite[]>();
    sessions.forEach((s) => {
      const lab = String(s.labType || 'unknown');
      if (!byLab.has(lab)) byLab.set(lab, []);
      byLab.get(lab)!.push(s);
    });

    let suggestionsCreated = 0;
    for (const [lab, items] of byLab.entries()) {
      suggestionsCreated += await processLab(firestore, userId, lab as LabType, items, threshold);
    }

    return res.status(200).json({ analyzedCount: sessions.length, suggestionsCreated });
  } catch (err: any) {
    console.error('[CVRA API] run failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function processLab(
  firestore: FirebaseFirestore.Firestore,
  userId: string,
  lab: LabType | string,
  items: LearningSessionLite[],
  threshold: number
): Promise<number> {
  // Metric selectors
  const metricSelectors: Array<{ key: string; sel: (s: LearningSessionLite) => number | undefined }> = [
    { key: 'metrics.runtimeMs', sel: (s) => s.metrics?.runtimeMs },
    { key: 'metrics.errorCount', sel: (s) => s.metrics?.errorCount },
    { key: 'data.yieldPercent', sel: (s) => (s.data ? num(s.data['yieldPercent']) : undefined) },
    { key: 'data.profitPct', sel: (s) => (s.data ? num(s.data['profitPct']) : undefined) },
    { key: 'data.temperatureKeV', sel: (s) => (s.data ? num(s.data['temperatureKeV']) : undefined) },
  ];

  const metricValues = new Map<string, number[]>();
  for (const { key, sel } of metricSelectors) {
    const vals = items.map(sel).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (vals.length > 0) metricValues.set(key, vals);
  }

  let created = 0;
  for (const s of items) {
    if (!s.metrics?.success) continue;
    const anomalies: MetricAnomaly[] = [];
    for (const { key, sel } of metricSelectors) {
      const v = sel(s);
      const arr = metricValues.get(key);
      if (typeof v !== 'number' || !arr || arr.length < 5) continue;
      const { mean: m, stdDev: sd } = summarize(arr);
      const z = zScore(v, m, sd);
      if (Math.abs(z) >= threshold) {
        anomalies.push({ metric: key, value: v, mean: m, stdDev: sd, z, direction: z > 0 ? 'high' : 'low' });
      }
    }
    if (anomalies.length === 0) continue;

    // Skip if suggestion exists
    const exists = await firestore
      .collection('cvra_suggestions')
      .where('userId', '==', userId)
      .where('sessionId', '==', s.id)
      .limit(1)
      .get();
    if (!exists.empty) continue;

    const top = anomalies[0];
    const proposedCanonDeviation = buildDeviation(lab as LabType, anomalies, s);
    const suggestion: CVRASuggestion = {
      userId,
      agentId: s.agentId,
      labType: lab,
      sessionId: s.id,
      reason: `Successful session with ${anomalies.length} anomalous metric(s) beyond ${threshold}σ; top: ${top.metric}`,
      anomalies,
      proposedCanonDeviation,
      createdAt: FieldValue.serverTimestamp(),
    };
    await firestore.collection('cvra_suggestions').add(suggestion as any);
    created += 1;
  }

  return created;
}

function num(x: any): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function buildDeviation(lab: LabType, anomalies: MetricAnomaly[], _session: LearningSessionLite): CanonDeviation {
  const suggestedChange: CanonDeviation['suggestedChange'] = [];
  const top = anomalies[0];
  const rationale = `Observed ${top.metric} ${top.direction} anomaly (z=${top.z.toFixed(2)}) with success=true`;
  for (const a of anomalies) {
    if (a.metric === 'metrics.runtimeMs') {
      suggestedChange.push({ key: 'runtime.targetMs', op: a.direction === 'low' ? 'decrease' : 'increase', magnitude: Math.round(Math.abs(a.z) * 0.1 * (a.mean || 1)) });
    } else if (a.metric === 'metrics.errorCount') {
      suggestedChange.push({ key: 'tolerance.errorBudget', op: a.direction === 'low' ? 'decrease' : 'increase', magnitude: Math.max(1, Math.round(Math.abs(a.z))) });
    } else if (a.metric === 'data.yieldPercent') {
      suggestedChange.push({ key: 'chemistry.yieldTarget', op: a.direction === 'low' ? 'decrease' : 'increase', magnitude: Math.round(Math.abs(a.z) * 2) });
    } else if (a.metric === 'data.profitPct') {
      suggestedChange.push({ key: 'crypto.riskThreshold', op: a.direction === 'high' ? 'increase' : 'decrease', magnitude: Math.round(Math.abs(a.z) * 1) });
    } else if (a.metric === 'data.temperatureKeV') {
      suggestedChange.push({ key: 'plasma.temperatureTargetKeV', op: a.direction === 'high' ? 'increase' : 'decrease', magnitude: Number((Math.abs(a.z) * 0.1).toFixed(2)) });
    }
  }
  return { targetLab: lab, suggestedChange, rationale };
}
