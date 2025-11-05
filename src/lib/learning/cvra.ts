/**
 * CVRA: CANON VALIDATED REASONING ADJUSTMENTS
 *
 * Self-modification loop that analyzes VAULT patterns to update Canon.
 * This is THE KEY to actual emergence - the system learns from itself.
 *
 * Philosophy:
 * - Canon is not static rules, it's learned behavior
 * - Anomalies (1.5σ from mean) trigger deeper analysis
 * - Pinecone finds similar past experiments
 * - System proposes Canon deviations based on evidence
 * - Human reviews and approves changes
 *
 * Phase 19A: Foundation implementation
 * Phase 19B: UI and approval workflow
 * Phase 20: Autonomous canon updates (with safety)
 */

import { getDbInstance } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { generateEmbedding, findSimilar } from '@/lib/embeddings';
import { logAgentAction } from '../logging/agent-tracer';

// ============================================================
// TYPES
// ============================================================

/**
 * Statistical anomaly detected in experiment results
 */
export interface Anomaly {
  id: string;
  experimentId: string;
  labId: string;
  metricName: string;
  value: number;
  expectedValue: number;
  standardDeviation: number;
  sigmaDistance: number; // How many σ from mean
  timestamp: Date;

  // Context
  similarExperiments: string[]; // IDs of similar past experiments
  patternMatch: {
    matchCount: number;
    confidence: number;
    commonTags: string[];
  };
}

/**
 * Suggested change to Canon based on CVRA analysis
 */
export interface CanonDeviation {
  id: string;
  title: string;
  description: string;

  // Evidence
  anomalies: Anomaly[];
  supportingExperiments: string[];
  confidence: number; // 0-1

  // Proposed change
  canonArea: string; // Which part of canon to modify
  currentRule: string;
  proposedRule: string;
  rationale: string;

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  implementedAt?: Date;

  // Metadata
  vaultReferences: string[]; // Experiment IDs
  pineconeMatches: Array<{
    id: string;
    score: number;
    metadata: any;
  }>;
}

/**
 * CVRA analysis result
 */
export interface CVRAAnalysis {
  experimentId: string;
  anomaliesDetected: Anomaly[];
  deviationSuggestions: CanonDeviation[];
  timestamp: Date;

  // Summary statistics
  totalMetricsAnalyzed: number;
  anomalyRate: number;
  confidenceScore: number;
}

// ============================================================
// ANOMALY DETECTION
// ============================================================

/**
 * Calculate mean and standard deviation for a metric across experiments
 */
export async function calculateMetricStatistics(
  labId: string,
  metricName: string
): Promise<{
  mean: number;
  stdDev: number;
  count: number;
  values: number[];
}> {
  try {
    // Query all experiments for this lab from VAULT
    const vaultQuery = query(
      collection(getDbInstance(), 'vault_entries'),
      where('labId', '==', labId),
      orderBy('timestamp', 'desc'),
      limit(100) // Last 100 experiments
    );

    const snapshot = await getDocs(vaultQuery);
    const values: number[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Try to extract metric from various possible locations
      const metricValue =
        data.results?.metrics?.[metricName] ||
        data.data?.metrics?.[metricName] ||
        data.metrics?.[metricName];

      if (typeof metricValue === 'number' && !isNaN(metricValue)) {
        values.push(metricValue);
      }
    });

    if (values.length === 0) {
      return { mean: 0, stdDev: 0, count: 0, values: [] };
    }

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, count: values.length, values };
  } catch (error) {
    console.error('[CVRA] Failed to calculate statistics:', error);
    return { mean: 0, stdDev: 0, count: 0, values: [] };
  }
}

/**
 * Detect anomalies in an experiment using 1.5σ threshold
 */
export async function detectAnomalies(
  experimentId: string,
  labId: string,
  metrics: Record<string, number>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const SIGMA_THRESHOLD = 1.5; // 1.5 standard deviations

  for (const [metricName, value] of Object.entries(metrics)) {
    try {
      // Get historical statistics for this metric
      const stats = await calculateMetricStatistics(labId, metricName);

      if (stats.count < 5) {
        // Need at least 5 data points for meaningful statistics
        continue;
      }

      // Calculate how many σ away from mean
      const sigmaDistance = stats.stdDev > 0
        ? Math.abs(value - stats.mean) / stats.stdDev
        : 0;

      // Check if anomaly
      if (sigmaDistance >= SIGMA_THRESHOLD) {
        // Find similar experiments for context
        const similarExperiments = await findSimilarExperiments(experimentId, labId, 5);

        anomalies.push({
          id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          experimentId,
          labId,
          metricName,
          value,
          expectedValue: stats.mean,
          standardDeviation: stats.stdDev,
          sigmaDistance,
          timestamp: new Date(),
          similarExperiments: similarExperiments.map((e) => e.id),
          patternMatch: {
            matchCount: similarExperiments.length,
            confidence: Math.min(sigmaDistance / 3, 1), // Normalize to 0-1
            commonTags: [], // Would be populated from similar experiments
          },
        });

        console.log(`[CVRA] Anomaly detected: ${metricName} = ${value} (${sigmaDistance.toFixed(2)}σ from ${stats.mean.toFixed(2)})`);
      }
    } catch (error) {
      console.error(`[CVRA] Error detecting anomaly for ${metricName}:`, error);
    }
  }

  return anomalies;
}

// ============================================================
// PATTERN MATCHING WITH PINECONE
// ============================================================

/**
 * Find similar experiments using Pinecone vector search
 */
export async function findSimilarExperiments(
  experimentId: string,
  labId: string,
  topK: number = 10
): Promise<Array<{
  id: string;
  score: number;
  metadata: any;
}>> {
  try {
    // Get the experiment data to create embedding
    const experimentDoc = await getDocs(
      query(collection(getDbInstance(), 'vault_entries'), where('id', '==', experimentId), limit(1))
    );

    if (experimentDoc.empty) {
      console.warn(`[CVRA] Experiment ${experimentId} not found`);
      return [];
    }

    const experimentData = experimentDoc.docs[0].data();

    // Create text representation for embedding
    const experimentText = JSON.stringify({
      labId: experimentData.labId,
      title: experimentData.title,
      description: experimentData.description,
      tags: experimentData.tags,
      results: experimentData.results,
    });

    // Get embedding from OpenAI
    const embedding = await generateEmbedding(experimentText);

    // Query Pinecone for similar experiments
    const matches = await findSimilar(embedding, topK + 1, {
      labId, // Filter by same lab
    });

    // Filter out the query experiment itself
    return matches
      .filter((m) => m.id !== experimentId)
      .slice(0, topK);
  } catch (error) {
    console.error('[CVRA] Failed to find similar experiments:', error);
    return [];
  }
}

/**
 * Analyze patterns across similar experiments
 */
export async function analyzePatterns(
  similarExperiments: Array<{ id: string; score: number; metadata: any }>
): Promise<{
  commonTags: string[];
  avgConfidence: number;
  insights: string[];
}> {
  try {
    const allTags: string[] = [];
    let totalConfidence = 0;
    const insights: string[] = [];

    for (const exp of similarExperiments) {
      // Extract tags from metadata
      if (exp.metadata?.tags && Array.isArray(exp.metadata.tags)) {
        allTags.push(...exp.metadata.tags);
      }

      totalConfidence += exp.score;
    }

    // Find most common tags
    const tagFrequency: Record<string, number> = {};
    allTags.forEach((tag) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    const commonTags = Object.entries(tagFrequency)
      .filter(([_, count]) => count >= similarExperiments.length * 0.5)
      .map(([tag]) => tag);

    const avgConfidence = similarExperiments.length > 0
      ? totalConfidence / similarExperiments.length
      : 0;

    // Generate insights
    if (commonTags.length > 0) {
      insights.push(`Common themes: ${commonTags.join(', ')}`);
    }
    if (avgConfidence > 0.8) {
      insights.push('High similarity to historical experiments');
    }

    return { commonTags, avgConfidence, insights };
  } catch (error) {
    console.error('[CVRA] Failed to analyze patterns:', error);
    return { commonTags: [], avgConfidence: 0, insights: [] };
  }
}

// ============================================================
// CANON DEVIATION PROPOSALS
// ============================================================

/**
 * Generate canon deviation suggestion based on anomalies
 */
export async function proposeCanonDeviation(
  anomalies: Anomaly[],
  experimentId: string
): Promise<CanonDeviation | null> {
  if (anomalies.length === 0) {
    return null;
  }

  try {
    // Group anomalies by metric
    const metricGroups: Record<string, Anomaly[]> = {};
    anomalies.forEach((a) => {
      if (!metricGroups[a.metricName]) {
        metricGroups[a.metricName] = [];
      }
      metricGroups[a.metricName].push(a);
    });

    // Find the most significant anomaly group
    const mostSignificantMetric = Object.entries(metricGroups)
      .sort((a, b) => b[1][0].sigmaDistance - a[1][0].sigmaDistance)[0];

    const [metricName, metricAnomalies] = mostSignificantMetric;
    const primaryAnomaly = metricAnomalies[0];

    // Find all similar experiments
    const similarExperiments = await findSimilarExperiments(
      experimentId,
      primaryAnomaly.labId,
      20
    );

    // Analyze patterns
    const patterns = await analyzePatterns(similarExperiments);

    // Calculate confidence based on evidence
    const confidence = Math.min(
      (primaryAnomaly.sigmaDistance / 3) * 0.4 + // Anomaly strength (40%)
      patterns.avgConfidence * 0.4 +              // Pattern match (40%)
      (similarExperiments.length / 20) * 0.2,     // Evidence count (20%)
      1.0
    );

    // Generate deviation proposal
    const deviation: CanonDeviation = {
      id: `deviation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Unusual ${metricName} in ${primaryAnomaly.labId}`,
      description: `Detected ${primaryAnomaly.sigmaDistance.toFixed(2)}σ deviation in ${metricName}. Value: ${primaryAnomaly.value.toFixed(2)}, Expected: ${primaryAnomaly.expectedValue.toFixed(2)}`,

      anomalies: metricAnomalies,
      supportingExperiments: similarExperiments.map((e) => e.id),
      confidence,

      canonArea: `labs.${primaryAnomaly.labId}.metrics.${metricName}`,
      currentRule: `Expected range: ${(primaryAnomaly.expectedValue - primaryAnomaly.standardDeviation).toFixed(2)} - ${(primaryAnomaly.expectedValue + primaryAnomaly.standardDeviation).toFixed(2)}`,
      proposedRule: `Consider expanding range to include ${primaryAnomaly.value.toFixed(2)} or investigate underlying cause`,
      rationale: `Multiple experiments show similar patterns (${patterns.insights.join(', ')}). Confidence: ${(confidence * 100).toFixed(1)}%`,

      status: 'pending',
      createdAt: new Date(),

      vaultReferences: [experimentId, ...similarExperiments.map((e) => e.id)],
      pineconeMatches: similarExperiments,
    };

    return deviation;
  } catch (error) {
    console.error('[CVRA] Failed to propose canon deviation:', error);
    return null;
  }
}

/**
 * Save canon deviation to Firestore
 */
export async function saveCanonDeviation(deviation: CanonDeviation): Promise<string> {
  try {
    const docRef = await addDoc(collection(getDbInstance(), 'cvra-suggestions'), {
      ...deviation,
      createdAt: deviation.createdAt.toISOString(),
      reviewedAt: deviation.reviewedAt?.toISOString(),
      implementedAt: deviation.implementedAt?.toISOString(),
    });

    console.log(`[CVRA] Canon deviation saved: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[CVRA] Failed to save deviation:', error);
    throw error;
  }
}

// ============================================================
// MAIN CVRA ANALYSIS
// ============================================================

/**
 * Run complete CVRA analysis on an experiment
 */
export async function analyzExperiment(
  experimentId: string,
  labId: string,
  metrics: Record<string, number>
): Promise<CVRAAnalysis> {
  const startTime = Date.now();

  console.log(`[CVRA] Analyzing experiment ${experimentId}...`);

  try {
    // 1. Detect anomalies
    const anomalies = await detectAnomalies(experimentId, labId, metrics);

    console.log(`[CVRA] Found ${anomalies.length} anomalies`);

    // 2. Propose canon deviations
    const deviationSuggestions: CanonDeviation[] = [];

    if (anomalies.length > 0) {
      const deviation = await proposeCanonDeviation(anomalies, experimentId);

      if (deviation) {
        // Save to Firestore (don't show in UI yet, Phase 19B)
        await saveCanonDeviation(deviation);
        deviationSuggestions.push(deviation);

        console.log(`[CVRA] Proposed deviation with ${(deviation.confidence * 100).toFixed(1)}% confidence`);
      }
    }

    // 3. Create analysis result
    const analysis: CVRAAnalysis = {
      experimentId,
      anomaliesDetected: anomalies,
      deviationSuggestions,
      timestamp: new Date(),
      totalMetricsAnalyzed: Object.keys(metrics).length,
      anomalyRate: anomalies.length / Object.keys(metrics).length,
      confidenceScore: deviationSuggestions.length > 0
        ? deviationSuggestions[0].confidence
        : 0,
    };

    // 4. Log to agent tracer
    await logAgentAction({
      agentId: 'cvra-system',
      agentType: 'learning',
      action: 'analyze_experiment',
      input: { experimentId, labId, metricsCount: Object.keys(metrics).length },
      output: {
        anomalies: anomalies.length,
        deviations: deviationSuggestions.length,
        confidence: analysis.confidenceScore,
      },
      timestamp: new Date(),
      duration: Date.now() - startTime,
      confidence: analysis.confidenceScore,
      errors: [],
      warnings: [],
      metadata: {
        labId,
        experimentId,
      },
    });

    console.log(`[CVRA] Analysis complete in ${Date.now() - startTime}ms`);

    return analysis;
  } catch (error) {
    console.error('[CVRA] Analysis failed:', error);

    // Log error
    await logAgentAction({
      agentId: 'cvra-system',
      agentType: 'learning',
      action: 'analyze_experiment',
      input: { experimentId, labId },
      output: null,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      confidence: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      metadata: {
        labId,
        experimentId,
      },
    });

    // Return empty analysis on error
    return {
      experimentId,
      anomaliesDetected: [],
      deviationSuggestions: [],
      timestamp: new Date(),
      totalMetricsAnalyzed: Object.keys(metrics).length,
      anomalyRate: 0,
      confidenceScore: 0,
    };
  }
}

/**
 * Query all pending canon deviations
 */
export async function getPendingDeviations(): Promise<CanonDeviation[]> {
  try {
    const q = query(
      collection(getDbInstance(), 'cvra-suggestions'),
      where('status', '==', 'pending'),
      orderBy('confidence', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      reviewedAt: doc.data().reviewedAt ? new Date(doc.data().reviewedAt) : undefined,
      implementedAt: doc.data().implementedAt ? new Date(doc.data().implementedAt) : undefined,
    })) as CanonDeviation[];
  } catch (error) {
    console.error('[CVRA] Failed to query deviations:', error);
    return [];
  }
}

/**
 * Example usage:
 *
 * // After saving an experiment to VAULT
 * const analysis = await analyzExperiment(
 *   'experiment_123',
 *   'chemistry',
 *   {
 *     molecularWeight: 180.2,
 *     bondEnergy: 450.5,
 *     reactionTime: 120
 *   }
 * );
 *
 * if (analysis.anomaliesDetected.length > 0) {
 *   console.log('Anomalies found:', analysis.anomaliesDetected);
 * }
 *
 * if (analysis.deviationSuggestions.length > 0) {
 *   console.log('Canon update suggested:', analysis.deviationSuggestions[0]);
 * }
 */
