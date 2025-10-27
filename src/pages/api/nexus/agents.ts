// CLAUDE-META: Phase 9D Hybrid Patch - Agent Operations API (Firebase Auth)
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Live agent lifecycle with Firebase ID token authentication
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { verifyFirebaseToken, verifyOwnership } from "@/lib/security/auth";

const SpawnSchema = z.object({
  parentId: z.string(),
  name: z.string().min(1).max(50),
  depth: z.number().int().min(0).max(5),
  lineageRoot: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  initAdmin();
  const db = getFirestore();

  // Verify Firebase ID token
  const authResult = await verifyFirebaseToken(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  const user = authResult.user!;

  // GET: List all agents for authenticated user
  if (req.method === "GET") {
    try {
      const snapshot = await db
        .collection("nexusAgents")
        .where("uid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const agents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ agents });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to fetch agents" });
    }
  }

  // POST: Spawn new agent
  if (req.method === "POST") {
    try {
      const spawnData = SpawnSchema.parse(req.body);
      const { parentId, name, depth, lineageRoot } = spawnData;

      // Validate depth limit
      if (depth > 5) {
        return res.status(400).json({ error: "Recursion depth limit exceeded (max 5)" });
      }

      // Check parent exists (if not root)
      if (parentId !== "root") {
        const parentDoc = await db.collection("nexusAgents").doc(parentId).get();
        if (!parentDoc.exists) {
          return res.status(404).json({ error: `Parent agent ${parentId} not found` });
        }

        // Verify parent ownership
        const parentData = parentDoc.data();
        const ownershipCheck = verifyOwnership(user.uid, parentData?.uid);
        if (!ownershipCheck.valid) {
          return res.status(403).json({ error: ownershipCheck.error });
        }

        // Check parent's child count
        const childrenSnapshot = await db
          .collection("nexusAgents")
          .where("parentId", "==", parentId)
          .where("uid", "==", user.uid)
          .get();

        if (childrenSnapshot.size >= 3) {
          return res.status(400).json({ error: "Parent child limit exceeded (max 3)" });
        }
      }

      // Create agent
      const agentRef = db.collection("nexusAgents").doc();
      const agentData = {
        uid: user.uid,
        name,
        parentId,
        depth,
        lineageRoot,
        status: "active" as const,
        drift: false,
        stdDev: 0,
        entropy: 0,
        stateVector: [] as number[], // Phase 9D: Store state vectors
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await agentRef.set(agentData);

      // Log lineage
      await db.collection("agentLineage").add({
        uid: user.uid,
        agentId: agentRef.id,
        parentId,
        lineageRoot,
        depth,
        createdAt: Timestamp.now(),
      });

      return res.status(201).json({
        agent: {
          id: agentRef.id,
          ...agentData,
        },
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: e.errors });
      }
      return res.status(500).json({ error: e.message || "Failed to spawn agent" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
