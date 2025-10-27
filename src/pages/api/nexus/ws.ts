// CLAUDE-META: Phase 9D Hybrid Patch - WebSocket Bidirectional Control
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: WebSocket server for real-time agent control and telemetry
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest, NextApiResponse } from "next";
import { Server as WebSocketServer, WebSocket } from "ws";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Extend the response type to include socket
type NextApiResponseWithSocket = NextApiResponse & {
  socket: any;
};

// Message types
type ClientMessage =
  | { type: "auth"; token: string }
  | { type: "spawn"; parentId: string; name: string }
  | { type: "control"; agentId: string; action: "pause" | "resume" | "terminate" }
  | { type: "subscribe"; agentId: string }
  | { type: "ping" };

type ServerMessage =
  | { type: "authenticated"; uid: string }
  | { type: "error"; message: string }
  | { type: "drift"; agentId: string; stdDev: number; entropy: number; drift: boolean; timestamp: number }
  | { type: "agent_spawned"; agent: any }
  | { type: "agent_updated"; agentId: string; status: string }
  | { type: "pong"; timestamp: number };

// Store active connections by UID
const connections = new Map<string, Set<WebSocket>>();

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // This endpoint only works with WebSocket upgrade
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  initAdmin();
  const auth = getAuth();
  const db = getFirestore();

  // Check if WebSocket upgrade is possible
  if (!res.socket?.server) {
    return res.status(500).json({ error: "WebSocket server not available" });
  }

  // Initialize WebSocket server if not already done
  if (!res.socket.server.wss) {
    console.log("[WebSocket] Initializing WebSocket server");
    const wss = new WebSocketServer({ noServer: true });

    res.socket.server.wss = wss;

    // Handle upgrade
    res.socket.server.on("upgrade", (request: any, socket: any, head: any) => {
      if (request.url === "/api/nexus/ws") {
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          wss.emit("connection", ws, request);
        });
      }
    });

    // Handle connections
    wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket] Client connected");

      let authenticatedUid: string | null = null;
      let subscriptions = new Set<string>();

      // Handle messages
      ws.on("message", async (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());

          // Authentication required for all messages except auth
          if (message.type !== "auth" && !authenticatedUid) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Authentication required",
            } as ServerMessage));
            return;
          }

          switch (message.type) {
            case "auth":
              try {
                const decodedToken = await auth.verifyIdToken(message.token);
                authenticatedUid = decodedToken.uid;

                // Register connection
                if (!connections.has(authenticatedUid)) {
                  connections.set(authenticatedUid, new Set());
                }
                connections.get(authenticatedUid)!.add(ws);

                ws.send(JSON.stringify({
                  type: "authenticated",
                  uid: authenticatedUid,
                } as ServerMessage));

                console.log(`[WebSocket] Client authenticated: ${authenticatedUid}`);
              } catch (error) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Authentication failed",
                } as ServerMessage));
                ws.close();
              }
              break;

            case "spawn":
              // Spawn agent logic (similar to REST API)
              try {
                const agentRef = db.collection("nexusAgents").doc();
                const agentData = {
                  uid: authenticatedUid,
                  name: message.name,
                  parentId: message.parentId,
                  status: "active",
                  createdAt: new Date(),
                };

                await agentRef.set(agentData);

                ws.send(JSON.stringify({
                  type: "agent_spawned",
                  agent: { id: agentRef.id, ...agentData },
                } as ServerMessage));

                console.log(`[WebSocket] Agent spawned: ${agentRef.id}`);
              } catch (error: any) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: error.message || "Failed to spawn agent",
                } as ServerMessage));
              }
              break;

            case "control":
              // Control agent
              try {
                const agentRef = db.collection("nexusAgents").doc(message.agentId);
                await agentRef.update({
                  status: message.action === "pause" ? "paused" : message.action === "resume" ? "active" : "terminated",
                  updatedAt: new Date(),
                });

                ws.send(JSON.stringify({
                  type: "agent_updated",
                  agentId: message.agentId,
                  status: message.action,
                } as ServerMessage));

                console.log(`[WebSocket] Agent ${message.agentId} ${message.action}d`);
              } catch (error: any) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: error.message || "Failed to control agent",
                } as ServerMessage));
              }
              break;

            case "subscribe":
              subscriptions.add(message.agentId);
              console.log(`[WebSocket] Subscribed to agent ${message.agentId}`);
              break;

            case "ping":
              ws.send(JSON.stringify({
                type: "pong",
                timestamp: Date.now(),
              } as ServerMessage));
              break;
          }
        } catch (error) {
          console.error("[WebSocket] Message parsing error:", error);
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid message format",
          } as ServerMessage));
        }
      });

      // Handle disconnect
      ws.on("close", () => {
        if (authenticatedUid) {
          const userConnections = connections.get(authenticatedUid);
          if (userConnections) {
            userConnections.delete(ws);
            if (userConnections.size === 0) {
              connections.delete(authenticatedUid);
            }
          }
          console.log(`[WebSocket] Client disconnected: ${authenticatedUid}`);
        } else {
          console.log("[WebSocket] Unauthenticated client disconnected");
        }
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error("[WebSocket] Connection error:", error);
      });
    });
  }

  // Return 101 Switching Protocols
  res.status(101).end();
}

// Broadcast message to all connections for a given UID
export function broadcastToUser(uid: string, message: ServerMessage) {
  const userConnections = connections.get(uid);
  if (userConnections) {
    const messageStr = JSON.stringify(message);
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

// Disable body parser for WebSocket connections
export const config = {
  api: {
    bodyParser: false,
  },
};
