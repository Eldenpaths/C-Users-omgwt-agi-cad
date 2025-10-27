// /hooks/useSyncStatus.js
import { useEffect, useState } from "react";
import { onSnapshotsInSync } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { subscribe, getPendingCount } from "../lib/syncFlag.js";

export default function useSyncStatus() {
  const [connected, setConnected] = useState(true); // assume true; Firestore caches
  const [pending, setPending] = useState(getPendingCount() > 0);
  const [inSync, setInSync] = useState(true);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const unsub = onSnapshotsInSync(db, () => setInSync(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    const off = subscribe(({ pendingCount }) => {
      setPending(pendingCount > 0);
      if (pendingCount > 0) setInSync(false);
    });
    return off;
  }, []);

  useEffect(() => {
    function onUp() { setOnline(true); }
    function onDown() { setOnline(false); setInSync(false); }
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  // Status tri-state
  // 🔵 editing (user typing), 🟡 pending (sent but not yet committed), 🟢 saved
  let status = "saved";
  if (!online) status = "offline";
  else if (pending) status = "pending";
  else if (!inSync) status = "syncing";
  // You can add "editing" if you want to surface from editors.

  return { status, online, pending, inSync, connected };
}
