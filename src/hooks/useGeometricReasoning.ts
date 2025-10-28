// CLAUDE-META: Phase 10 Leapfrog - Geometric Reasoning Hook
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: React hook for W-GRE integration
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useState, useCallback, useRef } from "react";
import {
  GeometricReasoningEngine,
  GeometricPrimitive,
  SymbolicMetricReport,
} from "@/lib/vision/geometric-reasoning";

export function useGeometricReasoning() {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<SymbolicMetricReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<GeometricReasoningEngine | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize engine
  const initialize = useCallback(async () => {
    if (engineRef.current) return true;

    try {
      const engine = new GeometricReasoningEngine();
      const success = await engine.initialize();

      if (success) {
        engineRef.current = engine;
        setInitialized(true);
        setError(null);
        return true;
      } else {
        setError("WebGPU not available - falling back to CPU");
        return false;
      }
    } catch (e: any) {
      setError(e.message || "Failed to initialize");
      return false;
    }
  }, []);

  // Analyze geometry
  const analyze = useCallback(
    async (primitives: GeometricPrimitive[]) => {
      setAnalyzing(true);
      setError(null);

      try {
        // Initialize if needed
        if (!engineRef.current) {
          await initialize();
        }

        if (!engineRef.current) {
          throw new Error("Engine not initialized");
        }

        // Perform analysis
        const result = await engineRef.current.analyze(primitives);
        setReport(result);
        return result;
      } catch (e: any) {
        setError(e.message || "Analysis failed");
        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    [initialize]
  );

  // Clear results
  const clear = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    initialized,
    analyzing,
    report,
    error,
    initialize,
    analyze,
    clear,
  };
}
