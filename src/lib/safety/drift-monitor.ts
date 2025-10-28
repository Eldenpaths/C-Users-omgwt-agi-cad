// CLAUDE-META: Phase 10D - Drift Monitor (Enhanced)
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Detect drift & entropy changes during self-modification
// Status: Production - HYBRID_SAFE Active

import type { CodeDiff } from '../meta/self-modifier';

/**
 * Drift Monitor
 * Tracks cumulative drift and entropy across code modifications
 */
export class DriftMonitor {
  private driftScore = 0;
  private entropy = 0;
  private baselineHash: string = '';
  private modificationHistory: Array<{
    timestamp: number;
    drift: number;
    entropy: number;
    filePath: string;
  }> = [];

  // Drift thresholds
  private readonly DRIFT_THRESHOLD = 0.1;
  private readonly ENTROPY_THRESHOLD = 0.5;
  private readonly DECAY_RATE = 0.95; // Drift decays over time

  /**
   * Calculate drift based on code change
   */
  calculateDrift(diff: CodeDiff): number {
    // Calculate character-level diff
    const oldLen = diff.oldContent.length;
    const newLen = diff.newContent.length;

    // Levenshtein-inspired: size change + content similarity
    const sizeDiff = Math.abs(newLen - oldLen);
    const maxLen = Math.max(oldLen, newLen);
    const sizeRatio = maxLen > 0 ? sizeDiff / maxLen : 0;

    // Calculate content similarity (simple character overlap)
    const similarity = this.calculateSimilarity(diff.oldContent, diff.newContent);
    const contentDrift = 1 - similarity;

    // Combined drift score
    const localDrift = (sizeRatio * 0.3) + (contentDrift * 0.7);

    // Update cumulative drift with decay
    this.driftScore = (this.driftScore * this.DECAY_RATE) + localDrift;

    // Cap at 1.0
    this.driftScore = Math.min(this.driftScore, 1.0);

    // Record in history
    this.modificationHistory.push({
      timestamp: Date.now(),
      drift: localDrift,
      entropy: this.entropy,
      filePath: diff.filePath,
    });

    return localDrift;
  }

  /**
   * Calculate entropy of code change
   */
  calculateEntropy(code: string): number {
    if (code.length === 0) return 0;

    const freq = new Map<string, number>();

    // Count character frequencies
    for (const char of code) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    // Calculate Shannon entropy
    let entropy = 0;
    const len = code.length;

    for (const count of freq.values()) {
      const p = count / len;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    // Normalize to 0-1 range (max entropy for ASCII is ~6.6 bits)
    const normalizedEntropy = Math.min(entropy / 6.6, 1.0);

    // Update cumulative entropy
    this.entropy = (this.entropy * this.DECAY_RATE) + (normalizedEntropy * (1 - this.DECAY_RATE));

    return normalizedEntropy;
  }

  /**
   * Assess drift for a modification
   */
  assessModification(diff: CodeDiff): {
    driftScore: number;
    entropyScore: number;
    driftDetected: boolean;
    entropyExceeded: boolean;
  } {
    const localDrift = this.calculateDrift(diff);
    const entropyScore = this.calculateEntropy(diff.newContent);

    return {
      driftScore: this.driftScore,
      entropyScore,
      driftDetected: this.driftScore > this.DRIFT_THRESHOLD,
      entropyExceeded: entropyScore > this.ENTROPY_THRESHOLD,
    };
  }

  /**
   * Calculate similarity between two strings (0 = completely different, 1 = identical)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 && str2.length === 0) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Simple character set overlap (fast approximation)
    const set1 = new Set(str1);
    const set2 = new Set(str2);

    let intersection = 0;
    for (const char of set1) {
      if (set2.has(char)) intersection++;
    }

    const union = set1.size + set2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Get current drift statistics
   */
  getStats() {
    return {
      driftScore: this.driftScore,
      entropy: this.entropy,
      totalModifications: this.modificationHistory.length,
      driftExceeded: this.driftScore > this.DRIFT_THRESHOLD,
      entropyExceeded: this.entropy > this.ENTROPY_THRESHOLD,
      recentHistory: this.modificationHistory.slice(-10),
    };
  }

  /**
   * Reset drift monitor
   */
  reset() {
    this.driftScore = 0;
    this.entropy = 0;
    this.modificationHistory = [];
  }

  /**
   * Legacy: Watch for drift over time
   */
  async watchForDrift(durationSec: number = 60) {
    const start = Date.now();
    while (Date.now() - start < durationSec * 1000) {
      await new Promise(r => setTimeout(r, 500));
      // Apply decay over time
      this.driftScore *= this.DECAY_RATE;
      this.entropy *= this.DECAY_RATE;
    }
    return {
      driftDetected: this.driftScore > this.DRIFT_THRESHOLD,
      driftScore: this.driftScore
    };
  }
}
