/**
 * SemanticGovernor — policy gate and routing governor.
 *
 * Responsibilities:
 * - Bridge to ConstitutionalGuard for code/self-modification checks
 * - Lightweight policy checks on route tasks (agent + payload)
 * - Optional telemetry logging (best-effort, dynamic import)
 */

import { ConstitutionalGuard, type GuardResult } from '@/lib/safety/constitutional-guard';

export type RouteTask = { agent: string; payload: any };

export type GovernorDecision = {
  allowed: boolean;
  reason: string;
  severity?: 'info' | 'warn' | 'block';
  guard?: GuardResult;
};

export class SemanticGovernor {
  private guard: ConstitutionalGuard;

  constructor() {
    this.guard = new ConstitutionalGuard();
  }

  /**
   * Vet a route task on semantic safety grounds.
   * Simple rules: block dangerous keywords or oversized payloads; prefer allow otherwise.
   */
  async vetRouteTask(task: RouteTask): Promise<GovernorDecision> {
    const payloadStr = this.safeStringify(task.payload).toLowerCase();
    if (payloadStr.length > 200_000) {
      await this.logTelemetry('governor_block', { agent: task.agent, reason: 'payload_too_large' });
      return { allowed: false, reason: 'Payload too large', severity: 'block' };
    }
    if (/rm -rf|format c:|drop table|delete from|curl .*\| sh/.test(payloadStr)) {
      await this.logTelemetry('governor_block', { agent: task.agent, reason: 'potentially_destructive' });
      return { allowed: false, reason: 'Potentially destructive command', severity: 'block' };
    }
    await this.logTelemetry('governor_allow', { agent: task.agent });
    return { allowed: true, reason: 'ok', severity: 'info' };
  }

  /**
   * Evaluate a code change via ConstitutionalGuard
   */
  async vetCodeChange(diff: { filePath: string; oldContent: string; newContent: string; reason: string; riskScore?: number }, agentId = 'governor'): Promise<GovernorDecision> {
    const fullDiff = {
      filePath: diff.filePath,
      oldContent: diff.oldContent,
      newContent: diff.newContent,
      reason: diff.reason,
      riskScore: typeof diff.riskScore === 'number' ? diff.riskScore : this.quickRisk(diff),
    } as any;
    const guard = await this.guard.evaluateModification(fullDiff, agentId);
    const allowed = guard.approved;
    const reason = allowed ? 'constitution_ok' : 'constitution_violation';
    await this.logTelemetry(allowed ? 'governor_constitution_ok' : 'governor_constitution_block', { filePath: diff.filePath, violations: guard.violations.length });
    return { allowed, reason, severity: allowed ? 'info' : 'block', guard };
  }

  /**
   * Best-effort telemetry; dynamically imports the client-safe logger.
   */
  private async logTelemetry(event: string, meta?: Record<string, unknown>) {
    try {
      const mod = await import('@/lib/learning/telemetry');
      const userId = 'system';
      await mod.default.logEvent({ userId, event, meta, timestamp: Date.now() });
    } catch {
      // swallow
    }
  }

  private safeStringify(obj: any): string {
    try { return typeof obj === 'string' ? obj : JSON.stringify(obj); } catch { return String(obj); }
  }

  private quickRisk(diff: { oldContent: string; newContent: string }): number {
    // very rough heuristic risk estimator
    const addedLen = Math.max(0, diff.newContent.length - diff.oldContent.length);
    const hasDanger = /(eval\(|new Function\(|child_process|spawn\(|exec\(|DROP TABLE|DELETE FROM)/i.test(diff.newContent);
    let r = Math.min(1, addedLen / 5000);
    if (hasDanger) r = Math.max(r, 0.6);
    return r;
  }
}

export default SemanticGovernor;
