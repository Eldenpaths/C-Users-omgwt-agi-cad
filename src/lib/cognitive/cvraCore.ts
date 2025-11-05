import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  limit,
  getDocs as getDocsAlias,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import type { LabType } from '@/lib/learning/validator';
import type { LearningSessionLite, MetricAnomaly, CVRASuggestion, CVRAResult, CanonDeviation } from './interface';
import { detectIndicesBeyondThreshold, summarize, zScore } from './anomaly';

/**
 * Canon‑Vault Reconciliation Agent (CVRA)
 *
 * Scans learning_sessions for a user, computes simple per‑lab baselines, and
 * proposes CANON deviations when successful sessions exhibit >1.5σ anomalies.
 */
export class CVRAgent {
  constructor(private threshold = 1.5) {}

  /**
   * Analyze a user's sessions and write suggestions to `cvra_suggestions`.
   */
  async analyzeUser(userId: string, opts?: { maxSessions?: number }): Promise<CVRAResult> {
    const db = getFirestoreInstance();
    if (!db) throw new Error('Firestore not initialized');

    const sessionsQ = query(
      collection(db, 'learning_sessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(opts?.maxSessions ?? 200)
    );
    const snap = await getDocs(sessionsQ);
    const sessions: LearningSessionLite[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LearningSessionLite));

    // Group by labType
    const byLab = new Map<string, LearningSessionLite[]>();
    for (const s of sessions) {
      const key = String(s.labType || 'unknown');
      if (!byLab.has(key)) byLab.set(key, []);
      byLab.get(key)!.push(s);
    }

    let suggestionsCreated = 0;
    for (const [lab, items] of byLab.entries()) {
      suggestionsCreated += await this.processLab(userId, lab, items);
    }

    return {
      userId,
      analyzedCount: sessions.length,
      suggestionsCreated,
      notes: ['Threshold: ' + this.threshold],
    };
  }

  /**
   * For a specific lab, compute baselines and create suggestions when needed.
   */
  private async processLab(
    userId: string,
    lab: string,
    items: LearningSessionLite[]
  ): Promise<number> {
    const db = getFirestoreInstance();
    if (!db) return 0;

    // Candidate numeric metrics across labs
    const metricSelectors: Array<{
      key: string;
      selector: (s: LearningSessionLite) => number | undefined;
    }> = [
      { key: 'metrics.runtimeMs', selector: (s) => s.metrics?.runtimeMs },
      { key: 'metrics.errorCount', selector: (s) => s.metrics?.errorCount },
      // Lab‑specific hints
      { key: 'data.yieldPercent', selector: (s) => (s.data ? numberOrUndef(s.data['yieldPercent']) : undefined) },
      { key: 'data.profitPct', selector: (s) => (s.data ? numberOrUndef(s.data['profitPct']) : undefined) },
      { key: 'data.temperatureKeV', selector: (s) => (s.data ? numberOrUndef(s.data['temperatureKeV']) : undefined) },
    ];

    // Prepare arrays per metric
    const metricValues = new Map<string, number[]>();
    for (const { key, selector } of metricSelectors) {
      const vals = items
        .map(selector)
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      if (vals.length > 0) metricValues.set(key, vals);
    }

    let created = 0;
    for (const session of items) {
      if (!session.metrics?.success) continue; // Focus on anomalous success only

      const anomalies: MetricAnomaly[] = [];
      for (const { key, selector } of metricSelectors) {
        const value = selector(session);
        const values = metricValues.get(key);
        if (typeof value !== 'number' || !values || values.length < 5) continue;
        const { mean: m, stdDev: sd } = summarize(values);
        const z = zScore(value, m, sd);
        if (Math.abs(z) >= this.threshold) {
          anomalies.push({
            metric: key,
            value,
            mean: m,
            stdDev: sd,
            z,
            direction: z > 0 ? 'high' : 'low',
          });
        }
      }

      if (anomalies.length === 0) continue;

      // De‑dupe: skip if we already suggested for this session
      const exists = await this.suggestionExists(userId, session.id);
      if (exists) continue;

      const suggestion: CVRASuggestion = {
        userId,
        agentId: session.agentId,
        labType: lab as LabType,
        sessionId: session.id,
        reason: 'Successful session with metric deviations beyond threshold',
        anomalies,
        proposedCanonDeviation: this.buildDeviation(lab, anomalies, session),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'cvra_suggestions'), suggestion);
      created += 1;
    }

    return created;
  }

  /**
   * Build a structured CANON deviation suggestion from detected anomalies.
   */
  private buildDeviation(lab: string, anomalies: MetricAnomaly[], session: LearningSessionLite): CanonDeviation {
    const top = anomalies[0];
    const suggestedChange: CanonDeviation['suggestedChange'] = [];
    const rationale = `Observed ${top.metric} ${top.direction} anomaly (z=${top.z.toFixed(2)}) with success=true`;

    for (const a of anomalies) {
      // Heuristic mapping from metrics to suggested CANON parameters
      if (a.metric === 'metrics.runtimeMs') {
        suggestedChange.push({
          key: 'runtime.targetMs',
          op: a.direction === 'low' ? 'decrease' : 'increase',
          magnitude: Math.round(Math.abs(a.z) * 0.1 * (a.mean || 1))
        });
      } else if (a.metric === 'metrics.errorCount') {
        suggestedChange.push({
          key: 'tolerance.errorBudget',
          op: a.direction === 'low' ? 'decrease' : 'increase',
          magnitude: Math.max(1, Math.round(Math.abs(a.z)))
        });
      } else if (a.metric === 'data.yieldPercent') {
        suggestedChange.push({
          key: 'chemistry.yieldTarget',
          op: a.direction === 'low' ? 'decrease' : 'increase',
          magnitude: Math.round(Math.abs(a.z) * 2)
        });
      } else if (a.metric === 'data.profitPct') {
        suggestedChange.push({
          key: 'crypto.riskThreshold',
          op: a.direction === 'high' ? 'increase' : 'decrease',
          magnitude: Math.round(Math.abs(a.z) * 1)
        });
      } else if (a.metric === 'data.temperatureKeV') {
        suggestedChange.push({
          key: 'plasma.temperatureTargetKeV',
          op: a.direction === 'high' ? 'increase' : 'decrease',
          magnitude: Number((Math.abs(a.z) * 0.1).toFixed(2))
        });
      }
    }

    return {
      targetLab: lab,
      suggestedChange,
      rationale,
    };
  }

  private async suggestionExists(userId: string, sessionId: string): Promise<boolean> {
    const db = getFirestoreInstance();
    if (!db) return false;
    const qRef = query(
      collection(db, 'cvra_suggestions'),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId)
    );
    const snap = await getDocsAlias(qRef);
    return !snap.empty;
  }
}

function numberOrUndef(x: unknown): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

export default CVRAgent;

