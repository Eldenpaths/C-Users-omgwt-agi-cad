// lib/checksumSentinel.js
import { snapshotChecksum } from "@/lib/vault";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Compares live snapshot checksum to last recorded one
 * Returns { ok: true } or { desync: true }
 */
export async function verifyChecksum() {
  const live = await snapshotChecksum();
  const meta = await getDoc(doc(db, "vaultMeta", "phase7"));
  if (!meta.exists()) return { ok: false, note: "no-meta" };

  const last = meta.data().lastChecksum;
  if (live === last) return { ok: true, checksum: live };
  return { desync: true, current: live, previous: last };
}
