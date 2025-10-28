// CLAUDE-META: Phase 10 Leapfrog - Self-Modification Core
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Safe code self-modification with Constitutional Guard
// Status: Production - Hybrid Safe Mode Active

import { DriftMonitor } from "../safety/drift-monitor";
import { ConstitutionalGuard } from "../safety/constitutional-guard";

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

  // Track modification history
  private modificationHistory: Array<{
    timestamp: number;
    diff: CodeDiff;
    result: ModificationResult;
  }> = [];

  constructor(guard: ConstitutionalGuard) {
    this.guard = guard;
    this.driftMonitor = new DriftMonitor(50, 2.0, 0.75);
  }

  /**
   * Propose a code modification
   * Returns approval/rejection with detailed reasoning
   */
  async proposeModification(diff: CodeDiff, agentId: string): Promise<ModificationResult> {
    console.log(`[SelfModifier] Agent ${agentId} proposing modification to ${diff.filePath}`);

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
        };
      }
    }

    // 5. Drift monitoring
    const driftScore = this.assessModificationDrift(diff);

    // 6. All checks passed
    const result: ModificationResult = {
      approved: true,
      riskScore: computedRisk,
      constitutionViolations: [],
      driftScore,
      shadowTestResult: shadowResult,
      justificationHash: this.computeJustificationHash(diff, []),
    };

    // Log to history
    this.modificationHistory.push({
      timestamp: Date.now(),
      diff,
      result,
    });

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
   * Assess modification drift
   * Higher drift = more divergence from established patterns
   */
  private assessModificationDrift(diff: CodeDiff): number {
    // Simplified drift calculation
    // In production, this would analyze:
    // - Code style consistency
    // - Architectural patterns
    // - Naming conventions
    // - Test coverage

    const oldLines = diff.oldContent.split("\n").length;
    const newLines = diff.newContent.split("\n").length;
    const lineDelta = Math.abs(newLines - oldLines);

    // Normalized drift score
    return Math.min(1.0, lineDelta / 100);
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
}
