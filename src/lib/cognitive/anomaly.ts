/**
 * Statistical helpers for anomaly detection.
 * These functions are intentionally simple and dependency‑free.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export function zScore(value: number, m: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - m) / sd;
}

export function summarize(values: number[]): { mean: number; stdDev: number } {
  return { mean: mean(values), stdDev: stdDev(values) };
}

/**
 * Given a list of numeric values, return the indices of items beyond a z-threshold.
 */
export function detectIndicesBeyondThreshold(
  values: number[],
  threshold = 1.5
): { index: number; z: number; mean: number; stdDev: number }[] {
  if (values.length === 0) return [];
  const { mean: m, stdDev: sd } = summarize(values);
  return values
    .map((v, i) => ({ index: i, z: zScore(v, m, sd), mean: m, stdDev: sd }))
    .filter((e) => Math.abs(e.z) >= threshold);
}

