"use client";
import React from 'react';
import { useLearningSessions } from '@/lib/learning';
import { analyzeLearningTrends, TrendWindowResult } from '@/lib/learning/analyzer';
import { getAuth } from 'firebase/auth';

/**
 * LearningPanel — shows live summary of learning_sessions and trend deltas.
 */
export default function LearningPanel() {
  const [uid, setUid] = React.useState<string | null>(null);
  const [trends, setTrends] = React.useState<TrendWindowResult | null>(null);
  const { sessions } = useLearningSessions(uid ?? undefined);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = getAuth().onAuthStateChanged((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!uid) return;
    let mounted = true;
    analyzeLearningTrends({ userId: uid, windowDays: 7 }).then((r) => mounted && setTrends(r)).catch(() => {});
    return () => { mounted = false; };
  }, [uid]);

  const recent = sessions.slice(0, 20).reverse();
  const total = trends?.total ?? sessions.length;
  const successRate = trends?.successRate ?? rate(sessions);
  const avgRuntime = trends?.avgRuntimeMs ?? averageRuntime(sessions);

  return (
    <div className="mt-8 rounded-xl border border-amber-500/20 p-4 bg-black/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-amber-300/80">Learning</div>
          <div className="text-lg font-semibold text-amber-200">Sessions & Trends</div>
        </div>
        {trends && (
          <div className="text-xs text-amber-300/80">
            7d Δ — total {deltaFmt(trends.delta.total)}, success {deltaPctFmt(trends.delta.successRate)}, runtime {deltaMsFmt(trends.delta.avgRuntimeMs)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Total" value={total.toString()} />
        <Stat label="Success Rate" value={(successRate * 100).toFixed(1) + '%'} />
        <Stat label="Avg Runtime" value={avgRuntime + ' ms'} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button
          disabled={!uid || submitting}
          onClick={() => { if (!uid) return; demoSubmit(uid, setSubmitting, setLastResult); }}
          className={`px-3 py-1.5 rounded border text-sm ${submitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-amber-500/10'} border-amber-500/30 text-amber-100`}
        >
          {submitting ? 'Submitting…' : 'Submit Demo Experiment'}
        </button>
        {lastResult && <span className="text-xs text-amber-300/80">{lastResult}</span>}
      </div>

      <div className="mb-4">
        <Sparkline points={recent.map((r) => (r.success ? 1 : 0))} height={36} />
      </div>

      <div>
        <div className="text-sm text-amber-300/80 mb-2">Latest Experiments</div>
        <ul className="text-sm divide-y divide-amber-500/10">
          {sessions.slice(0, 5).map((s, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">{s.labType}</span>
                <span className="text-amber-100/90">{s.summary ?? '—'}</span>
              </div>
              <div className="text-amber-300/80">
                <span className="mr-3">{(s.runtimeMs ?? 0)} ms</span>
                <span className={s.success ? 'text-emerald-400' : 'text-rose-400'}>{s.success ? '✓' : '✕'}</span>
              </div>
            </li>
          ))}
          {sessions.length === 0 && <li className="py-2 text-amber-400/60">No experiments yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-500/20 p-3">
      <div className="text-xs text-amber-300/80">{label}</div>
      <div className="text-lg font-semibold text-amber-100">{value}</div>
    </div>
  );
}

function Sparkline({ points, height = 36 }: { points: number[]; height?: number }) {
  const n = Math.max(1, points.length);
  const w = Math.max(60, n * 8);
  const max = 1; // success/failure
  const path = points
    .map((v, i) => {
      const x = (i / (n - 1 || 1)) * (w - 4) + 2;
      const y = height - 2 - (v / (max || 1)) * (height - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
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

async function demoSubmit(uid: string, setSubmitting: (b: boolean) => void, setLastResult: (s: string | null) => void) {
  try {
    setSubmitting(true);
    setLastResult(null);
    const user = getAuth().currentUser;
    if (!user) throw new Error('Not signed in');
    const idToken = await user.getIdToken();
    const payload = {
      labType: 'plasma',
      payload: {
        experimentId: 'exp-demo-' + Math.random().toString(36).slice(2, 8),
        userId: uid, // will be overwritten on server to auth uid
        agentId: 'router-1',
        labType: 'plasma',
        timestamp: Date.now(),
        runtimeMs: Math.floor(300 + Math.random() * 1200),
        success: Math.random() > 0.2,
        summary: 'Demo plasma run for LearningPanel ingest.',
        metrics: { energyInputJ: 1000 + Math.random() * 500, plasmaTempK: 4000 + Math.random() * 2000, confinementStability: Number((0.7 + Math.random() * 0.3).toFixed(2)) },
      },
    };
    const res = await fetch('/api/learning/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'Request failed');
    setLastResult(`Saved id ${json.id}${json.embedded ? ' · embedded' : ''}`);
  } catch (e: any) {
    setLastResult(`Error: ${e?.message || 'unknown'}`);
  } finally {
    setSubmitting(false);
  }
}
