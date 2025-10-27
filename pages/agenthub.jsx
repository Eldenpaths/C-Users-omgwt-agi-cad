"use client";

import { useEffect } from "react";
import AgentConsole from "../src/components/Agenthud.jsx";
import RecallConsole from "../src/components/RecallConsole.jsx";
import { ForgeBuilder } from "../agents/ForgeBuilder.js";
import { Archivist } from "../agents/Archivist.js";
import { QueueService } from "../src/features/mission/QueueService";

/**
 * AGI-CAD Phase 7 — AgentHub
 * Integrates ForgeBuilder + Archivist with Firestore mission queue + heartbeat.
 */
export default function AgentHub() {
  useEffect(() => {
    const fb = new ForgeBuilder();
    const ar = new Archivist();

    fb.start();
    ar.start();

    const agentId = "forge-builder";

    // ---- Phase 7: Heartbeat + Mission Claim Loop ----
    const tick = async () => {
      try {
        // 1️⃣ Heartbeat ping
        await QueueService.heartbeat(agentId, { status: "active" });
        console.log(`[${agentId}] heartbeat sent`);

        // 2️⃣ Attempt to claim the next queued mission
        const mission = await QueueService.claimNextMission(agentId, ["forge.scaffold"]);
        if (mission) {
          console.log(`[${agentId}] claimed mission:`, mission.kind, mission.id);

          // 3️⃣ Simulate short execution delay
          await new Promise((r) => setTimeout(r, 2000));

          // 4️⃣ Complete mission + mark result
          await QueueService.completeMission(mission.id, { ok: true });
          console.log(`[${agentId}] completed mission:`, mission.id);
        } else {
          console.log(`[${agentId}] idle — no missions available`);
        }
      } catch (err) {
        console.error(`[${agentId}] loop error:`, err);
      }
    };

    // Run tick immediately and then every 5 s
    tick();
    const interval = setInterval(tick, 5000);

    // Cleanup when leaving page
    return () => {
      clearInterval(interval);
      fb.stop();
      ar.stop();
    };
  }, []);

  return (
    <main className="p-4 grid gap-6 lg:grid-cols-2">
      <section className="border rounded">
        <h2 className="p-3 font-semibold">Mission Control</h2>
        <AgentConsole />
      </section>

      <section className="border rounded">
        <h2 className="p-3 font-semibold">Recall Console</h2>
        <RecallConsole />
      </section>
    </main>
  );
}
