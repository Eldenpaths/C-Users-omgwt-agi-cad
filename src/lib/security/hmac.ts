// CLAUDE-META: Phase 9C Hybrid Patch - HMAC Verification
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Secure API request signing and verification
// Status: Production - Hybrid Safe Mode Active

import crypto from "crypto";

const HMAC_SECRET = process.env.HMAC_SECRET || "agi-cad-hybrid-safe-secret-key";
const HMAC_ALGORITHM = "sha256";

export type SignedPayload<T = any> = {
  data: T;
  uid: string;
  timestamp: number;
  hmac: string;
};

/**
 * Server-side: Verify HMAC signature
 */
export function verifyHMAC<T>(payload: SignedPayload<T>): { valid: boolean; data?: T; error?: string } {
  const { data, uid, timestamp, hmac } = payload;

  // Check timestamp (reject if > 5 minutes old)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return { valid: false, error: "Request expired" };
  }

  // Recompute HMAC
  const message = JSON.stringify({ data, uid, timestamp });
  const expectedHmac = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_SECRET)
    .update(message)
    .digest("hex");

  if (hmac !== expectedHmac) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true, data };
}

/**
 * Client-side: Sign payload (requires secret in env - use session token in production)
 */
export function signPayload<T>(data: T, uid: string): SignedPayload<T> {
  const timestamp = Date.now();
  const message = JSON.stringify({ data, uid, timestamp });

  // In production, this should use a session token or Firebase ID token
  // For Phase 9C, we'll use a shared secret (less secure, but functional)
  const hmac = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_SECRET)
    .update(message)
    .digest("hex");

  return { data, uid, timestamp, hmac };
}

/**
 * Client-side helper (browser-safe, uses Web Crypto API)
 */
export async function signPayloadBrowser<T>(data: T, uid: string, secret: string): Promise<SignedPayload<T>> {
  const timestamp = Date.now();
  const message = JSON.stringify({ data, uid, timestamp });

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return { data, uid, timestamp, hmac };
}
