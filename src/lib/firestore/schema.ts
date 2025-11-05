import { Timestamp } from 'firebase/firestore';

// User profiles
export interface UserProfile {
  id?: string; // Firestore document ID
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  subscription: 'free' | 'student' | 'professional' | 'institution';
  experimentsCount: number;
  lastActive: Timestamp;
}

// Experiments
export interface Experiment {
  id: string;
  userId: string;
  labId: 'plasma' | 'spectral' | 'chemistry' | 'crypto-market';
  title: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Commands executed during experiment
  commands: Array<{
    timestamp: Timestamp;
    command: string;
    params: any;
  }>;

  // Final state snapshot
  finalState: {
    temperature?: number;
    pressure?: number;
    velocity?: number;
    composition?: any;
    ionization?: number;
    [key: string]: any;
  };

  // Version control
  versionHistory?: {
    previousVersionId: string | null;
    updateTimestamp: Timestamp;
  };

  // Metadata
  tags?: string[];
  isPublic: boolean;
  status: 'draft' | 'completed' | 'archived';
}

// Telemetry snapshots (time-series data)
export interface TelemetrySnapshot {
  id: string;
  experimentId: string;
  labId: string;
  timestamp: Timestamp;
  data: any; // Lab-specific telemetry
}
