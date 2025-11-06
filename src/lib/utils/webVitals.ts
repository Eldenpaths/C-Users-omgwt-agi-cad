/**
 * Web Vitals Tracking Utility
 * Tracks Core Web Vitals and reports to Firestore
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { addDoc, collection } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase/client';

interface VitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
  userAgent: string;
}

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const { name, value } = metric;

  // Thresholds based on Core Web Vitals recommendations
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 }, // Replaced FID
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

async function sendToFirestore(metric: Metric) {
  try {
    const db = getDbInstance();
    if (!db) return; // SSR or not initialized

    const vitalsData: VitalsData = {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    };

    await addDoc(collection(db, 'web_vitals'), vitalsData);
  } catch (error) {
    // Silently fail - don't impact user experience
    if (process.env.NODE_ENV === 'development') {
      console.error('[Web Vitals] Failed to log:', error);
    }
  }
}

function sendToAnalytics(metric: Metric) {
  // Send to analytics service (Google Analytics, etc)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Also send to Firestore for persistent tracking
  sendToFirestore(metric);
}

/**
 * Initialize Web Vitals tracking
 * Call this in _app.tsx or root layout
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onCLS(sendToAnalytics);
  onINP(sendToAnalytics); // Replaced FID (First Input Delay) with INP (Interaction to Next Paint)
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Get Web Vitals metrics manually
 */
export function getWebVitalsMetrics(): Promise<Metric[]> {
  return new Promise((resolve) => {
    const metrics: Metric[] = [];

    const collector = (metric: Metric) => {
      metrics.push(metric);
      if (metrics.length === 5) {
        resolve(metrics);
      }
    };

    onCLS(collector);
    onINP(collector);
    onFCP(collector);
    onLCP(collector);
    onTTFB(collector);

    // Timeout after 5 seconds
    setTimeout(() => resolve(metrics), 5000);
  });
}
