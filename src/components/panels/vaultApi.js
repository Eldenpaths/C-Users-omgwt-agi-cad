// lib/vaultApi.js — read-only stub for future Firestore integration
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function fetchVaultEntries(uid) {
  try {
    const snap = await getDocs(collection(db, `users/${uid}/vault`));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Vault fetch failed:", e);
    return [];
  }
}
