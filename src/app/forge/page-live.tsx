// CLAUDE-META: Phase 9C Hybrid Patch - Live Ops Forge Page
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Complete integration with Firestore, SSE, MitnickGPT, and Agent Inspector
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useGlyphs } from "@/hooks/useGlyphs";
import { useNexusStateLive } from "@/hooks/useNexusStateLive";
import { useDriftStream } from "@/hooks/useDriftStream";
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import GlyphConsole from "@/components/glyph/GlyphConsole";
import AgentOverlay from "@/components/glyph/AgentOverlay";
import ForgeViewer from "@/components/ForgeViewer";
import NexusViz from "@/components/nexus/NexusViz";
import DriftMonitorPanel from "@/components/nexus/DriftMonitorPanel";
import AgentInspector from "@/components/nexus/AgentInspector";

export default function ForgeLivePage() {
  const { user, loading: authLoading } = useAuth() as { user: any; loading: boolean };
  const { overlays, commands } = useGlyphs();
  const {
    agents,
    spawnAgent,
    controlAgent,
    updateDrift,
    resetNexus,
    error: nexusError,
    securityStatus,
  } = useNexusStateLive(user?.uid || null);

  const { lastEvent, connected: driftConnected } = useDriftStream(user?.uid || null, true);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Process Nexus commands from glyph input
  useEffect(() => {
    commands.forEach(cmd => {
      if (cmd.t === "SPAWN") {
        spawnAgent({ parentId: cmd.parentId, name: cmd.name });
      } else if (cmd.t === "RESET") {
        resetNexus();
      }
    });
  }, [commands, spawnAgent, resetNexus]);

  // Update drift from SSE stream
  useEffect(() => {
    if (lastEvent && lastEvent.type === "drift" && lastEvent.agentId) {
      updateDrift(lastEvent.agentId, {
        stdDev: lastEvent.stdDev || 0,
        entropy: lastEvent.entropy || 0,
        drift: lastEvent.drift || false,
      });
    }
  }, [lastEvent, updateDrift]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-amber-400 font-mono">Loading authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-amber-400 font-mono">Please sign in to access Forge</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-8 md:grid-cols-12">
      {/* Left Column: ForgeViewer + NexusViz */}
      <div className="md:col-span-8 space-y-3">
        <div className="h-[400px]">
          <ForgeViewer overlays={overlays} />
        </div>

        <div className="h-[400px] relative">
          <NexusViz agents={agents} />

          {/* Status Indicators */}
          <div className="absolute top-4 right-4 flex gap-2">
            {/* Drift Stream Status */}
            <div
              className={`px-3 py-1 rounded text-xs font-mono ${
                driftConnected
                  ? "bg-green-600/80 text-white"
                  : "bg-gray-700/80 text-gray-300"
              }`}
            >
              SSE: {driftConnected ? "LIVE" : "OFFLINE"}
            </div>

            {/* Security Status */}
            <div
              className="px-3 py-1 rounded text-xs font-mono text-white"
              style={{
                backgroundColor:
                  securityStatus.threatLevel === "green"
                    ? "#10b981"
                    : securityStatus.threatLevel === "yellow"
                    ? "#f59e0b"
                    : securityStatus.threatLevel === "orange"
                    ? "#f97316"
                    : "#ef4444",
              }}
            >
              MITNICK: {securityStatus.threatLevel.toUpperCase()}
            </div>
          </div>

          {/* Error Overlay */}
          {nexusError && (
            <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 px-4 py-2 rounded text-sm font-mono max-w-md">
              {nexusError}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="md:col-span-4 space-y-3">
        <GlyphConsole />

        <div className="h-[400px]">
          <AgentInspector
            agents={agents}
            selectedId={selectedAgentId}
            onSelect={setSelectedAgentId}
            onControl={controlAgent}
          />
        </div>

        <div className="h-[400px]">
          <DriftMonitorPanel agents={agents} />
        </div>

        <AgentOverlay />
      </div>
    </div>
  );
}
