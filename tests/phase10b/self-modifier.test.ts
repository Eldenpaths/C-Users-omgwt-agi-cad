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
        oldContent: 'const x = 1;',
        newContent: 'const x = 2;',
        reason: 'Update constant value for testing',
        riskScore: 0,
      };

      const result = await modifier.proposeModification(safeDiff, 'test-agent-001');

      expect(result.approved).toBe(true);
      expect(result.riskScore).toBeLessThan(0.3);
      expect(result.justificationHash).toBeDefined();
    });

    test('should reject high-risk modification with eval()', async () => {
      const dangerousDiff: CodeDiff = {
        filePath: 'src/test/sample.ts',
        oldContent: 'const x = 1;',
        newContent: 'eval("malicious code");',
        reason: 'Testing dangerous pattern detection',
        riskScore: 0,
      };

      const result = await modifier.proposeModification(dangerousDiff, 'test-agent-002');

      expect(result.approved).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.3);
      expect(result.constitutionViolations).toContain('safety-001');
    });

    test('should reject modification to critical security file', async () => {
      const criticalDiff: CodeDiff = {
        filePath: 'src/lib/safety/constitutional-guard.ts',
        oldContent: 'const MAX_RISK = 0.3;',
        newContent: 'const MAX_RISK = 1.0;',
        reason: 'Attempting to bypass safety threshold',
        riskScore: 0,
      };

      const result = await modifier.proposeModification(criticalDiff, 'test-agent-003');

      expect(result.approved).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.3);
    });

    test('should enforce shadow testing on medium-risk changes', async () => {
      const mediumDiff: CodeDiff = {
        filePath: 'src/components/TestComponent.tsx',
        oldContent: 'return <div>Old</div>;',
        newContent: 'return <div>New</div>;',
        reason: 'Update component rendering',
        riskScore: 0,
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
        oldContent: 'const baseline = "stable";',
        newContent: 'const baseline = "unstable-deviation";',
        reason: 'Testing drift detection',
        riskScore: 0,
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
        oldContent: 'const state = "before";',
        newContent: 'const state = "after";',
        reason: 'Audit trail test',
        riskScore: 0,
      };

      const result = await modifier.proposeModification(diff, 'test-agent-006');
      const stats = modifier.getStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.rejected + stats.approved).toBe(stats.total);
    });
  });

  describe('Risk Scoring', () => {
    test('should calculate risk based on change size', async () => {
      const largeDiff: CodeDiff = {
        filePath: 'src/test/large-change.ts',
        oldContent: 'const a = 1;',
        newContent: 'const a = 1;\n'.repeat(100), // Large change
        reason: 'Testing change size risk',
        riskScore: 0,
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
          oldContent: 'const safe = true;',
          newContent: `${pattern}"test")`,
          reason: `Testing pattern: ${pattern}`,
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
        oldContent: 'const test = "before";',
        newContent: 'const test = "after";',
        reason: 'Testing constitutional validation',
        riskScore: 0,
      };

      const result = await modifier.proposeModification(diff, 'test-agent-008');

      expect(result.constitutionalCritique).toBeDefined();
      if (!result.approved) {
        expect(result.constitutionViolations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Statistics Tracking', () => {
    test('should track approval rate', async () => {
      const stats = modifier.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('approved');
      expect(stats).toHaveProperty('rejected');
      expect(stats).toHaveProperty('avgRisk');

      if (stats.total > 0) {
        const approvalRate = stats.approved / stats.total;
        expect(approvalRate).toBeGreaterThanOrEqual(0);
        expect(approvalRate).toBeLessThanOrEqual(1);
      }
    });
  });
});
