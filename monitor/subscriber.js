// monitor/subscriber.js
// Example Redis subscriber for vault drift updates.

async function main() {
  const channel = process.env.DRIFT_REDIS_CHANNEL || 'drift_map';
  const url = process.env.DRIFT_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  // Prefer modern redis; fallback to ioredis if present
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', (e) => console.warn('[subscriber] redis error:', e.message));
    await client.connect();
    await client.subscribe(channel, (msg) => {
      try {
        const evt = JSON.parse(msg);
        console.log('[subscriber] Vault event:', evt);
      } catch {
        console.log('[subscriber] Vault event raw:', msg);
      }
    });
    console.log(`[subscriber] listening on ${channel}`);
  } catch (e) {
    try {
      const IORedis = (await import('ioredis')).default;
      const redis = new IORedis(url);
      redis.subscribe(channel);
      redis.on('message', (_ch, msg) => {
        try {
          console.log('[subscriber] Vault event:', JSON.parse(msg));
        } catch {
          console.log('[subscriber] Vault event raw:', msg);
        }
      });
      console.log(`[subscriber] listening on ${channel} (ioredis)`);
    } catch (err) {
      console.error('[subscriber] No Redis client available. Install "redis" or "ioredis" package.');
      process.exit(1);
    }
  }
}

main();

