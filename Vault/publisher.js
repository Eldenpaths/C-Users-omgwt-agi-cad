#!/usr/bin/env node
/**
 * Drift Map Publisher (Redis/WebSocket)
 *
 * Purpose
 * - Stream NDJSON lines from the vault sync log into a live feed for Phase 18D/18E.
 * - Emits JSON deltas { file, diff, timestamp } to all WebSocket clients.
 * - Optionally publishes the same payload to a Redis channel.
 *
 * Usage
 *   node vault/publisher.js
 *
 * Env vars
 *   DRIFT_WS_PORT=7070              Port for local WebSocket server
 *   DRIFT_REPLAY_LINES=10           Replay last N NDJSON lines on connection
 *   DRIFT_REDIS_URL=redis://...     If set and redis package is available, publish
 *   DRIFT_REDIS_CHANNEL=drift_map    Redis Pub/Sub channel (default)
 *   DRIFT_LOG_FILE=<path>           Override sync log path
 *
 * Notes
 * - Zero hard dependencies beyond 'ws' (already installed). Redis is optional.
 * - File resolution prefers AGI-CAD-Core/vault/sync_log.json then vault/sync_log.json.
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const WS_PORT = Number(process.env.DRIFT_WS_PORT || 7070);
const REDIS_URL = process.env.DRIFT_REDIS_URL || '';
const REDIS_CHANNEL = process.env.DRIFT_REDIS_CHANNEL || 'drift_map';
const REPLAY_LINES = Number(process.env.DRIFT_REPLAY_LINES || 10);

function resolveLogFile() {
  if (process.env.DRIFT_LOG_FILE && fs.existsSync(process.env.DRIFT_LOG_FILE)) {
    return process.env.DRIFT_LOG_FILE;
  }
  const repoRoot = path.resolve(__dirname, '..');
  const candidateA = path.join(repoRoot, 'AGI-CAD-Core', 'vault', 'sync_log.json');
  const candidateB = path.join(repoRoot, 'vault', 'sync_log.json');
  if (fs.existsSync(candidateA)) return candidateA;
  if (fs.existsSync(candidateB)) return candidateB;
  // Fallback: create under local vault folder if missing
  const ensureDir = path.join(__dirname);
  const fallback = path.join(ensureDir, 'sync_log.json');
  if (!fs.existsSync(fallback)) fs.writeFileSync(fallback, '');
  return fallback;
}

const LOG_FILE = resolveLogFile();
console.log(`[Publisher] Using log file: ${LOG_FILE}`);

// Optional Redis client (lazy)
let redisClient = null;
async function getRedis() {
  if (!REDIS_URL) return null;
  if (redisClient) return redisClient;
  try {
    // Prefer modern 'redis' package if available
    const mod = await import('redis').catch(() => null);
    if (mod && mod.createClient) {
      const client = mod.createClient({ url: REDIS_URL });
      client.on('error', (e) => console.warn('[Publisher] Redis error:', e.message));
      await client.connect();
      redisClient = client;
      console.log('[Publisher] Redis connected');
      return redisClient;
    }
  } catch (_) {}
  console.warn('[Publisher] Redis not available (package missing or failed). Skipping Redis publish.');
  return null;
}

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on('listening', () => {
  console.log(`[Publisher] WebSocket listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello', message: 'Welcome to Drift Map feed' }));
  // Optional replay
  if (REPLAY_LINES > 0) {
    try {
      const tail = readLastLines(LOG_FILE, REPLAY_LINES);
      tail.forEach((line) => {
        const payload = lineToPayload(line);
        if (payload) socket.send(JSON.stringify(payload));
      });
    } catch (e) {
      console.warn('[Publisher] Replay failed:', e.message);
    }
  }
});

function broadcast(obj) {
  const data = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

async function publishRedis(obj) {
  const client = await getRedis();
  if (!client) return;
  try {
    await client.publish(REDIS_CHANNEL, JSON.stringify(obj));
  } catch (e) {
    console.warn('[Publisher] Redis publish failed:', e.message);
  }
}

// Tail the file for new NDJSON lines
startTail(LOG_FILE, (line) => {
  const payload = lineToPayload(line);
  if (!payload) return;
  broadcast(payload);
  publishRedis(payload);
});

function lineToPayload(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    // Expected schema from sync scripts: { time, changes }
    const ts = obj.time || new Date().toISOString();
    const diff = obj.changes || '';
    return {
      type: 'vault-delta',
      file: path.basename(LOG_FILE),
      diff,
      timestamp: ts,
    };
  } catch (e) {
    // Non-JSON line; ignore
    return null;
  }
}

function startTail(filePath, onLine) {
  // Read current size and watch for appends
  let position = 0;
  try {
    const stats = fs.statSync(filePath);
    position = stats.size;
  } catch (_) {
    position = 0;
  }

  fs.watch(filePath, { persistent: true }, (eventType) => {
    if (eventType !== 'change') return;
    try {
      const stats = fs.statSync(filePath);
      if (stats.size < position) {
        // Truncated; reset
        position = 0;
      }
      if (stats.size > position) {
        const stream = fs.createReadStream(filePath, { start: position, end: stats.size });
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          let idx;
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            onLine(line);
          }
        });
        stream.on('end', () => {
          position = stats.size;
          if (buffer.length) onLine(buffer); // last line without newline
        });
      }
    } catch (e) {
      // ignore transient errors
    }
  });
}

function readLastLines(filePath, n) {
  const data = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (!data) return [];
  const lines = data.trim().split(/\r?\n/);
  return lines.slice(-n);
}

