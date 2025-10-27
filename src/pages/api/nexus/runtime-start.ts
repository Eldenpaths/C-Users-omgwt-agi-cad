// CLAUDE-META: Phase 9D Hybrid Patch - Runtime Management API
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Start/stop agent runtime with WebSocket telemetry
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyFirebaseToken } from "@/lib/security/auth";
import { AgentRuntime, AgentConfig } from "@/lib/runtime/AgentRuntime";
import { broadcastToUser } from "./ws";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// Store runtime instances by UID
const runtimes = new Map<string, AgentRuntime>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  initAdmin();
  const db = getFirestore();

  // Verify Firebase ID token
  const authResult = await verifyFirebaseToken(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  const user = authResult.user!;

  // POST: Start runtime
  if (req.method === "POST") {
    try {
      // Check if runtime already exists
      if (runtimes.has(user.uid)) {
        return res.status(400).json({ error: "Runtime already running for this user" });
      }

      // Create new runtime
      const runtime = new AgentRuntime(1000, 8); // 1 sec tick, 8-dim state

      // Fetch active agents from Firestore
      const agentsSnapshot = await db
        .collection("nexusAgents")
        .where("uid", "==", user.uid)
        .where("status", "==", "active")
        .get();

      // Register agents with runtime
      agentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const agentConfig: AgentConfig = {
          id: doc.id,
          name: data.name,
          depth: data.depth || 0,
          parentId: data.parentId,
          uid: user.uid,
        };

        runtime.registerAgent(agentConfig);
      });

      // Start runtime with metrics callback
      runtime.start(
        // onMetricsUpdate
        (metrics) => {
          // Broadcast metrics via WebSocket
          broadcastToUser(user.uid, {
            type: "drift",
            agentId: metrics.agentId,
            stdDev: metrics.stdDev,
            entropy: metrics.entropy,
            drift: metrics.drift,
            timestamp: metrics.timestamp,
          });

          // Also log to Firestore for historical tracking
          db.collection("nexusDrift").add({
            uid: user.uid,
            agentId: metrics.agentId,
            stdDev: metrics.stdDev,
            entropy: metrics.entropy,
            drift: metrics.drift,
            lineageRoot: metrics.agentId, // Simplified for Phase 9D
            createdAt: new Date(),
          }).catch(error => {
            console.error("[Runtime] Failed to log drift:", error);
          });
        },
        // onError
        (agentId, error) => {
          console.error(`[Runtime] Agent ${agentId} error:`, error);

          broadcastToUser(user.uid, {
            type: "error",
            message: `Agent ${agentId}: ${error.message}`,
          });
        }
      );

      runtimes.set(user.uid, runtime);

      console.log(`[Runtime] Started for user ${user.uid} with ${runtime.getActiveCount()} agents`);

      return res.status(200).json({
        message: "Runtime started",
        activeAgents: runtime.getActiveCount(),
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to start runtime" });
    }
  }

  // DELETE: Stop runtime
  if (req.method === "DELETE") {
    try {
      const runtime = runtimes.get(user.uid);
      if (!runtime) {
        return res.status(404).json({ error: "No runtime running for this user" });
      }

      runtime.stop();
      runtimes.delete(user.uid);

      console.log(`[Runtime] Stopped for user ${user.uid}`);

      return res.status(200).json({
        message: "Runtime stopped",
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to stop runtime" });
    }
  }

  // GET: Runtime status
  if (req.method === "GET") {
    const runtime = runtimes.get(user.uid);

    if (!runtime) {
      return res.status(200).json({
        running: false,
        activeAgents: 0,
      });
    }

    return res.status(200).json({
      running: true,
      activeAgents: runtime.getActiveCount(),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
