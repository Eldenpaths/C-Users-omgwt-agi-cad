"use client";
import React from 'react';

type Status = {
  messageCount: number;
  tokenEstimate: number;
  driftScore?: number;
  phaseStatus: 'stable' | 'approaching' | 'checkpoint' | string;
  updatedAt?: string;
};

export default function ThreadHealth() {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [note, setNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const s = await fetch('/api/thread/status', { cache: 'no-store' }).then((r) => r.json());
        if (!active) return;
        setStatus(s);
      } catch {}
      try {
        // Optional notifications tap — routed via dev server to local file if exposed
        const n = await fetch('/api/thread/notifications', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : []));
        if (!active) return;
        if (Array.isArray(n) && n.length > 0) setNote(n[0]?.message || null);
      } catch {}
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const badge = status ? badgeFor(status.phaseStatus) : { label: 'Loading…', color: 'bg-gray-400', icon: '•' };
  const drift = typeof status?.driftScore === 'number' ? status!.driftScore : null;

  return (
    <div className="rounded-xl border border-amber-500/20 p-3 bg-black/20">
      <div className="flex items-center justify-between">
        <div className="text-sm text-amber-300/80">Thread Health Monitor</div>
        <div className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>{badge.icon} {badge.label}</div>
      </div>
      <div className="mt-2 text-xs text-amber-300/70">
        {status && (
          <>
            <span className="mr-3">Msgs: {status.messageCount}</span>
            <span className="mr-3">Tokens≈ {status.tokenEstimate.toLocaleString()}</span>
            {drift !== null && <span>Δ Drift {drift.toFixed(2)}</span>}
          </>
        )}
        {!status && <span>Loading…</span>}
      </div>
      {note && <div className="mt-2 text-xs text-amber-400/80">{note}</div>}
    </div>
  );
}

function badgeFor(phaseStatus: string) {
  switch (phaseStatus) {
    case 'stable':
      return { label: 'Stable', color: 'bg-emerald-500/20 text-emerald-300', icon: '🟢' };
    case 'approaching':
      return { label: 'Approaching Phase Limit', color: 'bg-amber-500/20 text-amber-300', icon: '🟡' };
    case 'checkpoint':
      return { label: 'Checkpoint Reached', color: 'bg-rose-500/20 text-rose-300', icon: '🔴' };
    default:
      return { label: String(phaseStatus || 'Unknown'), color: 'bg-gray-500/20 text-gray-200', icon: '•' };
  }
}
