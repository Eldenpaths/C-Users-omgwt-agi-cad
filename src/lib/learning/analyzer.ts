/**
 * Learning Infrastructure Core — Analyzer
 *
 * Pulls past experiments and telemetry to compute aggregate metrics
 * such as success rate, average runtime, and error frequency.
 * Future-ready: placeholders for ML/LLM suggestions.
 */

import { collection, getDocs, query, where, orderBy, limit, Firestore, Timestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';

export type LearningAnalyticsSummary = {
  userId?: string;
  agentId?: string;
  totalSessions: number;
  successRate: number; // 0..1
  averageRuntimeMs: number;
  errorFrequency: number; // errors per session
  byLab: Record<string, {
    total: number;
    successRate: number;
    averageRuntimeMs: number;
  }>;
  lastUpdated: string;
  suggestions?: string[]; // Future: LLM/ML suggestions
};

function numberOr<T>(n: T | undefined, fallback: T): T {
  return (n == null ? fallback : n);
}

export class Analyzer {
  private db: Firestore;

  constructor(db?: Firestore) {
    this.db = db ?? getFirestoreInstance();
  }

  /**
   * Load learning_sessions and telemetry for basic analytics.
   * Optional filters by userId/agentId.
   */
  async getSummary(filters?: { userId?: string; agentId?: string }): Promise<LearningAnalyticsSummary> {
    if (!this.db) throw new Error('Firestore is not available in this context.');

    // Pull sessions
    const sessionsCol = collection(this.db, 'learning_sessions');
    const sessionsQ = query(
      sessionsCol,
      ...(filters?.userId ? [where('userId', '==', filters.userId)] : []),
      ...(filters?.agentId ? [where('agentId', '==', filters.agentId)] : []),
      orderBy('createdAt', 'desc'),
      limit(2000)
    );
    const sessionsSnap = await getDocs(sessionsQ);

    let total = 0;
    let successes = 0;
    let runtimeSum = 0;
    const perLab: Record<string, { total: number; success: number; runtimeSum: number }> = {};

    sessionsSnap.forEach((doc) => {
      total += 1;
      const d = doc.data() || {};
      const lab: string = d.labType ?? 'unknown';
      const success: boolean = !!d.success;
      const runtime = numberOr<number>(d.runtimeMs, 0);

      if (!perLab[lab]) perLab[lab] = { total: 0, success: 0, runtimeSum: 0 };
      perLab[lab].total += 1;
      perLab[lab].runtimeSum += runtime;
      if (success) {
        successes += 1;
        perLab[lab].success += 1;
      }
      runtimeSum += runtime;
    });

    // Pull telemetry for basic error frequency
    const telemetryCol = collection(this.db, 'telemetry');
    const teleQ = query(
      telemetryCol,
      ...(filters?.userId ? [where('userId', '==', filters.userId)] : []),
      ...(filters?.agentId ? [where('agentId', '==', filters.agentId)] : []),
      orderBy('timestamp', 'desc'),
      limit(5000)
    );
    const teleSnap = await getDocs(teleQ);
    let errorEvents = 0;
    teleSnap.forEach((doc) => {
      const ev = (doc.data()?.event as string) || '';
      if (/error|fail|exception/i.test(ev)) errorEvents += 1;
    });

    const successRate = total ? successes / total : 0;
    const avgRuntime = total ? runtimeSum / total : 0;

    const byLab: LearningAnalyticsSummary['byLab'] = {};
    Object.entries(perLab).forEach(([lab, stats]) => {
      byLab[lab] = {
        total: stats.total,
        successRate: stats.total ? stats.success / stats.total : 0,
        averageRuntimeMs: stats.total ? stats.runtimeSum / stats.total : 0,
      };
    });

    // Placeholder: future ML/LLM insights
    const suggestions: string[] = [];
    if (avgRuntime > 60_000) suggestions.push('Consider batching or memoization to reduce runtime.');
    if (successRate < 0.4) suggestions.push('Tune hyperparameters or add validation gates for inputs.');

    return {
      userId: filters?.userId,
      agentId: filters?.agentId,
      totalSessions: total,
      successRate,
      averageRuntimeMs: avgRuntime,
      errorFrequency: total ? errorEvents / total : 0,
      byLab,
      lastUpdated: new Date().toISOString(),
      suggestions,
    };
  }
}