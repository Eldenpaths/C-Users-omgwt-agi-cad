import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { publish } from "@/lib/eventBus";
import { markSyncing, markSaved } from "@/lib/syncStatus";

export function initForgewright(uid) {
  const col = collection(db, "users", uid, "forge");
  const unsubscribe = onSnapshot(col, (snap) => {
    markSyncing();
    publish("forge:update", { count: snap.size, at: Date.now() });
    markSaved();
  });
  return unsubscribe;
}

