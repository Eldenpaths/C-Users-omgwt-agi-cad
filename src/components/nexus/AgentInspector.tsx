// CLAUDE-META: Phase 9C Hybrid Patch - Agent Inspector UI
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Agent control interface (pause/resume/terminate)
// Status: Production - Hybrid Safe Mode Active

"use client";

import { AgentNode } from "./NexusViz";
import { useState } from "react";

type AgentInspectorProps = {
  agents: AgentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onControl: (agentId: string, action: "pause" | "resume" | "terminate") => Promise<void>;
  loading?: boolean;
};

export default function AgentInspector({
  agents,
  selectedId,
  onSelect,
  onControl,
  loading = false,
}: AgentInspectorProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedId);

  const handleControl = async (action: "pause" | "resume" | "terminate") => {
    if (!selectedId) return;

    setActionLoading(action);
    setError(null);

    try {
      await onControl(selectedId, action);
      if (action === "terminate") {
        onSelect(null); // Deselect terminated agent
      }
    } catch (e: any) {
      setError(e.message || "Control action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="forge-panel h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-400">AGENT INSPECTOR</h3>
        {selectedAgent && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-gray-400 hover:text-amber-400"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/40 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      {!selectedAgent ? (
        <div>
          <div className="text-sm text-gray-400 mb-3">Select an agent to inspect</div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className={`w-full text-left p-3 rounded text-xs font-mono transition-colors ${
                  agent.drift
                    ? "bg-red-900/20 border border-red-500/40 hover:bg-red-900/30"
                    : "bg-black/20 border border-amber-500/10 hover:bg-black/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300">{agent.name}</span>
                  <span className="text-gray-500">d:{agent.depth}</span>
                </div>
                <div className="text-gray-400 text-[10px] truncate">{agent.id}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Agent Details */}
          <div className="bg-black/40 p-4 rounded border border-amber-500/20 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-amber-300 mb-1">{selectedAgent.name}</div>
                <div className="text-xs text-gray-500">{selectedAgent.id}</div>
              </div>
              {selectedAgent.drift && (
                <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">
                  DRIFT
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <div className="text-gray-500 mb-1">Depth</div>
                <div className="text-amber-400">{selectedAgent.depth}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Parent</div>
                <div className="text-amber-400 truncate">
                  {selectedAgent.parentId || "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Std Dev (σ)</div>
                <div className="text-amber-400">{selectedAgent.stdDev.toFixed(3)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Entropy (H)</div>
                <div className="text-amber-400">{selectedAgent.entropy.toFixed(3)}</div>
              </div>
            </div>
          </div>

          {/* Control Actions */}
          <div className="space-y-2">
            <div className="text-sm text-amber-600 mb-2 font-bold">CONTROL ACTIONS</div>

            <button
              onClick={() => handleControl("pause")}
              disabled={loading || actionLoading === "pause"}
              className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-mono text-sm transition-colors"
            >
              {actionLoading === "pause" ? "PAUSING..." : "⏸ PAUSE"}
            </button>

            <button
              onClick={() => handleControl("resume")}
              disabled={loading || actionLoading === "resume"}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-mono text-sm transition-colors"
            >
              {actionLoading === "resume" ? "RESUMING..." : "▶ RESUME"}
            </button>

            <button
              onClick={() => handleControl("terminate")}
              disabled={loading || actionLoading === "terminate"}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-mono text-sm transition-colors"
            >
              {actionLoading === "terminate" ? "TERMINATING..." : "⛔ TERMINATE"}
            </button>

            <div className="mt-4 p-3 bg-black/20 border border-amber-500/10 rounded text-[10px] text-gray-500">
              <div className="font-bold mb-1 text-amber-600">HYBRID SAFE ACTIVE</div>
              <div>• PAUSE: Suspends agent execution</div>
              <div>• RESUME: Reactivates agent</div>
              <div>• TERMINATE: Stops agent & cascades to children</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-amber-400 font-mono">Loading...</div>
        </div>
      )}
    </div>
  );
}
