// hooks/useHeartbeat.js
import { useEffect, useState } from "react";
import { snapshotChecksum } from "@/lib/vault";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Heartbeat hook — polls every 1 s
 * Computes Vault checksum and delta since last sweep
 */
export function useHeartbeat() {
  const [status, setStatus] = useState("Idle");
  const [checksum, setChecksum] = useState(null);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    let last = Date.now();
    const run = async () => {
      try {
        const now = Date.now();
        const docRef = doc(db, "vaultMeta", "phase7");
        const snap = await getDoc(docRef);
        const prev = snap.exists() ? snap.data() : {};

        const cs = await snapshotChecksum();
        const syncDelta = (now - (prev.heartbeatAt?.toMillis?.() || now)) / 1000;

        await setDoc(
          docRef,
          { heartbeatAt: serverTimestamp(), lastChecksum: cs, syncDelta },
          { merge: true }
        );

        setStatus("Online");
        setChecksum(cs);
        setDelta(syncDelta.toFixed(1));
        last = now;
      } catch (err) {
        console.error("Heartbeat error:", err);
        setStatus("Error");
      }
    };

    run();
    const interval = setInterval(run, 1000);
    return () => clearInterval(interval);
  }, []);

  return { status, checksum, delta };
}
