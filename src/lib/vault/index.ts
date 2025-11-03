/**
 * Vault module exports
 * Provides utility functions and exports for the vault system
 */

export * from './vault-logger';
export * from './vaultTypes';
export * from './vaultService';

/**
 * Generate SHA-256 hash of a string
 */
export async function sha256(message: string): Promise<string> {
  // Use Web Crypto API (available in both browser and Node.js 15+)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for Node.js without Web Crypto API
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(message).digest('hex');
    } catch (e) {
      console.warn('Crypto not available, using simple hash fallback');
      // Simple fallback hash (not cryptographically secure)
      let hash = 0;
      for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(64, '0');
    }
  }

  throw new Error('No crypto implementation available');
}

/**
 * Create a stable, deterministic JSON string
 * Sorts object keys to ensure consistent hashing
 */
export function stableStringify(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj !== 'object') return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => {
    const value = stableStringify(obj[key]);
    return `"${key}":${value}`;
  });

  return '{' + pairs.join(',') + '}';
}
