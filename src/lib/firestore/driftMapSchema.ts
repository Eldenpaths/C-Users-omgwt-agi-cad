import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
export const driftMapRef = collection(db, "drift_map");
export async function logDriftCluster(cluster) {
  return await addDoc(driftMapRef, { ...cluster, createdAt: serverTimestamp() });
}
