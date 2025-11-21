// CLAUDE-META: Phase 9D Hybrid Patch - Firebase ID Token Verification
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Replace HMAC with Firebase Authentication
// Status: Production - Hybrid Safe Mode Active

import type { NextApiRequest } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";

export type VerifiedUser = {
  uid: string;
  email?: string;
  emailVerified: boolean;
};

/**
 * Extract and verify Firebase ID token from request
 * Replaces HMAC verification with Firebase Auth
 */
export async function verifyFirebaseToken(req: NextApiRequest): Promise<{ valid: boolean; user?: VerifiedUser; error?: string }> {
  const auth = adminAuth;

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) {
    return { valid: false, error: "No token provided" };
  }

  try {
    // Verify ID token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false,
      },
    };
  } catch (error: any) {
    console.error("Token verification failed:", error);

    if (error.code === "auth/id-token-expired") {
      return { valid: false, error: "Token expired" };
    } else if (error.code === "auth/id-token-revoked") {
      return { valid: false, error: "Token revoked" };
    } else if (error.code === "auth/invalid-id-token") {
      return { valid: false, error: "Invalid token" };
    }

    return { valid: false, error: "Authentication failed" };
  }
}

/**
 * Verify UID ownership of resource
 */
export function verifyOwnership(requestUid: string, resourceUid: string): { valid: boolean; error?: string } {
  if (requestUid !== resourceUid) {
    return { valid: false, error: "Unauthorized: UID mismatch" };
  }
  return { valid: true };
}

/**
 * Middleware wrapper for API routes requiring authentication
 */
export async function requireAuth(
  req: NextApiRequest,
  handler: (req: NextApiRequest, user: VerifiedUser) => Promise<any>
): Promise<any> {
  const verification = await verifyFirebaseToken(req);

  if (!verification.valid) {
    return {
      error: verification.error || "Unauthorized",
      status: 401,
    };
  }

  return handler(req, verification.user!);
}
