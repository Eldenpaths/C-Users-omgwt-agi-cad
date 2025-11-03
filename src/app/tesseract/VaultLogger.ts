/**
 * @file VaultLogger.ts
 * @description Logs design decisions to the Firestore Vault for real-time tracking.
 */
import { getFirestoreInstance } from "@/lib/firebase"; // Assuming firebase is configured at src/lib/firebase.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DesignDecision, DesignCategory } from "./ArchivistAgent";

interface LogPayload {
  category: DesignCategory | "DELEGATION";
  reason: string; // Renamed from title for clarity
  summary: string;
  link?: string;
  source: string;
  from?: string;
  to?: string;
  cost?: number;
}



interface PerformanceLogPayload {

  metricName: string;

  value: number;

  unit: string;

  context?: any;

}



class VaultLogger {



  private decisionsCollectionRef = collection(getFirestoreInstance(), "design_decisions");



  private performanceCollectionRef = collection(getFirestoreInstance(), "performance_logs");



  /**

   * Logs a new design decision to the Vault (Firestore).

   * @param payload The decision details to log.

   */

  public async logDecision(payload: LogPayload): Promise<string> {

    const docRef = await addDoc(this.decisionsCollectionRef, {

      ...payload,

      timestamp: serverTimestamp(), // Use server-side timestamp for accuracy

    });

    console.log("VaultLogger: Logged decision with ID:", docRef.id);

    return docRef.id;

  }



  /**

   * Logs a new performance metric to the Vault (Firestore).

   * @param payload The performance metric to log.

   */

  public async logPerformance(payload: PerformanceLogPayload): Promise<string> {

    const docRef = await addDoc(this.performanceCollectionRef, {

      ...payload,

      timestamp: serverTimestamp(),

    });

    console.log("VaultLogger: Logged performance metric with ID:", docRef.id);

    return docRef.id;

  }

  public async logHeuristicUpdate(update: { oldT: number; newT: number; oldS: number; newS: number; deltaT: number; deltaS: number; timestamp: number; metricsHash: string }): Promise<string> {
    const db = getFirestoreInstance();
    const docRef = await addDoc(collection(db, "heuristic_updates"), {
      ...update,
      timestamp: serverTimestamp(),
    });
    console.log("VaultLogger: Logged heuristic update with ID:", docRef.id);
    return docRef.id;
  }

  public async logAnomaly(anomaly: { latestLatency: number; meanLatency: number; stdDevLatency: number }): Promise<string> {
    const db = getFirestoreInstance();
    const docRef = await addDoc(collection(db, "anomaly_events"), {
      ...anomaly,
      timestamp: serverTimestamp(),
    });
    console.log("VaultLogger: Logged anomaly event with ID:", docRef.id);
    return docRef.id;
  }

}



const vaultLogger = new VaultLogger();

export default vaultLogger;
