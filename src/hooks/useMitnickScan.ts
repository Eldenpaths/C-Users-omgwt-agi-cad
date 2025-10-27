// CLAUDE-META: Phase 9C Hybrid Patch - MitnickGPT Integration
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Security scanning for Nexus agent operations
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useEffect, useState, useCallback } from "react";
import { AgentNode } from "@/components/nexus/NexusViz";

export type SecurityThreat = {
  agentId: string;
  type: "depth_exceeded" | "rate_limit" | "identity_mismatch" | "unknown";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: number;
  blocked: boolean;
};

export type SecurityStatus = {
  threatLevel: "green" | "yellow" | "orange" | "red";
  knownAgents: number;
  blockedActions: number;
  recentThreats: SecurityThreat[];
};

/**
 * Client-side MitnickGPT integration hook
 * Validates agent operations before spawning
 */
export function useMitnickScan() {
  const [status, setStatus] = useState<SecurityStatus>({
    threatLevel: "green",
    knownAgents: 0,
    blockedActions: 0,
    recentThreats: [],
  });

  const [scanning, setScanning] = useState(false);

  /**
   * Scan agent spawn request
   */
  const scanSpawn = useCallback(async (
    parentId: string,
    name: string,
    depth: number,
    agents: AgentNode[]
  ): Promise<{ allowed: boolean; threat?: SecurityThreat }> => {
    setScanning(true);

    try {
      // Check 1: Depth limit (MAX_RECURSION_DEPTH = 5)
      if (depth > 5) {
        const threat: SecurityThreat = {
          agentId: `${parentId}:${name}`,
          type: "depth_exceeded",
          severity: "high",
          message: `Recursion depth ${depth} exceeds limit of 5`,
          timestamp: Date.now(),
          blocked: true,
        };

        setStatus(prev => ({
          ...prev,
          threatLevel: "orange",
          blockedActions: prev.blockedActions + 1,
          recentThreats: [threat, ...prev.recentThreats].slice(0, 10),
        }));

        return { allowed: false, threat };
      }

      // Check 2: Parent child limit (MAX_CHILDREN = 3)
      const siblings = agents.filter(a => a.parentId === parentId);
      if (siblings.length >= 3) {
        const threat: SecurityThreat = {
          agentId: `${parentId}:${name}`,
          type: "rate_limit",
          severity: "medium",
          message: `Parent ${parentId} has reached child limit of 3`,
          timestamp: Date.now(),
          blocked: true,
        };

        setStatus(prev => ({
          ...prev,
          threatLevel: prev.threatLevel === "green" ? "yellow" : prev.threatLevel,
          blockedActions: prev.blockedActions + 1,
          recentThreats: [threat, ...prev.recentThreats].slice(0, 10),
        }));

        return { allowed: false, threat };
      }

      // Check 3: Name validation (no suspicious patterns)
      const suspiciousPatterns = [
        /eval/i,
        /exec/i,
        /system/i,
        /script/i,
        /<script>/i,
        /\$\{/,
        /\${.*}/,
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(name))) {
        const threat: SecurityThreat = {
          agentId: `${parentId}:${name}`,
          type: "identity_mismatch",
          severity: "high",
          message: `Suspicious agent name detected: ${name}`,
          timestamp: Date.now(),
          blocked: true,
        };

        setStatus(prev => ({
          ...prev,
          threatLevel: "red",
          blockedActions: prev.blockedActions + 1,
          recentThreats: [threat, ...prev.recentThreats].slice(0, 10),
        }));

        return { allowed: false, threat };
      }

      // All checks passed
      setStatus(prev => ({
        ...prev,
        knownAgents: prev.knownAgents + 1,
      }));

      return { allowed: true };
    } finally {
      setScanning(false);
    }
  }, []);

  /**
   * Get current threat level color
   */
  const getThreatColor = useCallback(() => {
    switch (status.threatLevel) {
      case "green": return "#10b981";
      case "yellow": return "#f59e0b";
      case "orange": return "#f97316";
      case "red": return "#ef4444";
    }
  }, [status.threatLevel]);

  /**
   * Reset threat level (manual override)
   */
  const resetThreatLevel = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      threatLevel: "green",
      recentThreats: [],
    }));
  }, []);

  return {
    status,
    scanning,
    scanSpawn,
    getThreatColor,
    resetThreatLevel,
  };
}
