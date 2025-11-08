/*
 * Session Summary Generator + Optional Sync POST
 *
 * Usage:
 *   pnpm exec tsx scripts/session-summary.ts            # writes session-summary.txt
 *   AGI_CAD_SYNC_POST=true pnpm exec tsx scripts/session-summary.ts  # writes + POSTs
 *
 * Env:
 *   AGI_CAD_SYNC_URL   (default: https://chat.openai.com/api/agi-cad-sync)
 *   AGI_CAD_SYNC_TOKEN (optional Authorization: Bearer <token>)
 *   AGI_CAD_SINCE_REF  (override base ref; default last tag or HEAD~20)
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import * as https from 'https';
import * as path from 'path';

function sh(cmd: string, fallback = ''): string {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return fallback; }
}

function detectSinceRef(): string {
  const override = process.env.AGI_CAD_SINCE_REF?.trim();
  if (override) return override;
  const lastTag = sh('git describe --tags --abbrev=0', '');
  if (lastTag) return lastTag;
  return 'HEAD~20';
}

function parseDiff(diffText: string) {
  const lines = diffText.split(/\r?\n/).filter(Boolean);
  const files: Array<{ status: string; file: string }> = [];
  for (const line of lines) {
    const [status, file] = line.split(/\s+/, 2);
    if (!status || !file) continue;
    files.push({ status, file });
  }
  return files;
}

function toApiRouteFromPath(p: string): string {
  // src/pages/api/foo/bar.ts -> /api/foo/bar
  const rel = p.replace(/^src\/pages\//, '').replace(/\.(t|j)sx?$/, '');
  return '/' + rel.replace(/index$/, '').replace(/\/+/g, '/');
}

function toAppRouteFromPath(p: string): string {
  // src/app/foo/bar/page.tsx -> /foo/bar
  const m = p.match(/^src\/app\/(.*)\/page\.(t|j)sx?$/);
  if (!m) return '/';
  return '/' + m[1];
}

function section(title: string, body: string): string {
  return `\n## ${title}\n${body}\n`;
}

function postSummary(summary: string): Promise<{ status: number; body: string }>{
  return new Promise((resolve, reject) => {
    const url = new URL(process.env.AGI_CAD_SYNC_URL || 'https://chat.openai.com/api/agi-cad-sync');
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers: {
        'Content-Type': 'text/plain',
        ...(process.env.AGI_CAD_SYNC_TOKEN ? { Authorization: `Bearer ${process.env.AGI_CAD_SYNC_TOKEN}` } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.write(summary);
    req.end();
  });
}

async function main() {
  const branch = sh('git rev-parse --abbrev-ref HEAD', 'unknown');
  const head = sh('git rev-parse --short HEAD', '');
  const lastTag = sh('git describe --tags --abbrev=0', '');
  const sinceRef = detectSinceRef();
  const range = `${sinceRef}..HEAD`;
  const date = new Date().toISOString();

  const commits = sh(`git log --pretty=format:%h\ %ad\ %s --date=short ${range}`, '');
  const diff = sh(`git diff --name-status ${range}`, '');
  const files = parseDiff(diff);

  const added = files.filter(f => f.status.startsWith('A'));
  const modified = files.filter(f => f.status.startsWith('M'));
  const deleted = files.filter(f => f.status.startsWith('D'));

  const apiChanged = files.filter(f => f.file.startsWith('src/pages/api/'));
  const uiPages = files.filter(f => /^src\/app\/.+\/page\.(t|j)sx?$/.test(f.file));

  let body = `# AGI-CAD Session Summary\n\n`;
  body += `- Time: ${date}\n- Branch: ${branch}\n- HEAD: ${head}\n- Since: ${sinceRef}${lastTag && sinceRef === lastTag ? ' (last tag)' : ''}\n`;

  if (commits) {
    body += section('Commits', commits.split(/\r?\n/).map(l => `- ${l}`).join('\n'));
  }

  body += section('Files Changed', `Added: ${added.length}, Modified: ${modified.length}, Deleted: ${deleted.length}`);
  if (added.length) body += added.map(a => `- [A] ${a.file}`).join('\n') + '\n';
  if (modified.length) body += modified.map(m => `- [M] ${m.file}`).join('\n') + '\n';
  if (deleted.length) body += deleted.map(d => `- [D] ${d.file}`).join('\n') + '\n';

  if (apiChanged.length) {
    const routes = apiChanged.map(a => `- ${a.status} ${toApiRouteFromPath(a.file)} (${a.file})`).join('\n');
    body += section('API Routes Changed', routes);
  }
  if (uiPages.length) {
    const routes = uiPages.map(p => `- ${p.status} ${toAppRouteFromPath(p.file)} (${p.file})`).join('\n');
    body += section('UI Pages Changed', routes);
  }

  // Write to session-summary.txt at repo root
  const outPath = path.join(process.cwd(), 'session-summary.txt');
  writeFileSync(outPath, body, 'utf8');
  console.log(`Wrote ${outPath}`);

  if (String(process.env.AGI_CAD_SYNC_POST).toLowerCase() === 'true') {
    try {
      const res = await postSummary(body);
      console.log(`Sync POST → ${res.status}`);
    } catch (e: any) {
      console.warn('Sync POST failed:', e?.message || e);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

