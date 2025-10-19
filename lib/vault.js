// lib/vault.js
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc,
  query, orderBy, limit, serverTimestamp, runTransaction
} from "firebase/firestore";

/** Simple stable JSON stringifier */
function stableStringify(o) {
  return JSON.stringify(o, Object.keys(o).sort());
}

/** Browser-side SHA-256 (runs when you click Sweep) */
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Compute checksum of /snapshots/latest (if present) */
export async function snapshotChecksum() {
  const latestRef = doc(db, "snapshots", "latest");
  const snap = await getDoc(latestRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return await sha256(stableStringify(data));
}

/**
 * writeSnapshotVerified:
 * - Transactionally bumps version and stores provided partial snapshot fields.
 * - Writes checksum field for integrity audit.
 */
export async function writeSnapshotVerified(partial) {
  const latestRef = doc(db, "snapshots", "latest");
  await runTransaction(db, async (tx) => {
    const s = await tx.get(latestRef);
    const current = s.exists() ? (s.data().version || 0) : 0;
    const nextVersion = current + 1;
    const merged = { ...(s.exists() ? s.data() : {}), ...partial };

    const checksum = await sha256(stableStringify(merged));

    tx.set(latestRef, {
      ...merged,
      version: nextVersion,
      checksum,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

/**
 * runVaultSweep:
 * - Collects the most recent N commands and summarizes them by 'op'.
 * - Writes a compaction record to /vault/sweeps with checksum of snapshot.
 * - (Non-destructive) — does NOT delete anything; safe to run anytime.
 */
export async function runVaultSweep({ sample = 200 } = {}) {
  // Pull last N commands
  const cmdQ = query(collection(db, "commands"), orderBy("createdAt", "desc"), limit(sample));
  const snap = await getDocs(cmdQ);
  const cmds = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Summarize by op
  const counts = {};
  for (const c of cmds) {
    const key = c.op || c.type || "UNKNOWN";
    counts[key] = (counts[key] || 0) + 1;
  }

  // Grab current snapshot + checksum
  const latest = await getDoc(doc(db, "snapshots", "latest"));
  const latestData = latest.exists() ? latest.data() : {};
  const checksum = await sha256(stableStringify(latestData));

  // Write sweep record
  const res = await addDoc(collection(db, "vault", "sweeps", "runs"), {
    createdAt: serverTimestamp(),
    sampleSize: cmds.length,
    byOp: counts,
    snapshotVersion: latestData.version || 0,
    snapshotChecksum: checksum,
  });

  // Optionally stamp snapshot with lastSweepId
  await setDoc(doc(db, "snapshots", "latest"), {
    lastSweepId: res.id,
    lastSweepAt: serverTimestamp(),
  }, { merge: true });

  return { sweepId: res.id, byOp: counts, snapshotVersion: latestData.version || 0 };
}
