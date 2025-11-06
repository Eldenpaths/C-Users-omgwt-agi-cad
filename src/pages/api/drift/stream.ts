import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory subscribers for Redis fallback (no-op here)

async function getRedisClient() {
  const url = process.env.DRIFT_REDIS_URL || process.env.REDIS_URL;
  if (!url) return null;
  try {
    // Prefer modern 'redis' client if available
    // Use eval require to avoid bundler resolution when not installed
    const req: any = eval('require');
    const mod: any = (() => { try { return req('redis'); } catch { return null; } })();
    if (mod && mod.createClient) {
      const client = mod.createClient({ url });
      client.on('error', () => {});
      await client.connect();
      return client;
    }
  } catch (_) {}
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`event: hello\n`);
  res.write(`data: ${JSON.stringify({ message: 'Drift SSE connected' })}\n\n`);

  // Try to subscribe to Redis channel(s) if available
  const client: any = await getRedisClient();
  const channelPrimary = process.env.DRIFT_REDIS_CHANNEL || 'drift_map';
  const channelAlias = process.env.DRIFT_REDIS_ALIAS || 'vault_updates';

  let closed = false;
  req.on('close', async () => {
    closed = true;
    try {
      if (client) await client.quit();
    } catch (_) {}
  });

  if (!client) {
    // No Redis configured; keep connection open as heartbeat
    const interval = setInterval(() => {
      if (closed) {
        clearInterval(interval);
        return;
      }
      res.write(`event: ping\n`);
      res.write(`data: ${JSON.stringify({ t: Date.now() })}\n\n`);
    }, 25000);
    return;
  }

  try {
    await client.subscribe(channelPrimary, (message: string) => {
      res.write(`data: ${message}\n\n`);
    });
    if (channelAlias && channelAlias !== channelPrimary) {
      await client.subscribe(channelAlias, (message: string) => {
        res.write(`data: ${message}\n\n`);
      });
    }
  } catch (err: any) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: err?.message || 'subscribe failed' })}\n\n`);
  }
}
