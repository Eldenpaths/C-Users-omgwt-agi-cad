// CLAUDE-META: Phase 9B Hybrid Patch - Drift Monitoring Display
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Real-time drift metrics visualization panel
// Status: Production - Hybrid Safe Mode Active

"use client";

import { AgentNode } from "./NexusViz";
import { useEffect, useState } from "react";

type DriftMetric = {
  agentId: string;
  name: string;
  stdDev: number;
  entropy: number;
  drift: boolean;
  timestamp: number;
};

type DriftMonitorPanelProps = {
  agents: AgentNode[];
};

export default function DriftMonitorPanel({ agents }: DriftMonitorPanelProps) {
  const [metrics, setMetrics] = useState<DriftMetric[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate drift monitoring (in production, this would poll /api/nexus/drift)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newMetrics = agents.map(agent => ({
        agentId: agent.id,
        name: agent.name,
        stdDev: agent.stdDev + (Math.random() - 0.5) * 0.2,
        entropy: Math.max(0, Math.min(1, agent.entropy + (Math.random() - 0.5) * 0.1)),
        drift: agent.drift || Math.random() > 0.85,
        timestamp: Date.now(),
      }));

      setMetrics(newMetrics);
    }, 2000);

    return () => clearInterval(interval);
  }, [agents, autoRefresh]);

  const driftCount = metrics.filter(m => m.drift).length;
  const avgStdDev = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.stdDev, 0) / metrics.length
    : 0;
  const avgEntropy = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.entropy, 0) / metrics.length
    : 0;

  return (
    <div className="forge-panel h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-400">DRIFT MONITOR</h3>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-3 py-1 text-xs font-mono rounded ${
            autoRefresh
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {autoRefresh ? "LIVE" : "PAUSED"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-xs font-mono">
        <div className="bg-black/40 p-3 rounded border border-amber-500/20">
          <div className="text-amber-600 mb-1">ALERTS</div>
          <div className={`text-2xl font-bold ${driftCount > 0 ? "text-red-400" : "text-green-400"}`}>
            {driftCount}
          </div>
        </div>
        <div className="bg-black/40 p-3 rounded border border-amber-500/20">
          <div className="text-amber-600 mb-1">AVG σ</div>
          <div className="text-2xl font-bold text-amber-400">
            {avgStdDev.toFixed(2)}
          </div>
        </div>
        <div className="bg-black/40 p-3 rounded border border-amber-500/20">
          <div className="text-amber-600 mb-1">AVG H</div>
          <div className="text-2xl font-bold text-amber-400">
            {avgEntropy.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Agent Metrics */}
      <div className="space-y-2">
        {metrics.map(metric => (
          <div
            key={metric.agentId}
            className={`p-3 rounded text-xs font-mono ${
              metric.drift
                ? "bg-red-900/20 border border-red-500/40"
                : "bg-black/20 border border-amber-500/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300">{metric.name}</span>
              {metric.drift && (
                <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px]">
                  DRIFT
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-400">
              <div>
                σ: <span className="text-amber-400">{metric.stdDev.toFixed(3)}</span>
              </div>
              <div>
                H: <span className="text-amber-400">{metric.entropy.toFixed(3)}</span>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              {metric.agentId}
            </div>
          </div>
        ))}
      </div>

      {metrics.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No agents active
        </div>
      )}
    </div>
  );
}
