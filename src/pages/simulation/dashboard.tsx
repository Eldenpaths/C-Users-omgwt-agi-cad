import { useEffect, useMemo, useState } from 'react';
import { useSimulation } from '@/lib/simulation/hooks';
import type { LabId } from '@/lib/simulation/types';
import { getAuthInstance } from '@/lib/firebase/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const LABS: LabId[] = ['plasma', 'spectral', 'chemistry', 'crypto'];

function SimulationDashboardContent() {
  const auth = typeof window !== 'undefined' ? getAuthInstance() : null;
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid || undefined));
    return () => unsub();
  }, [auth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Simulation Core</h1>
          <p className="text-gray-400">Run unified simulations across labs and observe values in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {LABS.map((labId) => (
            <LabPanel key={labId} labId={labId} userId={userId} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SimulationDashboard() {
  return (
    <ErrorBoundary>
      <SimulationDashboardContent />
    </ErrorBoundary>
  );
}

function LabPanel({ labId, userId }: { labId: LabId; userId?: string }) {
  const sim = useSimulation(labId);
  useEffect(() => {
    if (userId) sim.setContext({ userId });
  }, [userId, sim]);

  const primaryKey = useMemo(() => Object.keys(sim.state?.values || {})[0] || 'value', [sim.state]);
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    if (!sim.state) return;
    const v = sim.state.values[primaryKey] ?? 0;
    setHistory((h) => [...h.slice(-99), Number(v) || 0]);
  }, [sim.state?.timeMs, primaryKey]);

  const labColors: Record<LabId, string> = {
    plasma: '#f59e0b',
    spectral: '#8b5cf6',
    chemistry: '#10b981',
    crypto: '#3b82f6',
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-amber-700/50 transition-all">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-amber-400">{labId.toUpperCase()}</h3>
          {sim.running && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded border border-green-700/50">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              RUNNING
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!sim.running ? (
            <button
              onClick={() => sim.start()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg hover:shadow-green-600/50"
            >
              Start
            </button>
          ) : (
            <button
              onClick={() => sim.stop()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg hover:shadow-red-600/50"
            >
              Stop
            </button>
          )}
          <button
            onClick={() => sim.reset()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Primary Metric: <span className="text-amber-400">{primaryKey}</span></div>
        <Chart data={history} height={100} color={labColors[labId]} />
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(sim.state?.values || {}).map(([k, v]) => (
          <div key={k} className="bg-gray-950/60 border border-gray-700 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{k}</div>
            <div className="text-lg font-bold text-amber-400">{typeof v === 'number' ? v.toFixed(2) : String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chart({ data, width = 600, height = 120, color = '#22d3ee' }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-950/60 border border-gray-700 rounded-lg flex items-center justify-center" style={{ height }}>
        <span className="text-gray-500 text-sm">No data yet</span>
      </div>
    );
  }

  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const span = Math.max(1e-6, max - min);
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - ((v - min) / span) * height;
    return `${x},${y}`;
  });

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-gray-950/60 border border-gray-700 rounded-lg"
      preserveAspectRatio="none"
    >
      {/* Grid lines */}
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#374151" strokeWidth="1" strokeDasharray="4,4" />

      {/* Data line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        points={points.join(' ')}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glow effect */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="6"
        points={points.join(' ')}
        opacity="0.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

