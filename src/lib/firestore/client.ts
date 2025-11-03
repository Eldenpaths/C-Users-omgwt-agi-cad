import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { Experiment, UserProfile, TelemetrySnapshot } from './schema';

export class FirestoreClient {

  // ============ EXPERIMENTS ============

  async saveExperiment(
    userId: string,
    experiment: Omit<Experiment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const db = getFirestoreInstance();
    const docRef = await addDoc(collection(db, 'experiments'), {
      ...experiment,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    const db = getFirestoreInstance();
    const docRef = doc(db, 'experiments', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Experiment;
  }

  async getUserExperiments(
    userId: string,
    labId?: string,
    limitCount: number = 50
  ): Promise<Experiment[]> {
    const db = getFirestoreInstance();
    let q;

    if (labId) {
      q = query(
        collection(db, 'experiments'),
        where('userId', '==', userId),
        where('labId', '==', labId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'experiments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Experiment, 'id'>;
      return {
        id: doc.id,
        ...data
      } as Experiment;
    });
  }

  async updateExperiment(
    id: string,
    updates: Partial<Experiment>
  ): Promise<void> {
    const db = getFirestoreInstance();
    const docRef = doc(db, 'experiments', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteExperiment(id: string): Promise<void> {
    const db = getFirestoreInstance();
    await deleteDoc(doc(db, 'experiments', id));
  }

  // ============ USER PROFILES ============

  async createUserProfile(
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string
  ): Promise<void> {
    const db = getFirestoreInstance();
    await addDoc(collection(db, 'users'), {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
      subscription: 'free',
      experimentsCount: 0,
      lastActive: serverTimestamp()
    });
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, 'users'),
      where('uid', '==', uid),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docData = querySnapshot.docs[0];
    const data = docData.data() as Omit<UserProfile, 'id'>;
    return {
      id: docData.id,
      ...data
    } as UserProfile;
  }

  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    const db = getFirestoreInstance();
    const profile = await this.getUserProfile(uid);
    if (!profile || !profile.id) throw new Error('User profile not found');

    const docRef = doc(db, 'users', profile.id);
    await updateDoc(docRef, {
      ...updates,
      lastActive: serverTimestamp()
    });
  }

  // ============ TELEMETRY ============

  async saveTelemetrySnapshot(
    experimentId: string,
    labId: string,
    data: any
  ): Promise<void> {
    const db = getFirestoreInstance();
    await addDoc(collection(db, 'telemetry'), {
      experimentId,
      labId,
      timestamp: serverTimestamp(),
      data
    });
  }
}

// Singleton instance
export const firestoreClient = new FirestoreClient();
