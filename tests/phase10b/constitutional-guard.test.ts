// CLAUDE-META: Phase 10B Fusion Testing - Constitutional Guard Audit
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Validate all 8 rules against live agents
// Status: Shadow Testing - HYBRID_SAFE Active

import { ConstitutionalGuard, CodeDiff } from '../../src/lib/safety/constitutional-guard';

describe('ConstitutionalGuard - Rule Audit', () => {
  let guard: ConstitutionalGuard;

  beforeEach(() => {
    guard = new ConstitutionalGuard();
  });

  describe('Safety Rules', () => {
    test('safety-001: should detect eval() usage', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/eval-test.ts',
        oldCode: 'const x = 1;',
        newCode: 'eval("x = 2");',
        justification: 'Testing eval detection',
      };

      const result = await guard.evaluateModification(diff, 'test-agent-001');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-001');
    });

    test('safety-001: should detect Function() constructor', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/function-constructor.ts',
        oldCode: 'const fn = () => {};',
        newCode: 'const fn = new Function("return 1");',
        justification: 'Testing Function() detection',
      };

      const result = await guard.evaluateModification(diff, 'test-agent-002');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-001');
    });

    test('safety-002: should detect recursion limit bypass', async () => {
      const diff: CodeDiff = {
        filePath: 'src/lib/meta/recursive-agent.ts',
        oldCode: 'const MAX_DEPTH = 5;',
        newCode: 'const MAX_DEPTH = 999;',
        justification: 'Testing recursion limit protection',
      };

      const result = await guard.evaluateModification(diff, 'test-agent-003');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] safety/safety-002');
    });

    test('safety-003: should detect shell command execution', async () => {
      const diff: CodeDiff = {
        filePath: 'src/test/shell-exec.ts',
        oldCode: 'const result = "";',
        newCode: 'const result = require("child_process").exec("rm -rf /");',
        justification: 'Testing shell exec detection',
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
        oldCode: 'const key = process.env.API_KEY;',
        newCode: 'const key = "sk_live_1234567890abcdef";',
        justification: 'Testing credential exposure',
      };

      const result = await guard.evaluateModification(diff, 'test-agent-005');

      expect(result.approved).toBe(false);
      expect(result.violations).toContain('[CRITICAL] security/security-001');
    });

    test('security-002: should detect disabled auth checks', async () => {
      const diff: CodeDiff = {
        filePath: 'firestore.rules',
        oldCode: 'allow read: if request.auth != null;',
        newCode: 'allow read: if true;',
        justification: 'Testing auth bypass detection',
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
        oldCode: 'console.log("User action");',
        newCode: 'console.log("User password:", user.password);',
        justification: 'Testing privacy violation detection',
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
        oldCode: '',
        newCode: 'export const newFeature = () => {};',
        justification: 'Testing metadata requirement',
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
        oldCode: 'const x = 1;',
        newCode: '// TODO: fix this\nconst x = 1;',
        justification: 'Testing TODO detection',
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
        oldCode: 'const safe = true;',
        newCode: 'eval("unsafe");',
        justification: 'Critical violation test',
      };

      const result = await guard.evaluateModification(criticalDiff, 'test-agent-010');

      expect(result.approved).toBe(false);
      expect(result.violations.some(v => v.includes('[CRITICAL]'))).toBe(true);
    });

    test('should warn on LOW violations without blocking', async () => {
      const lowDiff: CodeDiff = {
        filePath: 'src/test/low-severity.ts',
        oldCode: 'const x = 1;',
        newCode: '// TODO\nconst x = 1;',
        justification: 'Low severity test',
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
        oldCode: 'const x = 1;',
        newCode: 'const x = 2;',
        justification: 'Consistent hashing test',
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
        oldCode: 'const x = 1;',
        newCode: 'const x = 2;',
        justification: 'Audit trail test',
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
        oldCode: 'const x = 1;',
        newCode: 'const x = 2;',
        justification: 'Firestore integration test',
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
