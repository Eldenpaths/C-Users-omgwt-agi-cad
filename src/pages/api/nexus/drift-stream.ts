// CLAUDE-META: Phase 9C Hybrid Patch - Drift Streaming API
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Server-Sent Events for real-time drift telemetry
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest, NextApiResponse } from "next";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

/**
 * SSE endpoint for drift monitoring
 * Client connects and receives real-time updates as drift events occur
 *
 * TODO Phase 9D: Upgrade to WebSocket for bidirectional communication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uid } = req.query;
  if (!uid || typeof uid !== "string") {
    return res.status(400).json({ error: "UID required" });
  }

  initAdmin();
  const db = getFirestore();

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`);

  // Firestore listener for drift updates
  const unsubscribe = db
    .collection("nexusDrift")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(1)
    .onSnapshot(
      snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            const data = change.doc.data();
            res.write(`data: ${JSON.stringify({
              type: "drift",
              agentId: data.agentId || "unknown",
              stdDev: data.stdDev,
              entropy: data.entropy,
              drift: data.drift,
              lineageRoot: data.lineageRoot,
              timestamp: data.createdAt?.toMillis() || Date.now(),
            })}\n\n`);
          }
        });
      },
      error => {
        console.error("Drift stream error:", error);
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
      }
    );

  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`);
  }, 30000);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};
