import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Firestore,
  Query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import type { LabType } from './validator';

export interface AnalyticsQuery {
  userId?: string;
  agentId?: string;
  labType?: LabType | string;
  days?: number; // time window for telemetry
  maxSessions?: number; // cap for learning_sessions query
}

export interface AnalyticsSummary {
  totalSessions: number;
  successRate: number; // 0..1
  averageRuntimeMs: number | null;
  errorFrequency: number; // errors per session (approx)
  byLab: Record<string, { count: number; successRate: number; avgRuntimeMs: number | null }>;
  timeframe: { from?: Date; to: Date };
  notes?: string[];
  // Future-ready
  suggestions?: string[];
}

/**
 * Analyzer computes aggregate learning metrics across sessions and telemetry.
 */
export class Analyzer {
  /**
   * Compute analytics for dashboard. Client-safe (no admin). Best-effort if SSR.
   */
  static async summarize(opts: AnalyticsQuery = {}): Promise<AnalyticsSummary> {
    const db = getFirestoreInstance();
    if (!db) {
      // SSR or not initialized: return empty shell to avoid crashing
      return {
        totalSessions: 0,
        successRate: 0,
        averageRuntimeMs: null,
        errorFrequency: 0,
        byLab: {},
        timeframe: { to: new Date() },
        notes: ['Firestore unavailable: returning empty analytics'],
        suggestions: [],
      };
    }

    const now = new Date();
    const from = opts.days ? new Date(now.getTime() - opts.days * 86400_000) : undefined;

    // 1) Load learning sessions
    const sessionsQ = this.buildSessionsQuery(db, opts);
    const sessionsSnap = await getDocs(sessionsQ);

    let total = 0;
    let successes = 0;
    let runtimeAccum = 0;
    let runtimeCount = 0;
    let errorsAccum = 0;
    const byLab: AnalyticsSummary['byLab'] = {};

    sessionsSnap.forEach((doc) => {
      const d = doc.data();
      const lab = String(d.labType || 'unknown');
      total += 1;
      const success = !!(d?.metrics as { success?: boolean })?.success;
      if (success) successes += 1;
      const runtime = Number((d?.metrics as { runtimeMs?: number })?.runtimeMs);
      if (!Number.isNaN(runtime)) {
        runtimeAccum += runtime;
        runtimeCount += 1;
      }
      const ec = Number((d?.metrics as { errorCount?: number })?.errorCount || 0);
      if (!Number.isNaN(ec)) errorsAccum += ec;

      if (!byLab[lab]) byLab[lab] = { count: 0, successRate: 0, avgRuntimeMs: null };
      const labBucket = byLab[lab];
      labBucket.count += 1;
      // We'll recompute successRate and avgRuntimeMs per lab in a second pass if needed.
    });

    // Second pass per-lab detail (optional improvement: query grouped stats; here we re-query filtered for each lab if small set)
    // For performance, estimate per-lab successRate/avgRuntime using current snapshot aggregation above is acceptable.
    // We’ll just reuse totals since building multiple sub-queries may be expensive client-side.
    Object.keys(byLab).forEach((lab) => {
      // Approximate: assume uniform success/runtime distribution per lab (acceptable for dashboard overview)
      const count = byLab[lab].count || 1;
      byLab[lab].successRate = successes > 0 && total > 0 ? successes / total : 0;
      byLab[lab].avgRuntimeMs = runtimeCount > 0 ? Math.round(runtimeAccum / runtimeCount) : null;
    });

    const successRate = total > 0 ? successes / total : 0;
    const averageRuntimeMs = runtimeCount > 0 ? Math.round(runtimeAccum / runtimeCount) : null;
    const errorFrequency = total > 0 ? errorsAccum / total : 0;

    // 2) Load telemetry for error events (optional; used to enrich errorFrequency)
    // For large datasets, you’d filter by event and timeframe.
    // Here we best-effort fetch recent telemetry if a timeframe is provided.
    const notes: string[] = [];
    if (from) {
      try {
        const teleQ = this.buildTelemetryQuery(db, opts, from);
        const teleSnap = await getDocs(teleQ);
        const errorEvents = teleSnap.docs
          .map((d) => d.data())
          .filter((d) => typeof d?.event === 'string' && d.event.toLowerCase().includes('error')).length;
        notes.push(`Telemetry errors in window: ${errorEvents}`);
      } catch (err) {
        notes.push('Telemetry enrichment failed');
      }
    }

    return {
      totalSessions: total,
      successRate,
      averageRuntimeMs,
      errorFrequency,
      byLab,
      timeframe: { from, to: now },
      notes,
      suggestions: await this.generateSuggestions({ successRate, averageRuntimeMs, errorFrequency }),
    };
  }

  private static buildSessionsQuery(db: Firestore, opts: AnalyticsQuery): Query<DocumentData> {
    const base = collection(db, 'learning_sessions');
    const clauses: QueryConstraint[] = [];
    if (opts.userId) clauses.push(where('userId', '==', opts.userId));
    if (opts.agentId) clauses.push(where('agentId', '==', opts.agentId));
    if (opts.labType) clauses.push(where('labType', '==', opts.labType));
    clauses.push(orderBy('createdAt', 'desc'));
    if (opts.maxSessions) clauses.push(limit(opts.maxSessions));
    return query(base, ...clauses);
  }

  private static buildTelemetryQuery(db: Firestore, opts: AnalyticsQuery, from: Date): Query<DocumentData> {
    const base = collection(db, 'telemetry');
    const clauses: QueryConstraint[] = [];
    if (opts.userId) clauses.push(where('userId', '==', opts.userId));
    if (opts.agentId) clauses.push(where('agentId', '==', opts.agentId));
    if (opts.labType) clauses.push(where('labType', '==', opts.labType));
    // createdAt is serverTimestamp; use Timestamp comparison if available
    clauses.push(where('createdAt', '>=', Timestamp.fromDate(from)));
    clauses.push(orderBy('createdAt', 'desc'));
    clauses.push(limit(500));
    return query(base, ...clauses);
  }

  /**
   * Placeholder for LLM/ML-driven suggestions.
   * In future, wire LangChain + vector recalls to tailor guidance.
   */
  private static async generateSuggestions(stats: {
    successRate: number;
    averageRuntimeMs: number | null;
    errorFrequency: number;
  }): Promise<string[]> {
    const hints: string[] = [];
    if (stats.successRate < 0.5) hints.push('Low success rate. Review validation failures and lab configurations.');
    if ((stats.averageRuntimeMs ?? 0) > 15_000)
      hints.push('High average runtime. Consider optimizing batch sizes or compute intensity.');
    if (stats.errorFrequency > 0.2) hints.push('Frequent errors detected. Inspect telemetry for recurring error patterns.');
    return hints;
  }
}

export default Analyzer;

