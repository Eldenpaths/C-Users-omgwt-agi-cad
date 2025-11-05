/**
 * Production Logger
 * Centralized logging with error tracking support
 *
 * Phase 19-FINAL: Production-ready error logging
 */

import { getDbInstance } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

/**
 * Logger class with production error tracking
 */
export class Logger {
  /**
   * Log error with context
   */
  static async error(message: string, error?: any, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error);

    // In production, log to Firestore
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      try {
        const db = getDbInstance();
        await addDoc(collection(db, 'error-logs'), {
          level: LogLevel.ERROR,
          message,
          error: error ? {
            message: error.message || error.toString(),
            stack: error.stack,
            name: error.name,
          } : null,
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: process.env.NODE_ENV,
        });
      } catch (e) {
        // Fail silently - don't break app due to logging failure
        console.error('Failed to log error to Firestore:', e);
      }
    }
  }

  /**
   * Log warning
   */
  static warn(message: string, data?: any, context?: LogContext) {
    console.warn(`[WARN] ${message}`, data);

    // Optionally log warnings in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      try {
        const db = getDbInstance();
        addDoc(collection(db, 'warn-logs'), {
          level: LogLevel.WARN,
          message,
          data,
          context,
          timestamp: new Date().toISOString(),
        }).catch(() => {}); // Fire and forget
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Log info
   */
  static info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data);
  }

  /**
   * Log debug (dev only)
   */
  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Log user action for analytics
   */
  static async logAction(action: string, data?: any) {
    Logger.info(`User action: ${action}`, data);

    // In production, log to analytics
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      try {
        const db = getDbInstance();
        addDoc(collection(db, 'user-actions'), {
          action,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }).catch(() => {}); // Fire and forget
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Log performance metric
   */
  static performance(metric: string, value: number, unit: string = 'ms') {
    Logger.debug(`Performance: ${metric} = ${value}${unit}`);

    // Could send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to analytics
    }
  }
}

/**
 * Global error handler
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    Logger.error('Uncaught error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    Logger.error('Unhandled promise rejection', event.reason, {
      promise: 'unhandled',
    });
  });
}

/**
 * Helper to measure execution time
 */
export function measureTime<T>(fn: () => T, label: string): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    Logger.performance(label, duration);
    return result;
  } catch (error) {
    Logger.error(`${label} failed`, error);
    throw error;
  }
}

/**
 * Helper to measure async execution time
 */
export async function measureTimeAsync<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    Logger.performance(label, duration);
    return result;
  } catch (error) {
    Logger.error(`${label} failed`, error);
    throw error;
  }
}
