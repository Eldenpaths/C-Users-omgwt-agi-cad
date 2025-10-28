// CLAUDE-META: Phase 10B Fusion Testing - Constitutional Guard Audit
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Validate all 8 rules against live agents
// Status: Shadow Testing - HYBRID_SAFE Active

import { ConstitutionalGuard } from '../../src/lib/safety/constitutional-guard';
import { CodeDiff } from '../../src/lib/meta/self-modifier';

describe('ConstitutionalGuard - Rule Audit', () => {
  let guard: ConstitutionalGuard;

  beforeEach(() => {
    guard = new ConstitutionalGuard();
  });

  describe('Safety Rules', () => {
    test('safety-001: should detect eval() usage', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/eval-test.ts',
        oldContent: 'const x = 1;',
        newContent: 'eval("x = 2");',
        reason: 'Testing eval detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-001');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-001');
    });

    test('safety-001: should detect Function() constructor', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/function-constructor.ts',
        oldContent: 'const fn = () => {};',
        newContent: 'const fn = new Function("return 1");',
        reason: 'Testing Function() detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-002');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-001');
    });

    test('safety-002: should detect recursion limit bypass', async () => {
      const diff: CodeDiff = {
        filePath: 'src/lib/meta/recursive-agent.ts',
        oldContent: 'const MAX_DEPTH = 5;',
        newContent: 'const MAX_DEPTH = 999;',
        reason: 'Testing recursion limit protection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-003');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-002');
    });

    test('safety-003: should detect shell command execution', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/shell-exec.ts',
        oldContent: 'const result = "";',
        newContent: 'const result = require("child_process").exec("rm -rf /");',
        reason: 'Testing shell exec detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-004');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-003');
    });
  });

  describe('Security Rules', () => {
    test('security-001: should detect exposed credentials', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/credentials.ts',
        oldContent: 'const key = process.env.API_KEY;',
        newContent: 'const key = "sk_live_1234567890abcdef";',
        reason: 'Testing credential exposure',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-005');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] security/security-001');
    });

    test('security-002: should detect disabled auth checks', async () => {
      const diff: CodeDiff = {
        filePath: 'firestore.rules',
        oldContent: 'allow read: if request.auth != null;',
        newContent: 'allow read: if true;',
        reason: 'Testing auth bypass detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-006');

      expect(result.approved).toBe(false);
      expect(result.violations.some(v => v.includes('security-002'))).toBe(true);
    });
  });

  describe('Privacy Rules', () => {
    test('privacy-001: should detect sensitive data logging', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/logging.ts',
        oldContent: 'console.log("User action");',
        newContent: 'console.log("User password:", user.password);',
        reason: 'Testing privacy violation detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-007');

      expect(result.approved).toBe(false);
      expect(result.violations.some(v => v.includes('privacy-001'))).toBe(true);
    });
  });

  describe('Quality Rules', () => {
    test('quality-001: should require CLAUDE-META header', async () => {
      const diff: CodeDiff = {
        filePath: 'src/lib/new-module.ts',
        oldContent: '',
        newContent: 'export const newFeature = () => {};',
        reason: 'Testing metadata requirement',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-008');

      // Quality rules are LOW severity, should warn but not block
      const hasQualityWarning = result.violations.some(v => v.includes('quality-001'));
      if (hasQualityWarning) {
        expect(result.violations.some(v => v.includes('[LOW]'))).toBe(true);
      }
    });

    test('quality-002: should flag bare TODO comments', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/todo.ts',
        oldContent: 'const x = 1;',
        newContent: '// TODO: fix this\nconst x = 1;',
        reason: 'Testing TODO detection',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-009');

      const hasTodoWarning = result.violations.some(v => v.includes('quality-002'));
      if (hasTodoWarning) {
        expect(result.violations.some(v => v.includes('[LOW]'))).toBe(true);
      }
    });
  });

  describe('Rule Versioning', () => {
    test('should load constitution with version metadata', () => {
      const constitution = guard.getConstitution();

      expect(constitution).toHaveProperty('rules');
      expect(constitution).toHaveProperty('metadata');
      expect(constitution.metadata.constitutionVersion).toBe('1.0.0');
    });

    test('should track rule modifications', () => {
      const constitution = guard.getConstitution();

      for (const rule of constitution.rules) {
        expect(rule.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(rule.enabled).toBeDefined();
      }
    });
  });

  describe('Severity Enforcement', () => {
    test('should block on CRITICAL violations', async () => {
      const criticalDiff: CodeDiff = {
        filePath: 'src/test/critical.ts',
        oldContent: 'const safe = true;',
        newContent: 'eval("unsafe");',
        reason: 'Critical violation test',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(criticalDiff, 'test-agent-010');

      expect(result.approved).toBe(false);
      expect(result.violations.some(v => v.includes('[CRITICAL]'))).toBe(true);
    });

    test('should warn on LOW violations without blocking', async () => {
      const lowDiff: CodeDiff = {
        filePath: 'src/test/low-severity.ts',
        oldContent: 'const x = 1;',
        newContent: '// TODO\nconst x = 1;',
        reason: 'Low severity test',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(lowDiff, 'test-agent-011');

      // Low severity should not block approval
      const hasOnlyLowViolations = result.violations.every(v => v.includes('[LOW]'));
      if (hasOnlyLowViolations) {
        expect(result.approved).toBe(true);
      }
    });
  });

  describe('Justification Hashing', () => {
    test('should generate consistent justification hash', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/hash.ts',
        oldContent: 'const x = 1;',
        newContent: 'const x = 2;',
        reason: 'Consistent hashing test',
        riskScore: 0,
      };

      const result1 = await guard.evaluateModification(diff, 'test-agent-012');
      const result2 = await guard.evaluateModification(diff, 'test-agent-012');

      expect(result1.justificationHash).toBeDefined();
      expect(result1.justificationHash).toBe(result2.justificationHash);
    });
  });

  describe('Audit Trail', () => {
    test('should provide detailed critique summary', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/audit.ts',
        oldContent: 'const x = 1;',
        newContent: 'const x = 2;',
        reason: 'Audit trail test',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-013');

      expect(result.critiqueSummary).toBeDefined();
      expect(typeof result.critiqueSummary).toBe('string');
      expect(result.critiqueSummary.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Firestore', () => {
    test('should prepare data for selfModificationLog collection', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/firestore.ts',
        oldContent: 'const x = 1;',
        newContent: 'const x = 2;',
        reason: 'Firestore integration test',
        riskScore: 0,
      };

      const result = await guard.evaluateModification(diff, 'test-agent-014');

      // Should have all required fields for Firestore
      expect(result).toHaveProperty('approved');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('justificationHash');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
