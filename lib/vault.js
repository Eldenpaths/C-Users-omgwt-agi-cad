// lib/vault.js
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

/** Simple stable JSON stringifier */
function stableStringify(o) {
  return JSON.stringify(o, Object.keys(o).sort());
}

/** Browser-side SHA-256 (runs when you click Sweep) */
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Compute checksum of /users/{uid}/snapshots/latest (if present) */
export async function snapshotChecksum(user) {
  if (!user?.uid) throw new Error("User not authenticated");
  const latestRef = doc(db, `users/${user.uid}/snapshots/latest`);
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
export async function writeSnapshotVerified(user, partial) {
  if (!user?.uid) throw new Error("User not authenticated");

  const latestRef = doc(db, `users/${user.uid}/snapshots/latest`);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(latestRef);
    const current = s.exists() ? s.data().version || 0 : 0;
    const nextVersion = current + 1;
    const merged = { ...(s.exists() ? s.data() : {}), ...partial };

    const checksum = await sha256(stableStringify(merged));

    tx.set(
      latestRef,
      {
        ...merged,
        uid: user.uid,
        version: nextVersion,
        checksum,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/**
 * runVaultSweep:
 * - Collects the most recent N commands and summarizes them by 'op'.
 * - Writes a compaction record to /users/{uid}/vault/sweeps/runs.
 * - (Non-destructive) — does NOT delete anything; safe to run anytime.
 */
export async function runVaultSweep(user, { sample = 200 } = {}) {
  if (!user?.uid) throw new Error("User not authenticated");

  // Pull last N commands
  const cmdQ = query(
    collection(db, `users/${user.uid}/commands`),
    orderBy("createdAt", "desc"),
    limit(sample)
  );
  const snap = await getDocs(cmdQ);
  const cmds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Summarize by op
  const counts = {};
  for (const c of cmds) {
    const key = c.op || c.type || "UNKNOWN";
    counts[key] = (counts[key] || 0) + 1;
  }

  // Grab current snapshot + checksum
  const latest = await getDoc(doc(db, `users/${user.uid}/snapshots/latest`));
  const latestData = latest.exists() ? latest.data() : {};
  const checksum = await sha256(stableStringify(latestData));

  // Write sweep record
  const sweepRef = collection(db, `users/${user.uid}/vault/sweeps/runs`);
  const res = await addDoc(sweepRef, {
    uid: user.uid,
    createdAt: serverTimestamp(),
    sampleSize: cmds.length,
    byOp: counts,
    snapshotVersion: latestData.version || 0,
    snapshotChecksum: checksum,
  });

  // Optionally stamp snapshot with lastSweepId
  await setDoc(
    doc(db, `users/${user.uid}/snapshots/latest`),
    {
      lastSweepId: res.id,
      lastSweepAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    sweepId: res.id,
    byOp: counts,
    snapshotVersion: latestData.version || 0,
  };
}
