// CLAUDE-META: Phase 9D Hybrid Patch - WebSocket Client Hook
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Bidirectional WebSocket connection for agent control
// Status: Production - Hybrid Safe Mode Active

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getAuth } from "firebase/auth";

type ServerMessage =
  | { type: "authenticated"; uid: string }
  | { type: "error"; message: string }
  | { type: "drift"; agentId: string; stdDev: number; entropy: number; drift: boolean; timestamp: number }
  | { type: "agent_spawned"; agent: any }
  | { type: "agent_updated"; agentId: string; status: string }
  | { type: "pong"; timestamp: number };

type ClientMessage =
  | { type: "auth"; token: string }
  | { type: "spawn"; parentId: string; name: string }
  | { type: "control"; agentId: string; action: "pause" | "resume" | "terminate" }
  | { type: "subscribe"; agentId: string }
  | { type: "ping" };

export function useWebSocketNexus(enabled: boolean = true) {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message: not connected");
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled) return;

    try {
      // Get Firebase ID token
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("User not authenticated");
        return;
      }

      const idToken = await user.getIdToken();

      // Establish WebSocket connection
      // Note: In browser, ws:// is upgraded to wss:// automatically on HTTPS
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/nexus/ws`;

      console.log("[WebSocket] Connecting to", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setConnected(true);
        setError(null);

        // Send authentication message
        ws.send(JSON.stringify({
          type: "auth",
          token: idToken,
        } as ClientMessage));

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" } as ClientMessage));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          setLastMessage(message);

          if (message.type === "authenticated") {
            console.log("[WebSocket] Authenticated as", message.uid);
            setAuthenticated(true);
          } else if (message.type === "error") {
            console.error("[WebSocket] Server error:", message.message);
            setError(message.message);
          }
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setConnected(false);
        setAuthenticated(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnect after 5 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[WebSocket] Attempting reconnect...");
            connect();
          }, 5000);
        }
      };
    } catch (error: any) {
      console.error("[WebSocket] Connection failed:", error);
      setError(error.message || "Failed to connect");
    }
  }, [enabled]);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [enabled, connect]);

  // Command methods
  const spawnAgent = useCallback((parentId: string, name: string) => {
    send({ type: "spawn", parentId, name });
  }, [send]);

  const controlAgent = useCallback((agentId: string, action: "pause" | "resume" | "terminate") => {
    send({ type: "control", agentId, action });
  }, [send]);

  const subscribeToAgent = useCallback((agentId: string) => {
    send({ type: "subscribe", agentId });
  }, [send]);

  return {
    connected,
    authenticated,
    error,
    lastMessage,
    spawnAgent,
    controlAgent,
    subscribeToAgent,
    reconnect: connect,
  };
}
