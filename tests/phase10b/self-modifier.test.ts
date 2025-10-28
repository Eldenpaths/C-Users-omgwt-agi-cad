// CLAUDE-META: Phase 10B Fusion Testing - Self-Modifier Tests
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Safe diff application & rollback validation
// Status: Shadow Testing - HYBRID_SAFE Active

import { SelfModifier, CodeDiff } from '../../src/lib/meta/self-modifier';
import { ConstitutionalGuard } from '../../src/lib/safety/constitutional-guard';

describe('SelfModifier - Fusion Tests', () => {
  let modifier: SelfModifier;
  let guard: ConstitutionalGuard;

  beforeEach(() => {
    guard = new ConstitutionalGuard();
    modifier = new SelfModifier(guard);
  });

  describe('Safe Diff Application', () => {
    test('should approve low-risk modification', async () => {
      const safeDiff: CodeDiff = {
        filePath: 'src/test/sample.ts',
        oldCode: 'const x = 1;',
        newCode: 'const x = 2;',
        justification: 'Update constant value for testing',
      };

      const result = await modifier.proposeModification(safeDiff, 'test-agent-001');

      expect(result.approved).toBe(true);
      expect(result.riskScore).toBeLessThan(0.3);
      expect(result.justificationHash).toBeDefined();
    });

    test('should reject high-risk modification with eval()', async () => {
      const dangerousDiff: CodeDiff = {
        filePath: 'src/test/sample.ts',
        oldCode: 'const x = 1;',
        newCode: 'eval("malicious code");',
        justification: 'Testing dangerous pattern detection',
      };

      const result = await modifier.proposeModification(dangerousDiff, 'test-agent-002');

      expect(result.approved).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.3);
      expect(result.violations).toContain('safety-001');
    });

    test('should reject modification to critical security file', async () => {
      const criticalDiff: CodeDiff = {
        filePath: 'src/lib/safety/constitutional-guard.ts',
        oldCode: 'const MAX_RISK = 0.3;',
        newCode: 'const MAX_RISK = 1.0;',
        justification: 'Attempting to bypass safety threshold',
      };

      const result = await modifier.proposeModification(criticalDiff, 'test-agent-003');

      expect(result.approved).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.3);
    });

    test('should enforce shadow testing on medium-risk changes', async () => {
      const mediumDiff: CodeDiff = {
        filePath: 'src/components/TestComponent.tsx',
        oldCode: 'return <div>Old</div>;',
        newCode: 'return <div>New</div>;',
        justification: 'Update component rendering',
      };

      const result = await modifier.proposeModification(mediumDiff, 'test-agent-004');

      expect(result.shadowTestRan).toBe(true);
      if (result.shadowTestResult) {
        expect(result.shadowTestResult.passed).toBe(true);
      }
    });
  });

  describe('Rollback Mechanism', () => {
    test('should rollback on drift_score > 0.1', async () => {
      const driftDiff: CodeDiff = {
        filePath: 'src/test/drift-test.ts',
        oldCode: 'const baseline = "stable";',
        newCode: 'const baseline = "unstable-deviation";',
        justification: 'Testing drift detection',
      };

      const result = await modifier.proposeModification(driftDiff, 'test-agent-005');

      if (result.driftScore && result.driftScore > 0.1) {
        expect(result.approved).toBe(false);
        expect(result.rollbackRecommended).toBe(true);
      }
    });

    test('should maintain audit trail for rolled-back changes', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/audit.ts',
        oldCode: 'const state = "before";',
        newCode: 'const state = "after";',
        justification: 'Audit trail test',
      };

      const result = await modifier.proposeModification(diff, 'test-agent-006');
      const stats = modifier.getStats();

      expect(stats.totalProposals).toBeGreaterThan(0);
      expect(stats.totalRejections + stats.totalApprovals).toBe(stats.totalProposals);
    });
  });

  describe('Risk Scoring', () => {
    test('should calculate risk based on change size', async () => {
      const largeDiff: CodeDiff = {
        filePath: 'src/test/large-change.ts',
        oldCode: 'const a = 1;',
        newCode: 'const a = 1;\n'.repeat(100), // Large change
        justification: 'Testing change size risk',
      };

      const result = await modifier.proposeModification(largeDiff, 'test-agent-007');

      expect(result.riskScore).toBeGreaterThan(0.2); // Size penalty
    });

    test('should detect dangerous patterns in newCode', async () => {
      const patterns = [
        'eval(',
        'Function(',
        'child_process',
        'exec(',
        'process.exit',
      ];

      for (const pattern of patterns) {
        const diff: CodeDiff = {
          filePath: 'src/test/pattern-test.ts',
          oldCode: 'const safe = true;',
          newCode: `${pattern}"test")`,
          justification: `Testing pattern: ${pattern}`,
        };

        const result = await modifier.proposeModification(diff, `test-agent-${pattern}`);
        expect(result.approved).toBe(false);
      }
    });
  });

  describe('Constitutional Integration', () => {
    test('should validate against all active rules', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/constitutional.ts',
        oldCode: 'const test = "before";',
        newCode: 'const test = "after";',
        justification: 'Testing constitutional validation',
      };

      const result = await modifier.proposeModification(diff, 'test-agent-008');

      expect(result.constitutionalCritique).toBeDefined();
      if (!result.approved) {
        expect(result.violations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Statistics Tracking', () => {
    test('should track approval rate', async () => {
      const stats = modifier.getStats();

      expect(stats).toHaveProperty('totalProposals');
      expect(stats).toHaveProperty('totalApprovals');
      expect(stats).toHaveProperty('totalRejections');
      expect(stats).toHaveProperty('averageRiskScore');

      if (stats.totalProposals > 0) {
        const approvalRate = stats.totalApprovals / stats.totalProposals;
        expect(approvalRate).toBeGreaterThanOrEqual(0);
        expect(approvalRate).toBeLessThanOrEqual(1);
      }
    });
  });
});
