"use client";
import React from 'react';
import { getAuth } from 'firebase/auth';
import { useLearningSessions, useLearningBatchTelemetry } from '@/lib/learning';
import { Analyzer } from '@/lib/learning';

type TrendWindowResult = {
  total: number;
  successRate: number;
  avgRuntimeMs: number;
  delta: { total: number; successRate: number; avgRuntimeMs: number };
};

export default function LearningPanel() {
  const [uid, setUid] = React.useState<string | null>(null);
  const [trends, setTrends] = React.useState<TrendWindowResult | null>(null);
  const { data, loading } = useLearningSessions(uid ?? undefined);
  const sessions = data ?? [];
  const [submitting, setSubmitting] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<string | null>(null);
  const { data: batchEvents } = useLearningBatchTelemetry(20);

  React.useEffect(() => {
    const unsub = getAuth().onAuthStateChanged((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const analyzer = new Analyzer();
    analyzer.getSummary({ userId: uid }).then((r) => {
      if (!mounted) return;
      setTrends({
        total: r.totalSessions,
        successRate: r.successRate,
        avgRuntimeMs: Math.round(r.averageRuntimeMs),
        delta: { total: 0, successRate: 0, avgRuntimeMs: 0 },
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, [uid]);

  const recent = sessions.slice(0, 20).reverse();
  const total = trends?.total ?? sessions.length;
  const successRate = trends?.successRate ?? rate(sessions);
  const avgRuntime = trends?.avgRuntimeMs ?? averageRuntime(sessions);

  const agg = React.useMemo(() => aggregateBatchTelemetry(batchEvents ?? []), [batchEvents]);

  return (
    <div className="mt-8 rounded-xl border border-amber-500/20 p-4 bg-black/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-amber-300/80">Learning</div>
          <div className="text-lg font-semibold text-amber-200">Sessions & Trends</div>
        </div>
        {trends && (
          <div className="text-xs text-amber-300/80">
            7d • total {deltaFmt(trends.delta.total)}, success {deltaPctFmt(trends.delta.successRate)}, runtime {deltaMsFmt(trends.delta.avgRuntimeMs)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Total" value={total.toString()} />
        <Stat label="Success Rate" value={`${(successRate * 100).toFixed(1)}%`} />
        <Stat label="Avg Runtime" value={`${avgRuntime} ms`} />
        <div />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Batch Writes" value={String(agg.totalWrites)} />
        <Stat label="Avg Latency" value={`${agg.avgLatencyMs} ms`} />
        <Stat
          label="p95 Latency"
          value={`${agg.p95LatencyMs} ms`}
          valueClassName={agg.p95LatencyMs < 100 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <Stat
          label="Error Rate"
          value={`${(agg.errorRate * 100).toFixed(1)}%`}
          valueClassName={agg.errorRate < 0.05 ? 'text-emerald-400' : 'text-rose-400'}
        />
      </div>

      {/* Telemetry Alerts */}
      {(agg.p95LatencyMs >= 100 || agg.errorRate >= 0.05) && (
        <div className="mb-4 space-y-2">
          {agg.p95LatencyMs >= 100 && (
            <div className="p-3 bg-rose-950/30 border border-rose-600/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
              <span>⚠️ P95 latency above target (100ms)</span>
            </div>
          )}
          {agg.errorRate >= 0.05 && (
            <div className="p-3 bg-rose-950/30 border border-rose-600/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
              <span>⚠️ Error rate above 5%</span>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="text-xs text-amber-300/80 mb-2 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          Recent Batch Events
        </div>
        <ul className="text-sm divide-y divide-amber-500/10">
          {(batchEvents ?? []).slice(0, 5).map((event: any) => (
            <BatchEventListItem key={event.id} event={event} />
          ))}
          {(batchEvents ?? []).length === 0 && <li className="py-1 text-amber-400/60 text-xs">No batch events yet.</li>}
        </ul>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button
          disabled={!uid || submitting}
          onClick={() => { if (!uid) return; demoSubmit(uid, setSubmitting, setLastResult); }}
          className="px-3 py-1.5 rounded border text-sm border-amber-500/30 text-amber-100 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Demo Experiment'}
        </button>
        {lastResult && <span className="text-xs text-amber-300/80">{lastResult}</span>}
      </div>

      <div className="mb-4">
        <Sparkline points={recent.map((r: any) => (r.success ? 1 : 0))} height={36} />
      </div>

      <div>
        <div className="text-sm text-amber-300/80 mb-2">Latest Experiments</div>
        <ul className="text-sm divide-y divide-amber-500/10">
          {sessions.slice(0, 5).map((s: any, i: number) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">{s.labType}</span>
                <span className="text-amber-100/90">{s.summary ?? '—'}</span>
              </div>
              <div className="text-amber-300/80">
                <span className="mr-3">{s.runtimeMs ?? 0} ms</span>
                <span className={s.success ? 'text-emerald-400' : 'text-rose-400'}>{s.success ? '✔' : '✖'}</span>
              </div>
            </li>
          ))}
          {sessions.length === 0 && <li className="py-2 text-amber-400/60">No experiments yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function BatchEventListItem({ event }: { event: any }) {
  const isError = event.event === 'learning.batch.error';
  const batchSize = event.meta?.batchSize ?? 'N/A';
  const latency = event.meta?.latencyMs ?? 'N/A';
  const attempt = event.meta?.attempt ?? 1;

  return (
    <li className="py-1.5 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className={`font-mono text-xs ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isError ? 'ERR' : 'OK'}
        </span>
        <span className="text-amber-100/90">
          {isError ? 'Batch failed' : 'Batch commit'}
        </span>
      </div>
      <div className="text-amber-300/80 font-mono">
        <span className="mr-3">size: {batchSize}</span>
        {!isError && <span className="mr-3">lat: {latency}ms</span>}
        {attempt > 1 && <span className="text-amber-500">retry: {attempt}</span>}
      </div>
    </li>
  );
}

function Stat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-amber-500/20 p-3 bg-amber-950/10">
      <div className="text-xs text-amber-300/80">{label}</div>
      <div className={`text-lg font-semibold font-mono ${valueClassName || 'text-amber-100'}`}>{value}</div>
    </div>
  );
}

function Sparkline({ points, height = 36 }: { points: number[]; height?: number }) {
  const n = Math.max(1, points.length);
  const w = Math.max(60, n * 8);
  const max = 1;
  const path = points
    .map((v, i) => {
      const x = (i / (n - 1 || 1)) * (w - 4) + 2;
      const y = height - 2 - (v / (max || 1)) * (height - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={height} className="block">
      <path d={path} fill="none" stroke="rgb(251 191 36)" strokeWidth={2} strokeOpacity={0.9} />
    </svg>
  );
}

function rate(rows: any[]) {
  if (!rows.length) return 0;
  const s = rows.reduce((a, r) => a + (r.success ? 1 : 0), 0);
  return s / rows.length;
}

function averageRuntime(rows: any[]) {
  if (!rows.length) return 0;
  const sum = rows.reduce((a, r) => a + (r.runtimeMs ?? 0), 0);
  return Math.round(sum / rows.length);
}

function deltaFmt(n: number) {
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}
function deltaPctFmt(n: number) {
  const p = (n * 100).toFixed(1) + '%';
  if (n === 0) return '±0%';
  return n > 0 ? `+${p}` : `${p}`;
}
function deltaMsFmt(n: number) {
  if (n === 0) return '±0 ms';
  return n > 0 ? `+${n} ms` : `${n} ms`;
}

function aggregateBatchTelemetry(events: any[]) {
  if (!events.length) return { totalWrites: 0, avgLatencyMs: 0, p95LatencyMs: 0, errorRate: 0 };
  let total = 0, successWrites = 0, errorWrites = 0
  const lat: number[] = []
  for (const e of events) {
    const size = Number(e?.meta?.batchSize ?? 0) || 0
    total += size
    if (e.event === 'learning.batch.commit') {
      successWrites += size
      const l = Number(e?.meta?.latencyMs ?? 0); if (l) lat.push(l)
    }
    if (e.event === 'learning.batch.error') {
      errorWrites += size
    }
  }
  const avgLatencyMs = lat.length ? Math.round(lat.reduce((a,b)=>a+b,0)/lat.length) : 0
  const p95LatencyMs = lat.length ? lat.sort((a,b)=>a-b)[Math.floor(lat.length*0.95)-1] || avgLatencyMs : 0
  const errorRate = total ? errorWrites/total : 0
  return { totalWrites: total, avgLatencyMs, p95LatencyMs, errorRate }
}

async function demoSubmit(uid: string, setSubmitting: (b: boolean) => void, setLastResult: (s: string | null) => void) {
  try {
    setSubmitting(true);
    setLastResult(null);
    const user = getAuth().currentUser;
    if (!user) throw new Error('Not signed in');
    const idToken = await user.getIdToken();
    const payload = {
      labType: 'plasma',
      data: {
        userId: uid,
        agentId: 'router-1',
        labType: 'plasma',
        runtimeMs: Math.floor(300 + Math.random() * 1200),
        success: Math.random() > 0.2,
        parameters: { temperatureK: 1.2e7, density: 0.8 },
        measurements: { confinementTimeMs: 120, energyOutputJ: 12.4 },
      },
    };
    const res = await fetch('/api/learning/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'Request failed');
    setLastResult(`Saved id ${json.id}`);
  } catch (e: any) {
    setLastResult(`Error: ${e.message}`);
  } finally {
    setSubmitting(false);
  }
}
