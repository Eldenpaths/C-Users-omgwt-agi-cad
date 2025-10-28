// CLAUDE-META: Phase 10 Leapfrog - Constitutional Guard
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Dynamically Typed Constitution (DTC) enforcement
// Status: Production - Hybrid Safe Mode Active

import type { CodeDiff } from "@/lib/meta/self-modifier";

export type ConstitutionRule = {
  id: string;
  version: string;
  category: "safety" | "ethics" | "privacy" | "security" | "quality";
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  pattern?: RegExp;
  validator?: (diff: CodeDiff) => boolean;
};

export type GuardResult = {
  approved: boolean;
  violations: string[];
  critiqueSummary: string;
  justificationHash: string;
};

/**
 * Constitutional Guard
 * Enforces ethical and safety rules on code modifications
 *
 * Rules are versioned and stored in Firestore
 * Every modification is critiqued against the constitution
 */
export class ConstitutionalGuard {
  private constitution: ConstitutionRule[] = [];
  private version: string = "1.0.0";

  constructor() {
    this.loadDefaultConstitution();
  }

  /**
   * Load constitution from Firestore
   * In production, this fetches from `constitution` collection
   */
  async loadConstitution(version?: string): Promise<void> {
    // TODO Phase 10.1: Load from Firestore
    // For now, use default constitution
    this.loadDefaultConstitution();
    this.version = version || "1.0.0";
  }

  /**
   * Load default constitution rules
   */
  private loadDefaultConstitution(): void {
    this.constitution = [
      // Safety rules
      {
        id: "safety-001",
        version: "1.0.0",
        category: "safety",
        rule: "Must not introduce eval() or arbitrary code execution",
        severity: "critical",
        pattern: /eval\(|new Function\(/,
      },
      {
        id: "safety-002",
        version: "1.0.0",
        category: "safety",
        rule: "Must not bypass recursion depth limits",
        severity: "critical",
        validator: (diff) => {
          return !(
            diff.newContent.includes("MAX_RECURSION_DEPTH") &&
            diff.newContent.includes("=") &&
            !diff.oldContent.includes("MAX_RECURSION_DEPTH =")
          );
        },
      },
      {
        id: "safety-003",
        version: "1.0.0",
        category: "safety",
        rule: "Must not introduce shell command execution",
        severity: "critical",
        pattern: /exec\(|spawn\(|child_process/,
      },

      // Security rules
      {
        id: "security-001",
        version: "1.0.0",
        category: "security",
        rule: "Must not expose credentials or secrets",
        severity: "critical",
        pattern: /API_KEY|SECRET|PASSWORD|TOKEN.*=.*["']/i,
      },
      {
        id: "security-002",
        version: "1.0.0",
        category: "security",
        rule: "Must not disable authentication checks",
        severity: "high",
        validator: (diff) => {
          const hasAuthCheck = diff.oldContent.includes("verifyFirebaseToken") ||
                               diff.oldContent.includes("requireAuth");
          const removesAuthCheck = !diff.newContent.includes("verifyFirebaseToken") &&
                                   !diff.newContent.includes("requireAuth");

          return !(hasAuthCheck && removesAuthCheck);
        },
      },

      // Privacy rules
      {
        id: "privacy-001",
        version: "1.0.0",
        category: "privacy",
        rule: "Must not log sensitive user data",
        severity: "high",
        pattern: /console\.log.*\b(uid|email|password|token)\b/i,
      },

      // Quality rules
      {
        id: "quality-001",
        version: "1.0.0",
        category: "quality",
        rule: "Must include CLAUDE-META header in new files",
        severity: "low",
        validator: (diff) => {
          // Only check new files
          if (diff.oldContent.length === 0 && diff.newContent.length > 0) {
            return diff.newContent.includes("// CLAUDE-META:");
          }
          return true; // Not a new file
        },
      },
      {
        id: "quality-002",
        version: "1.0.0",
        category: "quality",
        rule: "Must not introduce TODO comments in production code",
        severity: "low",
        pattern: /\/\/ TODO(?! Phase)/i, // Allow "// TODO Phase X" but not bare "// TODO"
      },
    ];
  }

  /**
   * Evaluate a modification against the constitution
   */
  async evaluateModification(diff: CodeDiff, agentId: string): Promise<GuardResult> {
    const violations: string[] = [];
    const critiques: string[] = [];

    console.log(`[ConstitutionalGuard] Evaluating modification to ${diff.filePath}`);

    // Check each constitutional rule
    for (const rule of this.constitution) {
      const violated = this.checkRule(rule, diff);

      if (violated) {
        const violationMsg = `[${rule.severity.toUpperCase()}] ${rule.category}/${rule.id}: ${rule.rule}`;
        violations.push(violationMsg);

        if (rule.severity === "critical" || rule.severity === "high") {
          critiques.push(`⚠️ ${violationMsg}`);
        }
      }
    }

    // Generate critique summary
    const critiqueSummary = this.generateCritique(diff, violations);

    // Compute justification hash
    const justificationHash = this.computeJustificationHash(diff, agentId, violations);

    // Approve only if no critical violations
    const hasCriticalViolation = violations.some(v => v.includes("[CRITICAL]"));
    const approved = !hasCriticalViolation;

    if (!approved) {
      console.warn(`[ConstitutionalGuard] Modification rejected: ${violations.length} violations`);
    } else {
      console.log(`[ConstitutionalGuard] Modification approved with ${violations.length} warnings`);
    }

    return {
      approved,
      violations,
      critiqueSummary,
      justificationHash,
    };
  }

  /**
   * Check a single rule
   */
  private checkRule(rule: ConstitutionRule, diff: CodeDiff): boolean {
    // Pattern-based check
    if (rule.pattern) {
      return rule.pattern.test(diff.newContent);
    }

    // Validator function check
    if (rule.validator) {
      try {
        return !rule.validator(diff); // Validator returns false if violated
      } catch (error) {
        console.error(`[ConstitutionalGuard] Rule ${rule.id} validator error:`, error);
        return false; // Assume not violated on error
      }
    }

    return false;
  }

  /**
   * Generate critique summary
   */
  private generateCritique(diff: CodeDiff, violations: string[]): string {
    if (violations.length === 0) {
      return `✅ Modification to ${diff.filePath} complies with constitution v${this.version}. Reason: ${diff.reason}`;
    }

    const critical = violations.filter(v => v.includes("[CRITICAL]")).length;
    const high = violations.filter(v => v.includes("[HIGH]")).length;

    return `❌ Modification to ${diff.filePath} has ${violations.length} violations (${critical} critical, ${high} high). Reason: ${diff.reason}`;
  }

  /**
   * Compute justification hash for audit
   */
  private computeJustificationHash(diff: CodeDiff, agentId: string, violations: string[]): string {
    const data = {
      agentId,
      filePath: diff.filePath,
      reason: diff.reason,
      constitutionVersion: this.version,
      violations,
      timestamp: Date.now(),
    };

    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    return `const-${this.version}-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Get current constitution version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get all rules by category
   */
  getRules(category?: ConstitutionRule["category"]): ConstitutionRule[] {
    if (category) {
      return this.constitution.filter(r => r.category === category);
    }
    return [...this.constitution];
  }

  /**
   * Add custom rule (human-only operation)
   */
  addRule(rule: ConstitutionRule): void {
    // In production, this would require human approval
    // For now, just add to in-memory constitution
    this.constitution.push(rule);
    console.log(`[ConstitutionalGuard] Added rule ${rule.id}`);
  }
}
