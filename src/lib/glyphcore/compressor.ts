import * as snappyjs from 'snappyjs';

/**
 * Hybrid compressor that prefers snappyjs in browser and falls back to node 'snappy' on server.
 * We prepend a 4-byte ASCII header to indicate algorithm: 'SJS\x00' or 'SNY\x00'.
 */

export type Algo = 'snappyjs' | 'snappy';

const HDR_SJS = new Uint8Array([0x53, 0x4a, 0x53, 0x00]); // 'SJS\x00'
const HDR_SNY = new Uint8Array([0x53, 0x4e, 0x59, 0x00]); // 'SNY\x00'

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function textToUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function uint8ToText(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}

async function compressNode(data: Uint8Array): Promise<Uint8Array> {
  // Dynamic import to avoid bundling in client builds
  const mod: any = await import('snappy');
  const buf = Buffer.from(data);
  const out: Buffer = await new Promise((resolve, reject) => mod.compress(buf, (err: any, res: Buffer) => (err ? reject(err) : resolve(res))));
  return new Uint8Array(out);
}

async function decompressNode(data: Uint8Array): Promise<Uint8Array> {
  const mod: any = await import('snappy');
  const buf = Buffer.from(data);
  const out: Buffer = await new Promise((resolve, reject) => mod.uncompress(buf, { asBuffer: true }, (err: any, res: Buffer) => (err ? reject(err) : resolve(res))));
  return new Uint8Array(out);
}

export async function compress(payload: Uint8Array | string): Promise<Uint8Array> {
  const input = typeof payload === 'string' ? textToUint8(payload) : payload;
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const body = snappyjs.compress(input);
    return concat(HDR_SJS, body);
  }
  const body = await compressNode(input);
  return concat(HDR_SNY, body);
}

export async function decompress(blob: Uint8Array): Promise<Uint8Array> {
  const hdr = blob.slice(0, 4);
  const body = blob.slice(4);
  const hdrStr = uint8ToText(hdr);
  if (hdrStr === 'SJS\u0000') {
    return snappyjs.uncompress(body);
  }
  if (hdrStr === 'SNY\u0000') {
    return await decompressNode(body);
  }
  // Unknown header: assume raw snappyjs
  try {
    return snappyjs.uncompress(blob);
  } catch {
    // Return as-is
    return blob;
  }
}

export async function roundTripText(text: string): Promise<{ sizeIn: number; sizeOut: number; restored: string }>{
  const c = await compress(text);
  const d = await decompress(c);
  return { sizeIn: text.length, sizeOut: c.length, restored: new TextDecoder().decode(d) };
}

export default { compress, decompress };

