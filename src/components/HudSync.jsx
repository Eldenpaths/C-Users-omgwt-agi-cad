"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { runVaultSweep } from "@/lib/vault";
import { subscribe } from "@/lib/syncStatus";

function fmt(ts) {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : ts.toDate?.() ?? new Date(ts);
  return d.toLocaleString();
}

export default function HudSync() {
  const [phase, setPhase] = useState("saved");
  const [lastSweepAt, setLastSweepAt] = useState(null);
  const [sweepCount, setSweepCount] = useState(0);
  const [busy, setBusy] = useState(false);

  // subscribe to sync status
  useEffect(() => subscribe(s => setPhase(s.phase)), []);

  // load lastSweepAt + recent sweep count
  async function refresh() {
    const snap = await getDoc(doc(db, "snapshots", "latest"));
    if (snap.exists()) setLastSweepAt(snap.data().lastSweepAt ?? null);

    const runsQ = query(
      collection(db, "vault", "sweeps", "runs"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const runs = await getDocs(runsQ);
    setSweepCount(runs.size);
  }

  useEffect(() => { refresh(); }, []);

  async function doSweep() {
    setBusy(true);
    try {
      await runVaultSweep();
      await refresh();
    } finally { setBusy(false); }
  }

  const heartbeat =
    phase === "offline" ? "opacity-40" :
    phase === "saving"  ? "animate-pulse" :
    phase === "syncing" ? "animate-pulse" :
    "";

  return (
    <section className="w-full rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-3 gap-4">
      <div className="col-span-1 flex items-center gap-3">
        <span className={`inline-block w-2.5 h-2.5 rounded-full bg-green-400 ${heartbeat}`} />
        <div>
          <div className="text-sm text-gray-300">Heartbeat</div>
          <div className="text-xs opacity-80">Phase: <b>{phase}</b></div>
        </div>
      </div>

      <div className="col-span-1">
        <div className="text-sm text-gray-300">Vault Sweeps (recent)</div>
        <div className="text-2xl font-semibold">{sweepCount}</div>
      </div>

      <div className="col-span-1">
        <div className="text-sm text-gray-300">lastSweepAt</div>
        <div className="text-sm">{fmt(lastSweepAt)}</div>
      </div>

      <div className="col-span-3">
        <button
          onClick={doSweep}
          disabled={busy}
          className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          {busy ? "Sweeping…" : "Run Vault Sweep"}
        </button>
      </div>
    </section>
  );
}
