// CLAUDE-META: Phase 9D Hybrid Patch - Runtime-Enabled Forge Page
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Full integration with WebSocket runtime and RecursiveAgent
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useGlyphs } from "@/hooks/useGlyphs";
import { useWebSocketNexus } from "@/hooks/useWebSocketNexus";
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import GlyphConsole from "@/components/glyph/GlyphConsole";
import AgentOverlay from "@/components/glyph/AgentOverlay";
import ForgeViewer from "@/components/ForgeViewer";
import NexusViz from "@/components/nexus/NexusViz";
import DriftMonitorPanel from "@/components/nexus/DriftMonitorPanel";
import AgentInspector from "@/components/nexus/AgentInspector";
import { AgentNode } from "@/components/nexus/NexusViz";

export default function ForgeRuntimePage() {
  const { user, loading: authLoading } = useAuth() as { user: any; loading: boolean };
  const { overlays, commands } = useGlyphs();

  // WebSocket connection
  const {
    connected: wsConnected,
    authenticated: wsAuthenticated,
    lastMessage,
    spawnAgent: wsSpawnAgent,
    controlAgent: wsControlAgent,
    error: wsError,
  } = useWebSocketNexus(!!user);

  // Local state
  const [agents, setAgents] = useState<AgentNode[]>([
    {
      id: "root",
      name: "Nexus Core",
      depth: 0,
      drift: false,
      stdDev: 0,
      entropy: 0,
    },
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [runtimeRunning, setRuntimeRunning] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Process glyph commands
  useEffect(() => {
    commands.forEach(cmd => {
      if (cmd.t === "SPAWN" && wsAuthenticated) {
        wsSpawnAgent(cmd.parentId, cmd.name);
      } else if (cmd.t === "RESET") {
        // Reset agents to root only
        setAgents([{
          id: "root",
          name: "Nexus Core",
          depth: 0,
          drift: false,
          stdDev: 0,
          entropy: 0,
        }]);
      }
    });
  }, [commands, wsAuthenticated, wsSpawnAgent]);

  // Process WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "agent_spawned") {
      // Add new agent to list
      const newAgent: AgentNode = {
        id: lastMessage.agent.id,
        name: lastMessage.agent.name,
        depth: 0, // Would be computed from parent
        parentId: lastMessage.agent.parentId,
        drift: false,
        stdDev: 0,
        entropy: 0,
      };
      setAgents(prev => [...prev, newAgent]);
    } else if (lastMessage.type === "drift") {
      // Update agent drift metrics
      setAgents(prev =>
        prev.map(a =>
          a.id === lastMessage.agentId
            ? {
                ...a,
                stdDev: lastMessage.stdDev,
                entropy: lastMessage.entropy,
                drift: lastMessage.drift,
              }
            : a
        )
      );
    } else if (lastMessage.type === "agent_updated") {
      // Agent status changed
      console.log(`[Forge] Agent ${lastMessage.agentId} status: ${lastMessage.status}`);
    }
  }, [lastMessage]);

  // Start/stop runtime
  const toggleRuntime = async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();

      if (runtimeRunning) {
        // Stop runtime
        const res = await fetch("/api/nexus/runtime-start", {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });

        if (!res.ok) throw new Error(await res.text());

        setRuntimeRunning(false);
        setRuntimeError(null);
      } else {
        // Start runtime
        const res = await fetch("/api/nexus/runtime-start", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        console.log("[Forge] Runtime started:", data);

        setRuntimeRunning(true);
        setRuntimeError(null);
      }
    } catch (error: any) {
      setRuntimeError(error.message || "Failed to toggle runtime");
      console.error("[Forge] Runtime error:", error);
    }
  };

  // Control agent via WebSocket
  const handleControl = async (agentId: string, action: "pause" | "resume" | "terminate") => {
    if (!wsAuthenticated) {
      setRuntimeError("WebSocket not authenticated");
      return;
    }

    wsControlAgent(agentId, action);
  };

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
            {/* WebSocket Status */}
            <div
              className={`px-3 py-1 rounded text-xs font-mono ${
                wsConnected && wsAuthenticated
                  ? "bg-green-600/80 text-white"
                  : "bg-gray-700/80 text-gray-300"
              }`}
            >
              WS: {wsConnected && wsAuthenticated ? "LIVE" : "OFFLINE"}
            </div>

            {/* Runtime Status */}
            <div
              className={`px-3 py-1 rounded text-xs font-mono ${
                runtimeRunning
                  ? "bg-green-600/80 text-white"
                  : "bg-gray-700/80 text-gray-300"
              }`}
            >
              RT: {runtimeRunning ? "ACTIVE" : "STOPPED"}
            </div>
          </div>

          {/* Runtime Control */}
          <div className="absolute top-4 left-4">
            <button
              onClick={toggleRuntime}
              disabled={!wsAuthenticated}
              className={`px-4 py-2 rounded font-mono text-sm ${
                runtimeRunning
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white disabled:bg-gray-700 disabled:text-gray-500 transition-colors`}
            >
              {runtimeRunning ? "STOP RUNTIME" : "START RUNTIME"}
            </button>
          </div>

          {/* Error Overlay */}
          {(wsError || runtimeError) && (
            <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 px-4 py-2 rounded text-sm font-mono max-w-md">
              {wsError || runtimeError}
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
            onControl={handleControl}
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
