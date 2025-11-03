import * as functions from "firebase-functions";
import { archivistSweep } from "../src/agents/archivistAgent";

// 🕒 Run Archivist every 24 hours (or adjust cron)
export const archivistSweepJob = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    await archivistSweep();
    console.log("✅ ArchivistSweepJob executed successfully");
    return null;
  });
