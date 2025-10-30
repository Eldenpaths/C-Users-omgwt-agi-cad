// CLAUDE-META: Phase 9D Hybrid Patch - Agent Control API (Firebase Auth)
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Agent control with Firebase ID token authentication
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { verifyFirebaseToken, verifyOwnership } from "@/lib/security/auth";

const ControlSchema = z.object({
  action: z.enum(["pause", "resume", "terminate"]),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  initAdmin();
  const db = getFirestore();

  // Verify Firebase ID token
  const authResult = await verifyFirebaseToken(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  const user = authResult.user!;

  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Agent ID required" });
    }

    const controlData = ControlSchema.parse(req.body);
    const { action } = controlData;

    // Get agent
    const agentRef = db.collection("nexusAgents").doc(id);
    const agentDoc = await agentRef.get();

    if (!agentDoc.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const agentData = agentDoc.data();

    // Verify ownership
    const ownershipCheck = verifyOwnership(user.uid, agentData?.uid);
    if (!ownershipCheck.valid) {
      return res.status(403).json({ error: ownershipCheck.error });
    }

    // Apply action
    let newStatus: string;
    switch (action) {
      case "pause":
        if (agentData?.status === "terminated") {
          return res.status(400).json({ error: "Cannot pause terminated agent" });
        }
        newStatus = "paused";
        break;

      case "resume":
        if (agentData?.status === "terminated") {
          return res.status(400).json({ error: "Cannot resume terminated agent" });
        }
        newStatus = "active";
        break;

      case "terminate":
        newStatus = "terminated";
        // Cascade terminate to children
        const childrenSnapshot = await db
          .collection("nexusAgents")
          .where("parentId", "==", id)
          .where("uid", "==", user.uid)
          .get();

        const batch = db.batch();
        childrenSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: "terminated",
            updatedAt: Timestamp.now(),
          });
        });
        await batch.commit();
        break;
    }

    // Update agent status
    await agentRef.update({
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Log control action
    await db.collection("nexusControlLog").add({
      uid: user.uid,
      agentId: id,
      action,
      previousStatus: agentData?.status,
      newStatus,
      createdAt: Timestamp.now(),
    });

    return res.status(200).json({
      agent: {
        id,
        ...agentData,
        status: newStatus,
      },
      message: `Agent ${action}d successfully`,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: e.issues });
    }
    return res.status(500).json({ error: e.message || "Failed to control agent" });
  }
}
