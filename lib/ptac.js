// lib/ptac.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  setDoc,
} from "firebase/firestore";

/**
 * commitCommand
 * - writes a command to /commands
 * - emits a derived event to /events
 * - atomically bumps /snapshots/latest.version and records lastCommand
 */
export async function commitCommand(command) {
  // 1) write the command
  const cmdRef = await addDoc(collection(db, "commands"), {
    ...command,
    createdAt: serverTimestamp(),
  });

  // 2) atomically update snapshot.version, then write an event
  const snapshotRef = doc(db, "snapshots", "latest");
  const nextVersion = await runTransaction(db, async (tx) => {
    const snap = await tx.get(snapshotRef);
    const current = snap.exists() ? snap.data().version || 0 : 0;
    const version = current + 1;
    tx.set(
      snapshotRef,
      {
        version,
        lastCommandId: cmdRef.id,
        lastCommandType: command.op ?? command.type ?? "UNKNOWN",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return version;
  });

  // 3) emit an event (not transactional, but safe & idempotent enough for UI)
  await addDoc(collection(db, "events"), {
    commandId: cmdRef.id,
    version: nextVersion,
    summary: `Applied ${command.op ?? command.type ?? "UNKNOWN"}`,
    createdAt: serverTimestamp(),
  });

  return { id: cmdRef.id, version: nextVersion };
}

