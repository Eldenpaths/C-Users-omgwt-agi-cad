// CLAUDE-META: Phase 9A Hybrid Patch - Orbital Agent Visualization
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: React Three Fiber hook for agent orbit animation
// Status: Production - Hybrid Safe Mode Active

import { useMemo } from "react";
import { Vector3 } from "three";

export type OrbitParams = { a: number; e: number; phase: number; speed: number };

export function useAgentOrbits(n: number) {
  const params = useMemo<OrbitParams[]>(() => {
    return Array.from({ length: n }).map((_, i) => ({
      a: 2.0 + i * 0.6,      // semi-major axis
      e: Math.min(0.6, i * 0.05), // eccentricity
      phase: (i * Math.PI) / 3,
      speed: 0.25 + i * 0.03,
    }));
  }, [n]);

  function positionAt(i: number, t: number): Vector3 {
    const p = params[i];
    const M = p.speed * t + p.phase;              // mean anomaly
    const E = M;                                   // small-e approx; refine later
    const x = p.a * (Math.cos(E) - p.e);
    const y = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
    return new Vector3(x, y, 0);
  }

  return { params, positionAt };
}
