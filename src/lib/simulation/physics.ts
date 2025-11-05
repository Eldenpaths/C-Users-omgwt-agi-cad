/**
 * Shared physics/markets helpers for lightweight simulation dynamics.
 * These are intentionally simple and deterministic-ish for demo purposes.
 */

/** Convert Kelvin to keV (very rough toy scaling). */
export function kelvinToKeV(kelvin: number): number {
  return kelvin / 1.160e7;
}

/** Logistic function helper. */
export function logistic(x: number, k = 1, x0 = 0): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

/** Bounded drift with mean reversion. */
export function meanRevertingDrift(
  value: number,
  target: number,
  dt: number,
  speed = 0.1,
  noise = 0.02,
  min?: number,
  max?: number
): number {
  const revert = value + (target - value) * speed * (dt / 1000);
  const n = (Math.random() - 0.5) * noise * value;
  let next = revert + n;
  if (typeof min === 'number') next = Math.max(min, next);
  if (typeof max === 'number') next = Math.min(max, next);
  return next;
}

/** Simple oscillator for optics or periodic behaviors. */
export function oscillator(t: number, amplitude = 1, periodMs = 2000): number {
  const phase = (t % periodMs) / periodMs; // 0..1
  return amplitude * Math.sin(phase * Math.PI * 2);
}

/** Finance toy drift (geometric-like). */
export function geometricToyDrift(value: number, dt: number, mu = 0.0005, sigma = 0.01): number {
  const drift = mu * (dt / 1000);
  const shock = sigma * (Math.random() - 0.5) * Math.sqrt(dt / 1000);
  return Math.max(-100, value * (1 + drift + shock));
}

