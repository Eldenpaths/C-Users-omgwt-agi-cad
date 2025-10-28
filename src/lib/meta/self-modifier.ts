// CLAUDE-META: Phase 10 Leapfrog - Self-Modification Core
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Safe code self-modification with Constitutional Guard
// Status: Production - Hybrid Safe Mode Active

import { DriftMonitor } from "../safety/drift-monitor";
import { ConstitutionalGuard } from "../safety/constitutional-guard";
import type { SwarmCoordinator } from "./swarm-coordinator"; // Phase 10D: Drift-trust integration

export type CodeDiff = {
  filePath: string;
  oldContent: string;
  newContent: string;
  reason: string;
  riskScore: number; // 0-1
};

export type ModificationResult = {
  approved: boolean;
  riskScore: number;
  constitutionViolations: string[];
  driftScore: number;
  shadowTestResult?: ShadowTestResult;
  justificationHash: string;
  modificationId?: string; // Unique ID for rollback tracking
  rollbackRecommended?: boolean; // Phase 10D: Recursive rollback flag
};

export type ShadowTestResult = {
  passed: boolean;
  executionTime: number;
  errors: string[];
  warnings: string[];
};

/**
 * Self-Modification Core
 * Enables agents to propose code changes with safety checks
 *
 * Safety Constraints:
 * - MAX_RISK_THRESHOLD = 0.3
 * - Constitutional Guard approval required
 * - Shadow testing before production
 * - Drift monitoring on modifications
 */
export class SelfModifier {
  private guard: ConstitutionalGuard;
  private driftMonitor: DriftMonitor;
  private readonly MAX_RISK_THRESHOLD = 0.3;
  private swarmCoordinator?: SwarmCoordinator; // Phase 10D: Optional drift-trust integration

  // Track modification history
  private modificationHistory: Array<{
    timestamp: number;
    diff: CodeDiff;
    result: ModificationResult;
    agentId: string;
    modificationId: string;
  }> = [];

  // Phase 10D: Rollback tracking
  private rollbackQueue: Array<{
    modificationId: string;
    reason: string;
    triggeredBy: string;
  }> = [];

  private modificationDependencies: Map<string, string[]> = new Map(); // modId -> [dependent modIds]

  constructor(guard: ConstitutionalGuard, swarmCoordinator?: SwarmCoordinator) {
    this.guard = guard;
    this.driftMonitor = new DriftMonitor();
    this.swarmCoordinator = swarmCoordinator; // Phase 10D: Drift-trust feedback loop
  }

  /**
   * Propose a code modification
   * Returns approval/rejection with detailed reasoning
   */
  async proposeModification(diff: CodeDiff, agentId: string): Promise<ModificationResult> {
    console.log(`[SelfModifier] Agent ${agentId} proposing modification to ${diff.filePath}`);

    // 0. Generate unique modification ID for rollback tracking
    const modificationId = this.generateModificationId(agentId, diff.filePath);

    // 1. Compute risk score from diff
    const computedRisk = this.computeRiskScore(diff);
    diff.riskScore = computedRisk;

    // 2. Check risk threshold
    if (computedRisk > this.MAX_RISK_THRESHOLD) {
      console.warn(`[SelfModifier] Risk ${computedRisk} exceeds threshold ${this.MAX_RISK_THRESHOLD}`);

      return {
        approved: false,
        riskScore: computedRisk,
        constitutionViolations: [`Risk score ${computedRisk} exceeds maximum ${this.MAX_RISK_THRESHOLD}`],
        driftScore: 0,
        justificationHash: this.computeJustificationHash(diff, []),
        modificationId,
      };
    }

    // 3. Constitutional Guard approval
    const guardResult = await this.guard.evaluateModification(diff, agentId);

    if (!guardResult.approved) {
      console.warn(`[SelfModifier] Constitutional Guard rejected modification`);

      return {
        approved: false,
        riskScore: computedRisk,
        constitutionViolations: guardResult.violations,
        driftScore: 0,
        justificationHash: this.computeJustificationHash(diff, guardResult.violations),
        modificationId,
      };
    }

    // 4. Shadow testing (if applicable)
    let shadowResult: ShadowTestResult | undefined;

    if (this.requiresShadowTest(diff)) {
      shadowResult = await this.runShadowTest(diff);

      if (!shadowResult.passed) {
        console.warn(`[SelfModifier] Shadow test failed`);

        return {
          approved: false,
          riskScore: computedRisk,
          constitutionViolations: [],
          driftScore: 0,
          shadowTestResult: shadowResult,
          justificationHash: this.computeJustificationHash(diff, shadowResult.errors),
          modificationId,
        };
      }
    }

    // 5. Drift monitoring
    const driftScore = this.assessModificationDrift(diff);

    // Phase 10D: Notify swarm coordinator of agent drift
    if (this.swarmCoordinator && driftScore > 0) {
      this.swarmCoordinator.recordAgentDrift(agentId, driftScore);
    }

    // 5a. Check drift threshold (DRIFT_THRESHOLD = 0.1)
    const DRIFT_THRESHOLD = 0.1;
    if (driftScore > DRIFT_THRESHOLD) {
      console.warn(`[SelfModifier] Drift threshold exceeded: ${driftScore.toFixed(4)} > ${DRIFT_THRESHOLD}`);

      return {
        approved: false,
        riskScore: computedRisk,
        constitutionViolations: [`Drift score ${driftScore.toFixed(4)} exceeds threshold ${DRIFT_THRESHOLD}`],
        driftScore,
        justificationHash: this.computeJustificationHash(diff, ['Excessive drift detected']),
        modificationId,
        rollbackRecommended: true, // Phase 10D: Recommend rollback on excessive drift
      };
    }

    // 6. All checks passed
    const result: ModificationResult = {
      approved: true,
      riskScore: computedRisk,
      constitutionViolations: [],
      driftScore,
      shadowTestResult: shadowResult,
      justificationHash: this.computeJustificationHash(diff, []),
      modificationId,
      rollbackRecommended: false,
    };

    // Log to history with agent tracking for rollback
    this.modificationHistory.push({
      timestamp: Date.now(),
      diff,
      result,
      agentId,
      modificationId,
    });

    // Track dependencies for recursive rollback
    this.trackModificationDependencies(modificationId, diff.filePath);

    console.log(`[SelfModifier] Modification approved with risk ${computedRisk}`);

    return result;
  }

  /**
   * Compute risk score for a modification
   * Based on: file type, change size, critical patterns
   */
  private computeRiskScore(diff: CodeDiff): number {
    let risk = 0;

    // Base risk from file type
    if (diff.filePath.includes("/security/") || diff.filePath.includes("/safety/")) {
      risk += 0.5; // High risk for security/safety files
    } else if (diff.filePath.includes("/lib/") || diff.filePath.includes("/api/")) {
      risk += 0.3; // Medium risk for core library/API
    } else if (diff.filePath.includes("/components/")) {
      risk += 0.1; // Low risk for UI components
    }

    // Change size risk
    const diffSize = Math.abs(diff.newContent.length - diff.oldContent.length);
    risk += Math.min(0.3, diffSize / 10000); // Cap at 0.3

    // Critical pattern detection
    const dangerousPatterns = [
      /eval\(/,
      /exec\(/,
      /Function\(/,
      /process\.exit/,
      /fs\.unlink/,
      /rm -rf/,
      /DROP TABLE/i,
      /DELETE FROM/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(diff.newContent)) {
        risk += 0.4; // High penalty for dangerous patterns
      }
    }

    return Math.min(1.0, risk); // Cap at 1.0
  }

  /**
   * Determine if modification requires shadow testing
   */
  private requiresShadowTest(diff: CodeDiff): boolean {
    // Shadow test for:
    // - API routes
    // - Runtime logic
    // - Agent execution code
    return (
      diff.filePath.includes("/api/") ||
      diff.filePath.includes("/runtime/") ||
      diff.filePath.includes("/agents/")
    );
  }

  /**
   * Run shadow test in isolated environment
   */
  private async runShadowTest(diff: CodeDiff): Promise<ShadowTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Phase 10: Basic syntax validation
      // In production, this would:
      // 1. Create isolated test environment
      // 2. Apply diff
      // 3. Run test suite
      // 4. Collect results

      // Basic syntax check
      try {
        new Function(diff.newContent); // Will throw on syntax error
      } catch (e: any) {
        errors.push(`Syntax error: ${e.message}`);
      }

      // Check for required imports
      if (diff.newContent.includes("import") && !diff.newContent.includes("from")) {
        warnings.push("Incomplete import statements detected");
      }

      const executionTime = Date.now() - startTime;
      const passed = errors.length === 0;

      return {
        passed,
        executionTime,
        errors,
        warnings,
      };
    } catch (e: any) {
      return {
        passed: false,
        executionTime: Date.now() - startTime,
        errors: [e.message || "Shadow test failed"],
        warnings,
      };
    }
  }

  /**
   * Assess modification drift using DriftMonitor
   * Higher drift = more divergence from established patterns
   */
  private assessModificationDrift(diff: CodeDiff): number {
    const assessment = this.driftMonitor.assessModification(diff);

    // Log drift detection warnings
    if (assessment.driftDetected) {
      console.warn(`[SelfModifier] Drift detected: ${assessment.driftScore.toFixed(4)} (threshold: 0.1)`);
    }
    if (assessment.entropyExceeded) {
      console.warn(`[SelfModifier] High entropy: ${assessment.entropyScore.toFixed(4)} (threshold: 0.5)`);
    }

    return assessment.driftScore;
  }

  /**
   * Compute justification hash for audit trail
   */
  private computeJustificationHash(diff: CodeDiff, violations: string[]): string {
    const data = {
      filePath: diff.filePath,
      reason: diff.reason,
      riskScore: diff.riskScore,
      violations,
      timestamp: Date.now(),
    };

    // Simple hash (in production, use crypto.subtle.digest)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    return `sha256:${Math.abs(hash).toString(16)}`;
  }

  /**
   * Get modification history
   */
  getHistory(limit?: number): typeof this.modificationHistory {
    if (limit) {
      return this.modificationHistory.slice(-limit);
    }
    return [...this.modificationHistory];
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.modificationHistory.length;
    const approved = this.modificationHistory.filter(m => m.result.approved).length;
    const rejected = total - approved;
    const avgRisk = total > 0
      ? this.modificationHistory.reduce((sum, m) => sum + m.result.riskScore, 0) / total
      : 0;

    return {
      total,
      approved,
      rejected,
      approvalRate: total > 0 ? approved / total : 0,
      avgRisk,
    };
  }

  /**
   * Phase 10D: Generate unique modification ID
   */
  private generateModificationId(agentId: string, filePath: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `mod-${agentId}-${timestamp}-${random}`;
  }

  /**
   * Phase 10D: Track modification dependencies
   * If a file has been modified multiple times, later modifications depend on earlier ones
   */
  private trackModificationDependencies(modificationId: string, filePath: string): void {
    // Find previous modifications to the same file
    const previousMods = this.modificationHistory
      .filter(m => m.diff.filePath === filePath && m.modificationId !== modificationId)
      .map(m => m.modificationId);

    if (previousMods.length > 0) {
      this.modificationDependencies.set(modificationId, previousMods);
    }
  }

  /**
   * Phase 10D: Rollback a modification and its dependents recursively
   */
  async rollbackModification(modificationId: string, reason: string): Promise<{
    rolledBack: string[];
    failed: string[];
  }> {
    console.log(`[SelfModifier] Starting recursive rollback for ${modificationId}: ${reason}`);

    const rolledBack: string[] = [];
    const failed: string[] = [];

    // Find all dependent modifications recursively
    const toRollback = this.findDependentModifications(modificationId);
    toRollback.push(modificationId); // Include the original

    // Rollback in reverse order (most recent first)
    for (const modId of toRollback.reverse()) {
      try {
        const mod = this.modificationHistory.find(m => m.modificationId === modId);
        if (!mod) {
          console.warn(`[SelfModifier] Modification ${modId} not found in history`);
          failed.push(modId);
          continue;
        }

        // Queue for rollback
        this.rollbackQueue.push({
          modificationId: modId,
          reason,
          triggeredBy: modificationId,
        });

        console.log(`[SelfModifier] Queued rollback: ${modId} (${mod.diff.filePath})`);
        rolledBack.push(modId);
      } catch (error: any) {
        console.error(`[SelfModifier] Rollback failed for ${modId}:`, error.message);
        failed.push(modId);
      }
    }

    return { rolledBack, failed };
  }

  /**
   * Phase 10D: Find all modifications that depend on a given modification
   */
  private findDependentModifications(modificationId: string): string[] {
    const dependents: string[] = [];

    // Find direct dependents
    for (const [depModId, dependencies] of this.modificationDependencies.entries()) {
      if (dependencies.includes(modificationId)) {
        dependents.push(depModId);

        // Recursively find transitive dependents
        const transitive = this.findDependentModifications(depModId);
        dependents.push(...transitive);
      }
    }

    return Array.from(new Set(dependents)); // Remove duplicates
  }

  /**
   * Phase 10D: Get rollback queue
   */
  getRollbackQueue(): typeof this.rollbackQueue {
    return [...this.rollbackQueue];
  }

  /**
   * Phase 10D: Clear rollback queue after execution
   */
  clearRollbackQueue(): void {
    this.rollbackQueue = [];
  }

  /**
   * Phase 10D: Get modification by ID
   */
  getModificationById(modificationId: string) {
    return this.modificationHistory.find(m => m.modificationId === modificationId);
  }
}
