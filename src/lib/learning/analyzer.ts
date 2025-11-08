import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';

export interface AnalyticsFilters {
  userId?: string;
  agentId?: string;
}

export interface LabMetrics {
  count: number;
  successRate: number; // 0..1
  avgRuntimeMs: number; // 0 if none
  errorRate: number; // 0..1
}

export interface AnalyticsSummary {
  total: number;
  overallSuccessRate: number; // 0..1
  overallAvgRuntimeMs: number;
  labs: Record<string, LabMetrics>;
  recentEvents: number; // telemetry count observed
  generatedAt: number; // epoch ms
}

type Session = {
  labType: string;
  success?: boolean;
  runtimeMs?: number;
};

/**
 * Pulls learning_sessions and telemetry to compute aggregate metrics for dashboard.
 */
export async function analyzeLearning(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
  const db = getDbInstance();
  if (!db) {
    // SSR/build path safety fallback
    return { total: 0, overallSuccessRate: 0, overallAvgRuntimeMs: 0, labs: {}, recentEvents: 0, generatedAt: Date.now() };
  }

  const sessions = await fetchLearningSessions(db, filters);
  const telemetryCount = await countTelemetry(db, filters);

  const total = sessions.length;
  let successCount = 0;
  let runtimeSum = 0;
  const byLab = new Map<string, { count: number; success: number; runtimeSum: number; errors: number }>();

  for (const s of sessions) {
    const success = !!s.success;
    const runtime = s.runtimeMs ?? 0;
    successCount += success ? 1 : 0;
    runtimeSum += runtime;

    const k = s.labType;
    const agg = byLab.get(k) ?? { count: 0, success: 0, runtimeSum: 0, errors: 0 };
    agg.count += 1;
    agg.success += success ? 1 : 0;
    agg.runtimeSum += runtime;
    agg.errors += success ? 0 : 1;
    byLab.set(k, agg);
  }

  const labs: Record<string, LabMetrics> = {};
  byLab.forEach((agg, lab) => {
    labs[lab] = {
      count: agg.count,
      successRate: agg.count ? agg.success / agg.count : 0,
      avgRuntimeMs: agg.count ? Math.round(agg.runtimeSum / agg.count) : 0,
      errorRate: agg.count ? agg.errors / agg.count : 0,
    };
  });

  return {
    total,
    overallSuccessRate: total ? successCount / total : 0,
    overallAvgRuntimeMs: total ? Math.round(runtimeSum / total) : 0,
    labs,
    recentEvents: telemetryCount,
    generatedAt: Date.now(),
  };
}

async function fetchLearningSessions(db: any, filters: AnalyticsFilters): Promise<Session[]> {
  const qParts: any[] = [];
  if (filters.userId) qParts.push(where('userId', '==', filters.userId));
  if (filters.agentId) qParts.push(where('agentId', '==', filters.agentId));
  const qRef = qParts.length ? query(collection(db, 'learning_sessions'), ...qParts) : collection(db, 'learning_sessions');
  const snap = await getDocs(qRef as any);
  return snap.docs.map((d) => d.data() as Session);
}

async function countTelemetry(db: any, filters: AnalyticsFilters): Promise<number> {
  const qParts: any[] = [];
  if (filters.userId) qParts.push(where('userId', '==', filters.userId));
  if (filters.agentId) qParts.push(where('agentId', '==', filters.agentId));
  const qRef = qParts.length
    ? query(collection(db, 'telemetry'), ...qParts, orderBy('timestamp', 'desc'))
    : query(collection(db, 'telemetry'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(qRef as any);
  return snap.size;
}

export default analyzeLearning;

// ---- Time-windowed trends ----

export interface TrendWindowResult {
  windowDays: number;
  total: number;
  successRate: number; // 0..1
  avgRuntimeMs: number;
  delta: {
    total: number; // current - previous
    successRate: number; // current - previous
    avgRuntimeMs: number; // current - previous
  };
}

export async function analyzeLearningTrends({ userId, windowDays = 7 }: { userId?: string; windowDays?: number }): Promise<TrendWindowResult> {
  const db = getDbInstance();
  if (!db) {
    return { windowDays, total: 0, successRate: 0, avgRuntimeMs: 0, delta: { total: 0, successRate: 0, avgRuntimeMs: 0 } };
  }

  const now = Date.now();
  const ms = 24 * 60 * 60 * 1000;
  const start = now - windowDays * ms;
  const prevStart = start - windowDays * ms;

  const curr = await fetchWindow(db, userId, start, now);
  const prev = await fetchWindow(db, userId, prevStart, start);

  const currAgg = aggregate(curr);
  const prevAgg = aggregate(prev);

  return {
    windowDays,
    total: currAgg.total,
    successRate: currAgg.successRate,
    avgRuntimeMs: currAgg.avgRuntimeMs,
    delta: {
      total: currAgg.total - prevAgg.total,
      successRate: currAgg.successRate - prevAgg.successRate,
      avgRuntimeMs: currAgg.avgRuntimeMs - prevAgg.avgRuntimeMs,
    },
  };
}

async function fetchWindow(db: any, userId: string | undefined, start: number, end: number) {
  const qParts: any[] = [where('timestamp', '>=', start), where('timestamp', '<', end)];
  if (userId) qParts.push(where('userId', '==', userId));
  const qRef = query(collection(db, 'learning_sessions'), ...qParts);
  const snap = await getDocs(qRef as any);
  return snap.docs.map((d) => d.data() as Session);
}

function aggregate(rows: Session[]) {
  const total = rows.length;
  const succ = rows.reduce((s, r) => s + (r.success ? 1 : 0), 0);
  const runtimeSum = rows.reduce((s, r) => s + (r.runtimeMs ?? 0), 0);
  return {
    total,
    successRate: total ? succ / total : 0,
    avgRuntimeMs: total ? Math.round(runtimeSum / total) : 0,
  };
}
