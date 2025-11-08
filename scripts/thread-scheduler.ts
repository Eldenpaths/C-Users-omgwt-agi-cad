#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type ThreadConfig = {
  maxMessages: number;
  maxTokens: number;
  reminderDays: string[]; // e.g., ["Friday"]
  reminderHour: number; // local hour (0-23)
  driftThreshold: number;
};

type SchedulerState = {
  lastSnapshotCommit?: string;
  lastReminderISO?: string; // last weekly reminder date (YYYY-MM-DD)
};

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, '.agi-cad', 'thread-config.json');
const LOG_DIR = path.join(ROOT, 'logs');
const STATE_PATH = path.join(LOG_DIR, 'thread-state.json');
const STATUS_PATH = path.join(LOG_DIR, 'thread-status.json');
const SHIFTS_LOG = path.join(LOG_DIR, 'thread-shifts.log');
const NOTIFICATIONS = path.join(LOG_DIR, 'notifications.json');
const VAULT_DIR = path.join(ROOT, 'vault');
const PHASE_HEADER = path.join(VAULT_DIR, 'phase-header.md');

function ensureDirs() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
}

function readConfig(): ThreadConfig {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw) as ThreadConfig;
}

function readState(): SchedulerState {
  if (!fs.existsSync(STATE_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return {}; }
}

function writeState(state: SchedulerState) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function appendShiftLog(line: string) {
  fs.appendFileSync(SHIFTS_LOG, line + '\n');
}

function pushNotification(message: string, meta: Record<string, any> = {}) {
  const arr: any[] = fs.existsSync(NOTIFICATIONS) ? (JSON.parse(fs.readFileSync(NOTIFICATIONS, 'utf8') || '[]')) : [];
  arr.unshift({ ts: new Date().toISOString(), message, ...meta });
  // keep last 200
  while (arr.length > 200) arr.pop();
  fs.writeFileSync(NOTIFICATIONS, JSON.stringify(arr, null, 2));
}

function git(cmd: string): string {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function getHeadCommit(): string {
  return git('git rev-parse HEAD');
}

function getLastCommitTime(): number {
  const s = git('git log -1 --format=%ct');
  return parseInt(s, 10) * 1000; // seconds → ms
}

function countCommitsSince(base?: string): number {
  if (!base) return 0;
  try {
    const s = git(`git rev-list --count ${base}..HEAD`);
    return parseInt(s, 10) || 0;
  } catch {
    return 0;
  }
}

function estimateRepoTokens(): number {
  // Rough heuristic: sum file sizes in src + docs; tokens ≈ chars/4
  const targets = ['src', 'docs'];
  let bytes = 0;
  for (const t of targets) {
    const p = path.join(ROOT, t);
    if (!fs.existsSync(p)) continue;
    bytes += dirSize(p);
  }
  return Math.floor(bytes / 4);
}

function dirSize(dir: string): number {
  let sum = 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) sum += dirSize(p);
    else sum += st.size;
  }
  return sum;
}

function currentPhase(): string {
  // Try to infer from docs: pick highest PhaseXX* file
  const docs = path.join(ROOT, 'docs');
  if (!fs.existsSync(docs)) return 'unknown';
  const files = fs.readdirSync(docs).filter(f => /^Operator-Manual-Phase\d+/i.test(f) || /Phase\d+/i.test(f));
  const nums = files.map(f => parseInt((f.match(/Phase(\d+)/i)?.[1] ?? '0'), 10));
  const max = nums.reduce((a, b) => Math.max(a, b), 0);
  return max ? `Phase ${max}` : 'unknown';
}

function snapshotCanon(reason: string) {
  const now = new Date().toISOString();
  const phase = currentPhase();
  const content = `# Canon Snapshot\n\n- Phase: ${phase}\n- Timestamp: ${now}\n- Reason: ${reason}\n`;
  fs.writeFileSync(PHASE_HEADER, content);
}

function isWeeklyReminderDue(cfg: ThreadConfig, state: SchedulerState): boolean {
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  const hour = now.getHours();
  if (!cfg.reminderDays.includes(day)) return false;
  if (hour < cfg.reminderHour) return false;
  const todayISO = now.toISOString().slice(0, 10);
  if (state.lastReminderISO === todayISO) return false;
  return true;
}

async function main() {
  ensureDirs();
  const cfg = readConfig();
  const state = readState();

  // Derive counters
  const head = getHeadCommit();
  if (!state.lastSnapshotCommit) state.lastSnapshotCommit = head; // initialize baseline
  const messageCount = countCommitsSince(state.lastSnapshotCommit);
  const tokenCount = estimateRepoTokens();
  const lastCommitTime = getLastCommitTime();

  const reasons: string[] = [];
  if (messageCount >= cfg.maxMessages) reasons.push(`messageCount>=${cfg.maxMessages}`);
  if (tokenCount >= cfg.maxTokens) reasons.push(`tokenCount>=${cfg.maxTokens}`);

  // Drift threshold left as hook (future): if external metric present, compare here

  if (reasons.length) {
    const line = `${new Date().toISOString()} | ${currentPhase()} | ${reasons.join(', ')} | lastCommit=${new Date(lastCommitTime).toISOString()}`;
    appendShiftLog(line);
    pushNotification('Thread rotation recommended: thresholds reached', { reasons, lastCommitTime });
    snapshotCanon(reasons.join(', '));
    // reset baseline to current head after snapshot
    state.lastSnapshotCommit = head;
  }

  // Compute phase status for HUD
  const approaching =
    messageCount >= Math.floor(cfg.maxMessages * 0.8) ||
    tokenCount >= Math.floor(cfg.maxTokens * 0.8);
  const phaseStatus = reasons.length ? 'checkpoint' : approaching ? 'approaching' : 'stable';
  const driftScore = 0; // future hook

  const status = {
    messageCount,
    tokenEstimate: tokenCount,
    driftScore,
    phaseStatus,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));

  if (isWeeklyReminderDue(cfg, state)) {
    pushNotification('Phase checkpoint due; consider starting a new thread.', { schedule: 'weekly' });
    state.lastReminderISO = new Date().toISOString().slice(0, 10);
  }

  writeState(state);
  // console summary
  console.log('[thread-scheduler] messageCount=%d, tokenEstimate=%d, lastCommit=%s', messageCount, tokenCount, new Date(lastCommitTime).toISOString());
}

main().catch((e) => {
  console.error('[thread-scheduler] failed:', e);
  process.exit(1);
});
