// CLAUDE-META: Phase 9C Hybrid Patch - Live Nexus State Management
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Real-time agent lifecycle with Firestore + API integration
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentNode } from "@/components/nexus/NexusViz";
import { useMitnickScan } from "./useMitnickScan";

export type SpawnRequest = {
  parentId: string;
  name: string;
};

/**
 * Live Nexus state with Firestore real-time sync
 * Replaces mock useNexusState with production API calls
 */
export function useNexusStateLive(uid: string | null) {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scanSpawn, status: securityStatus } = useMitnickScan();

  // Initialize with root agent
  useEffect(() => {
    if (agents.length === 0 && uid) {
      setAgents([
        {
          id: "root",
          name: "Nexus Core",
          depth: 0,
          drift: false,
          stdDev: 0,
          entropy: 0,
        },
      ]);
    }
  }, [agents.length, uid]);

  // Fetch agents from Firestore
  const fetchAgents = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/nexus/agents?uid=${uid}`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const liveAgents: AgentNode[] = data.agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        depth: a.depth,
        parentId: a.parentId,
        drift: a.drift,
        stdDev: a.stdDev,
        entropy: a.entropy,
      }));

      // Merge with root if not present
      const hasRoot = liveAgents.some(a => a.id === "root");
      if (!hasRoot) {
        liveAgents.unshift({
          id: "root",
          name: "Nexus Core",
          depth: 0,
          drift: false,
          stdDev: 0,
          entropy: 0,
        });
      }

      setAgents(liveAgents);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Spawn new agent via API
  const spawnAgent = useCallback(
    async (request: SpawnRequest) => {
      if (!uid) {
        setError("User not authenticated");
        return;
      }

      const parent = agents.find(a => a.id === request.parentId);
      if (!parent) {
        setError(`Parent agent ${request.parentId} not found`);
        return;
      }

      // Security scan via MitnickGPT
      const scanResult = await scanSpawn(
        request.parentId,
        request.name,
        parent.depth + 1,
        agents
      );

      if (!scanResult.allowed) {
        setError(scanResult.threat?.message || "Spawn blocked by security scan");
        return;
      }

      setLoading(true);
      try {
        // In production, sign payload with HMAC
        // For Phase 9C, we'll use a simple structure
        const payload = {
          data: {
            parentId: request.parentId,
            name: request.name,
            depth: parent.depth + 1,
            lineageRoot: parent.id === "root" ? request.parentId : parent.id,
          },
          uid,
          timestamp: Date.now(),
          hmac: "mock-hmac-signature", // TODO: Implement client-side HMAC signing
        };

        const res = await fetch("/api/nexus/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Spawn failed");
        }

        const data = await res.json();
        const newAgent: AgentNode = {
          id: data.agent.id,
          name: data.agent.name,
          depth: data.agent.depth,
          parentId: data.agent.parentId,
          drift: data.agent.drift,
          stdDev: data.agent.stdDev,
          entropy: data.agent.entropy,
        };

        setAgents(prev => [...prev, newAgent]);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to spawn agent");
      } finally {
        setLoading(false);
      }
    },
    [uid, agents, scanSpawn]
  );

  // Control agent (pause/resume/terminate)
  const controlAgent = useCallback(
    async (agentId: string, action: "pause" | "resume" | "terminate") => {
      if (!uid) {
        setError("User not authenticated");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          data: { action },
          uid,
          timestamp: Date.now(),
          hmac: "mock-hmac-signature", // TODO: Implement HMAC signing
        };

        const res = await fetch(`/api/nexus/agent/${agentId}/control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Control action failed");
        }

        // Refresh agents after control action
        await fetchAgents();
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to control agent");
      } finally {
        setLoading(false);
      }
    },
    [uid, fetchAgents]
  );

  // Update agent drift status (from SSE stream)
  const updateDrift = useCallback((agentId: string, drift: { stdDev: number; entropy: number; drift: boolean }) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? { ...a, stdDev: drift.stdDev, entropy: drift.entropy, drift: drift.drift }
          : a
      )
    );
  }, []);

  // Reset Nexus (clear all except root)
  const resetNexus = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    try {
      // Terminate all non-root agents
      const controlPromises = agents
        .filter(a => a.id !== "root")
        .map(a => controlAgent(a.id, "terminate"));

      await Promise.all(controlPromises);

      setAgents([
        {
          id: "root",
          name: "Nexus Core",
          depth: 0,
          drift: false,
          stdDev: 0,
          entropy: 0,
        },
      ]);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to reset Nexus");
    } finally {
      setLoading(false);
    }
  }, [uid, agents, controlAgent]);

  // Get agent by ID
  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  // Get children of an agent
  const getChildren = useCallback((parentId: string) => {
    return agents.filter(a => a.parentId === parentId);
  }, [agents]);

  return {
    agents,
    loading,
    error,
    spawnAgent,
    controlAgent,
    updateDrift,
    fetchAgents,
    resetNexus,
    getAgent,
    getChildren,
    securityStatus,
  };
}
