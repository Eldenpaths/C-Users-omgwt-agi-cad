/**
 * ARCHIVIST-AGENT-01
 * Phase 16–17 Canon Registry & Drift Sentinel
 */

import { getFirestoreInstance } from "../lib/firebase";
import { VaultLogger } from "../lib/vault/vault-logger"; // ✅ Relative path for Node runtime

export interface CanonLab {
  name: string;
  focus: string;
  status: "active" | "pending" | "lost";
  phase: number;
  linkedAgents?: string[];
  lastSeen?: string;
}

export async function archivistSweep() {
  const db = getFirestoreInstance();
  const canonRef = db.collection("canon_registry");
  const logsRef = db.collection("project_logs");

  // Scan project logs
  const snapshot = await logsRef.get();
  const mentions: Record<string, CanonLab> = {};

  snapshot.forEach((doc) => {
    const text = JSON.stringify(doc.data());
    const regex = /([A-Z][A-Za-z]+)\s(Lab|Engine|Module|Agent)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const [, name, type] = match;
      if (!mentions[name]) {
        mentions[name] = {
          name: `${name} ${type}`,
          focus: "undocumented",
          status: "pending",
          phase: 0,
        };
      }
    }
  });

  // Write canonical registry updates
  for (const lab of Object.values(mentions)) {
    await canonRef.doc(lab.name).set(
      { ...lab, lastSeen: new Date().toISOString() },
      { merge: true }
    );
  }

  // Log to both collections
  const total = Object.keys(mentions).length;

  await db.collection("system_reports").add({
    type: "continuum_update",
    totalIndexed: total,
    timestamp: new Date().toISOString(),
  });

  await VaultLogger.log({
    log_type: "archivist_sweep",
    data: { totalIndexed: total },
    source: "archivist_agent",
  });

  console.log(`✅ Archivist sweep complete: ${total} entries indexed and logged to Vault.`);
}

// Auto-run if called directly
if (require.main === module) {
  archivistSweep().catch((err) => {
    console.error("Archivist sweep failed:", err);
    process.exit(1);
  });
}
