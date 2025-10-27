// src/features/telemetry/ChecksumSentinel.js
'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class ChecksumSentinel {
  static async validateVault(vaultId) {
    try {
      const ref = doc(db, 'vaultMeta', vaultId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return false;

      const data = snap.data();
      const computed = await this.computeChecksum(data);
      const stored = data.lastChecksum;

      if (stored && stored !== computed) {
        console.error(`[ChecksumSentinel] ❌ Vault ${vaultId} integrity mismatch`);
        await this.triggerAlert(vaultId);
        return false;
      }

      // update checksum if missing or new
      await setDoc(ref, { lastChecksum: computed }, { merge: true });
      console.log(`[ChecksumSentinel] ✅ Vault ${vaultId} verified`);
      return true;
    } catch (err) {
      console.error('ChecksumSentinel error:', err);
      return false;
    }
  }

  static async computeChecksum(obj) {
    const encoder = new TextEncoder();
    const json = JSON.stringify(obj);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(json));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async triggerAlert(vaultId) {
    // Later: integrate Cloud Function or webhook alert
    alert(`Vault ${vaultId} failed integrity validation!`);
  }
}


