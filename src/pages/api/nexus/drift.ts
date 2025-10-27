// CLAUDE-META: Phase 9A Hybrid Patch - Drift Logging API
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Log agent drift metrics to Firestore
// Status: Production - Hybrid Safe Mode Active

import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";

const Body = z.object({
  uid: z.string(),
  stdDev: z.number(),
  entropy: z.number(),
  drift: z.boolean(),
  lineageRoot: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
  try {
    initAdmin();
    const body = Body.parse(req.body);
    const db = getFirestore();
    await db.collection("nexusDrift").add({
      ...body,
      createdAt: Timestamp.now(),
    });
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}
