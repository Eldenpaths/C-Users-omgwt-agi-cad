import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Phase 7 firebase export

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MISSIONS_COL = "missions";   // global registry
const AGENTS_COL   = "agents";     // agent presence + telemetry
const LOGS_COL     = "agentLogs";  // structured logs per agent

// ---------------------------------------------------------------------------
// Queue Service
// ---------------------------------------------------------------------------
export const QueueService = {
  /** Enqueue a new mission. */
  async enqueueMission({ kind, prompt, params = {}, requestedBy }) {
    const payload = {
      kind,
      prompt,
      params,
      requestedBy: requestedBy || null,
      status: "queued",
      claimedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, MISSIONS_COL), payload);
    return { id: ref.id, ...payload };
  },

  /** Claims the next available mission for an agent in a given kind set. */
  async claimNextMission(agentId, supportedKinds = []) {
    // Query for oldest queued mission matching supported kinds
    const q = query(
      collection(db, MISSIONS_COL),
      where("status", "==", "queued"),
      orderBy("createdAt", "asc"),
      limit(10)
    );
    const snap = await getDocs(q);

    // Try to claim one atomically
    for (const d of snap.docs) {
      const missionRef = d.ref;
      try {
        const result = await runTransaction(db, async (tx) => {
          const fresh = await tx.get(missionRef);
          if (!fresh.exists()) return null;
          const m = fresh.data();
          if (m.status !== "queued") return null;
          if (supportedKinds.length && !supportedKinds.includes(m.kind)) return null;
          tx.update(missionRef, {
            status: "in_progress",
            claimedBy: agentId,
            updatedAt: serverTimestamp(),
          });
          return { id: fresh.id, ...m };
        });
        if (result) return result; // success
      } catch (e) {
        // contention; try next
      }
    }
    return null; // nothing claimed
  },

  /** Complete a mission with result payload. */
  async completeMission(missionId, result, status = "completed") {
    const missionRef = doc(db, MISSIONS_COL, missionId);
    await updateDoc(missionRef, {
      status,
      result: result ?? null,
      updatedAt: serverTimestamp(),
    });
  },

  /** Register an agent with metadata or refresh status. */
  async registerAgent(agentId, meta = {}) {
    const ref = doc(db, AGENTS_COL, agentId);
    await setDoc(
      ref,
      {
        agentId,
        ...meta,
        heartbeatAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  /** Heartbeat ping from agent. */
  async heartbeat(agentId, status = {}) {
    const ref = doc(db, AGENTS_COL, agentId);
    await updateDoc(ref, {
      ...status,
      heartbeatAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /** Append a structured log entry under the agentLogs collection. */
  async log(agentId, level, message, meta = {}) {
    await addDoc(collection(db, LOGS_COL), {
      agentId,
      level,
      message,
      meta,
      createdAt: serverTimestamp(),
    });
  },
};
