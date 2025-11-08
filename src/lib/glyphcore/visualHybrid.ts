/**
 * Visual-Hybrid Compression (Phase 29C stub)
 *
 * Server: uses `sharp` dynamically (if available) to convert binary/image input to WebP.
 * Client: uses Canvas to render strings into a bitmap and export as PNG/WebP.
 *
 * Disabled by default. Gate with env: VISUAL_COMPRESSION=true
 * The functions fall back to passthrough when disabled or when dependencies are missing.
 */

export function isVisualCompressionEnabled(): boolean {
  return String(process.env.VISUAL_COMPRESSION).toLowerCase() === 'true';
}

/**
 * Attempt server-side visual compression using `sharp` when enabled.
 * - input: Uint8Array (image or raw bytes) or base64 data URL string
 * - returns: Uint8Array (webp) or original bytes when disabled/unavailable
 */
export async function visualCompressServer(input: Uint8Array | string): Promise<Uint8Array> {
  if (typeof window !== 'undefined' || !isVisualCompressionEnabled()) {
    return typeof input === 'string' ? new TextEncoder().encode(input) : input;
  }
  try {
    const sharp = (await import('sharp')).default as any;
    let buf: Buffer;
    if (typeof input === 'string') {
      // If data URL, strip header
      const m = input.match(/^data:.*;base64,(.*)$/);
      const b64 = m ? m[1] : input;
      buf = Buffer.from(b64, 'base64');
    } else {
      buf = Buffer.from(input);
    }
    const webp = await sharp(buf).webp({ quality: 80 }).toBuffer();
    return new Uint8Array(webp);
  } catch {
    // sharp not available or failed: passthrough
    return typeof input === 'string' ? new TextEncoder().encode(input) : input;
  }
}

/**
 * Attempt client-side visual compression using Canvas when enabled.
 * Only supports string payloads for MVP. For binary images, pass data URL.
 */
export async function visualCompressClient(textOrDataUrl: string): Promise<Uint8Array> {
  if (typeof window === 'undefined' || !isVisualCompressionEnabled()) {
    return new TextEncoder().encode(textOrDataUrl);
  }
  try {
    // Render text into an offscreen canvas
    const canvas = document.createElement('canvas');
    const W = 512, H = 128;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new TextEncoder().encode(textOrDataUrl);
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f5deb3';
    ctx.font = '20px monospace';
    const lines = textOrDataUrl.split(/\r?\n/).slice(0, 5);
    lines.forEach((ln, i) => ctx.fillText(ln.slice(0, 64), 12, 30 + i * 22));
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve as any, 'image/webp', 0.8));
    if (!blob) return new TextEncoder().encode(textOrDataUrl);
    const arr = await blob.arrayBuffer();
    return new Uint8Array(arr);
  } catch {
    return new TextEncoder().encode(textOrDataUrl);
  }
}

/**
 * No-op visual decompression placeholder.
 * Real inverse transforms depend on how the visual encoder operates.
 */
export async function visualDecompress(_bytes: Uint8Array): Promise<Uint8Array> {
  return _bytes;
}

export default {
  isVisualCompressionEnabled,
  visualCompressServer,
  visualCompressClient,
  visualDecompress,
};

