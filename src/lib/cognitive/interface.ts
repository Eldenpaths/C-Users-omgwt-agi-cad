import type { LabType } from '@/lib/learning/validator';
import type { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Minimal learning session shape used by CVRA.
 */
export interface LearningSessionLite {
  id: string;
  userId: string;
  agentId?: string;
  labType: LabType | string;
  // Human-readable summary
  summary?: string;
  // Canonical metrics captured by LearningCore
  metrics?: {
    success: boolean;
    runtimeMs?: number;
    errorCount?: number;
  };
  // Original lab data (lab-specific shape)
  data?: Record<string, unknown>;
  createdAt?: Timestamp | FieldValue;
}

/**
 * Numeric metric snapshot and z-score output.
 */
export interface MetricAnomaly {
  metric: string;
  value: number;
  mean: number;
  stdDev: number;
  z: number;
  direction: 'high' | 'low';
}

/**
 * Structured CANON deviation suggestion
 */
export interface CanonDeviation {
  targetLab: string;
  suggestedChange: Array<{
    key: string;
    op: 'increase' | 'decrease';
    magnitude: number;
  }>;
  rationale: string;
}

/**
 * A proposed deviation from CANON based on anomalous success.
 */
export interface CVRASuggestion {
  id?: string;
  userId: string;
  agentId?: string;
  labType: LabType | string;
  sessionId: string;
  reason: string;
  anomalies: MetricAnomaly[];
  proposedCanonDeviation: CanonDeviation;
  createdAt?: Timestamp | FieldValue;
}

/**
 * Result of running CVRA over a dataset.
 */
export interface CVRAResult {
  userId: string;
  analyzedCount: number;
  suggestionsCreated: number;
  notes?: string[];
}

