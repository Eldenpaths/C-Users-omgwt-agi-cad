'use client';

import { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChecksumSentinel } from './ChecksumSentinel';

const ALERT_THRESHOLD_MS = 10_000; // 10 seconds

export function useHeartbeat(vaultId) {
  const [syncDelta, setSyncDelta] = useState(0);
  const [lastPing, setLastPing] = useState(null);
  const [isAlive, setIsAlive] = useState(false);

  useEffect(() => {
    if (!vaultId) return;

    const ref = doc(db, 'vaultMeta', vaultId);
    let interval = setInterval(async () => {
      const now = Date.now();
      setLastPing(now);
      setIsAlive(true);

      await updateDoc(ref, {
        heartbeatAt: serverTimestamp(),
      });

      const delta = now - (lastPing || now);
      setSyncDelta(delta);

      if (delta > ALERT_THRESHOLD_MS) {
        console.warn(`[Sentinel Alert] Vault ${vaultId} desync: ${delta} ms`);
        ChecksumSentinel.triggerAlert?.(vaultId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [vaultId, lastPing]);

  return { isAlive, lastPing, syncDelta };
}


