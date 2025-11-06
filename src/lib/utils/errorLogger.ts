/**
 * Error Logging Utility
 * Logs errors to Firestore for monitoring
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';

export interface ErrorLog {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: unknown;
  userId?: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, unknown>;
}

/**
 * Log an error to Firestore
 */
export async function logError(
  error: Error | string,
  severity: 'error' | 'warning' | 'info' = 'error',
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getDbInstance();
    if (!db) return; // SSR or not initialized

    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: serverTimestamp(),
      severity,
      context,
    };

    await addDoc(collection(db, 'error_logs'), errorLog);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Logger]', errorLog);
    }
  } catch (loggingError) {
    // Don't throw if logging fails - just console.error
    console.error('[Error Logger] Failed to log error:', loggingError);
  }
}

/**
 * Log a warning to Firestore
 */
export async function logWarning(
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  return logError(message, 'warning', context);
}

/**
 * Log info to Firestore
 */
export async function logInfo(
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  return logError(message, 'info', context);
}

/**
 * Global error handler
 * Call this in _app.tsx or root layout
 */
export function initGlobalErrorHandler() {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'error', {
      type: 'uncaught',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : String(event.reason),
      'error',
      {
        type: 'unhandled-promise-rejection',
      }
    );
  });
}
