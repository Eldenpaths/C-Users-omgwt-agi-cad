// CLAUDE-META: Phase 9B Hybrid Patch - Nexus State Management
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Client-side agent hierarchy and drift state management
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentNode } from "@/components/nexus/NexusViz";

export type SpawnRequest = {
  parentId: string;
  name: string;
};

export function useNexusState() {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with root agent
  useEffect(() => {
    if (agents.length === 0) {
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
  }, [agents.length]);

  // Spawn a new agent
  const spawnAgent = useCallback(
    (request: SpawnRequest) => {
      const parent = agents.find(a => a.id === request.parentId);
      if (!parent) {
        setError(`Parent agent ${request.parentId} not found`);
        return;
      }

      // Check depth limit (MAX_RECURSION_DEPTH = 5)
      if (parent.depth >= 5) {
        setError(`Cannot spawn: depth limit exceeded for ${request.parentId}`);
        return;
      }

      // Check children limit (MAX_CHILDREN_PER_AGENT = 3)
      const childCount = agents.filter(a => a.parentId === request.parentId).length;
      if (childCount >= 3) {
        setError(`Cannot spawn: child limit exceeded for ${request.parentId}`);
        return;
      }

      const newAgent: AgentNode = {
        id: `${request.parentId}-${Date.now()}`,
        name: request.name,
        depth: parent.depth + 1,
        parentId: request.parentId,
        drift: false,
        stdDev: 0,
        entropy: 0,
      };

      setAgents(prev => [...prev, newAgent]);
      setError(null);
    },
    [agents]
  );

  // Update agent drift status
  const updateDrift = useCallback((agentId: string, drift: { stdDev: number; entropy: number; drift: boolean }) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? { ...a, stdDev: drift.stdDev, entropy: drift.entropy, drift: drift.drift }
          : a
      )
    );
  }, []);

  // Fetch drift logs from API
  const fetchDriftData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from /api/nexus/drift
      // For now, simulate some drift updates
      const mockDrift = agents.map(a => ({
        agentId: a.id,
        stdDev: Math.random() * 2,
        entropy: Math.random(),
        drift: Math.random() > 0.7,
      }));

      mockDrift.forEach(d => {
        updateDrift(d.agentId, d);
      });

      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch drift data");
    } finally {
      setLoading(false);
    }
  }, [agents, updateDrift]);

  // Clear all agents except root
  const resetNexus = useCallback(() => {
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
  }, []);

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
    updateDrift,
    fetchDriftData,
    resetNexus,
    getAgent,
    getChildren,
  };
}
