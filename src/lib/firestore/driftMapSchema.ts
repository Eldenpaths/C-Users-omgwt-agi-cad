import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreInstance } from "@/lib/firebase";

export function getDriftMapRef() {
  return collection(getFirestoreInstance(), "drift_map");
}

export async function logDriftCluster(cluster: any) {
  return await addDoc(getDriftMapRef(), { ...cluster, createdAt: serverTimestamp() });
}
