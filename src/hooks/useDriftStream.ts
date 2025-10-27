// CLAUDE-META: Phase 9C Hybrid Patch - Drift Stream Client
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: SSE client for real-time drift telemetry
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useEffect, useState, useCallback } from "react";

export type DriftEvent = {
  type: "drift" | "connected" | "heartbeat" | "error";
  agentId?: string;
  stdDev?: number;
  entropy?: number;
  drift?: boolean;
  lineageRoot?: string;
  timestamp: number;
  error?: string;
};

export function useDriftStream(uid: string | null, enabled: boolean = true) {
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<DriftEvent | null>(null);

  useEffect(() => {
    if (!uid || !enabled) {
      setConnected(false);
      return;
    }

    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`/api/nexus/drift-stream?uid=${uid}`);

        eventSource.onopen = () => {
          setConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: DriftEvent = JSON.parse(event.data);

            if (data.type === "connected") {
              setConnected(true);
            } else if (data.type === "drift") {
              setLastEvent(data);
              setEvents(prev => [data, ...prev].slice(0, 100)); // Keep last 100
            } else if (data.type === "error") {
              setError(data.error || "Unknown error");
            }
          } catch (e) {
            console.error("Failed to parse drift event:", e);
          }
        };

        eventSource.onerror = (err) => {
          console.error("Drift stream error:", err);
          setConnected(false);
          setError("Connection lost");
          eventSource?.close();

          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (e: any) {
        setError(e.message || "Failed to connect");
      }
    };

    connect();

    return () => {
      eventSource?.close();
      setConnected(false);
    };
  }, [uid, enabled]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    connected,
    error,
    events,
    lastEvent,
    clearEvents,
  };
}
