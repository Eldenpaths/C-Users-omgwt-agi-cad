// agents/Archivist.js
import { addDoc, collection, getDocs, orderBy, query, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../src/lib/firebase.js";
import { QueueService } from "../src/features/mission/QueueService.js";

export class Archivist {
  constructor() {
    this.agentId = "archivist";
    this._running = false;
  }

  start() {
    this._running = true;
    console.log(`[Archivist] online`);
    this._loop();
  }

  stop() {
    this._running = false;
    console.log(`[Archivist] stopped`);
  }

  async _loop() {
    await QueueService.registerAgent(this.agentId, {
      title: "Archivist",
      version: "1.0.0",
      role: "Knowledge Miner / Indexer",
    });

    while (this._running) {
      const mission = await QueueService.claimNextMission(
        this.agentId,
        ["archive.mine", "archive.addText"]
      );
      if (!mission) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      try {
        const result = await this.performTask(mission);
        await QueueService.completeMission(mission.id, result, "completed");
        await QueueService.log(this.agentId, "success", "Archive update complete", { result });
      } catch (err) {
        await QueueService.completeMission(mission.id, { error: String(err) }, "failed");
        await QueueService.log(this.agentId, "error", "Archivist failure", { err: String(err) });
      }
    }
  }

  async performTask(mission) {
    const { kind, params = {} } = mission;
    if (kind === "archive.addText") {
      const { path, content, tags = [] } = params;
      const checksum = this._hash(content);
      const payload = {
        path,
        tags,
        bytes: content.length,
        checksum,
        summary: this._summarize(content),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "vaultKnowledge"), payload);
      return { ok: true, id: ref.id };
    }

    if (kind === "archive.mine") {
      const { collections = ["missions", "agentLogs"], sample = 25 } = params;
      let count = 0;
      for (const col of collections) {
        const q = query(collection(db, col), orderBy("createdAt", "desc"), limit(sample));
        const snap = await getDocs(q).catch(() => null);
        if (!snap) continue;
        for (const d of snap.docs) {
          const data = d.data();
          const ref = await addDoc(collection(db, "vaultKnowledge"), {
            path: `${col}/${d.id}`,
            summary: this._summarize(JSON.stringify(data)),
            tags: [col],
            createdAt: serverTimestamp(),
          });
          count++;
        }
      }
      return { ok: true, indexed: count };
    }

    throw new Error(`Unknown mission kind: ${kind}`);
  }

  _summarize(text, max = 400) {
    if (!text) return "";
    const clean = text.replace(/\\s+/g, " ").trim();
    return clean.length <= max ? clean : clean.slice(0, max - 3) + "...";
  }

  _hash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }
}
