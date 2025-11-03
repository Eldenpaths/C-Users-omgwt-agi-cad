/**
 * Phase 17B: Animation Specifications
 * Timing functions, state transition rules, hover behaviors, and canvas rendering configurations
 */

import * as THREE from "three";
import { GlyphState } from './schema';

// ============================================================================
// Legacy Animation Functions (preserved for compatibility)
// ============================================================================

export const getPulseScale = (latency: number, t: number) =>
  1 + Math.sin(t * 2) * latency * 0.3;

export const getWarpRotation = (risk: number, t: number) =>
  t * (0.5 + risk * 2);

export const getDriftOffset = (complexity: number, t: number) =>
  new THREE.Vector3(
    Math.sin(t + complexity) * 0.1,
    Math.cos(t * 1.3 + complexity) * 0.1,
    0
  );

// ============================================================================
// Timing Functions (Easing)
// ============================================================================

export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number): number => t,

  easeIn: (t: number): number => t * t,

  easeOut: (t: number): number => t * (2 - t),

  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number): number => t * t * t,

  easeOutCubic: (t: number): number => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },

  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  elastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },

  bounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    } else if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    } else {
      const t2 = t - 2.625 / 2.75;
      return 7.5625 * t2 * t2 + 0.984375;
    }
  },
} as const;

// ============================================================================
// State Transition Rules
// ============================================================================

export interface TransitionRule {
  from: GlyphState;
  to: GlyphState;
  duration: number; // milliseconds
  easing: EasingFunction;
  trigger?: 'manual' | 'automatic' | 'threshold';
  conditions?: {
    etsMin?: number;
    etsMax?: number;
    temperatureMin?: number;
    temperatureMax?: number;
    entropyMin?: number;
    entropyMax?: number;
  };
}

export const STATE_TRANSITIONS: readonly TransitionRule[] = [
  // IDLE → ACTIVE
  {
    from: GlyphState.IDLE,
    to: GlyphState.ACTIVE,
    duration: 800,
    easing: Easing.easeInOut,
    trigger: 'automatic',
    conditions: {
      etsMin: 31,
    },
  },

  // IDLE → CRITICAL
  {
    from: GlyphState.IDLE,
    to: GlyphState.CRITICAL,
    duration: 500,
    easing: Easing.easeIn,
    trigger: 'automatic',
    conditions: {
      etsMax: 30,
    },
  },

  // ACTIVE → IDLE
  {
    from: GlyphState.ACTIVE,
    to: GlyphState.IDLE,
    duration: 1200,
    easing: Easing.easeOut,
    trigger: 'automatic',
    conditions: {
      etsMin: 61,
    },
  },

  // ACTIVE → CRITICAL
  {
    from: GlyphState.ACTIVE,
    to: GlyphState.CRITICAL,
    duration: 600,
    easing: Easing.easeIn,
    trigger: 'automatic',
    conditions: {
      etsMax: 30,
    },
  },

  // CRITICAL → ACTIVE
  {
    from: GlyphState.CRITICAL,
    to: GlyphState.ACTIVE,
    duration: 1000,
    easing: Easing.elastic,
    trigger: 'automatic',
    conditions: {
      etsMin: 31,
      etsMax: 60,
    },
  },

  // CRITICAL → IDLE
  {
    from: GlyphState.CRITICAL,
    to: GlyphState.IDLE,
    duration: 1500,
    easing: Easing.easeOutCubic,
    trigger: 'automatic',
    conditions: {
      etsMin: 61,
    },
  },
] as const;

export function findTransitionRule(from: GlyphState, to: GlyphState): TransitionRule | null {
  return STATE_TRANSITIONS.find(rule => rule.from === from && rule.to === to) || null;
}

export function getDefaultTransition(from: GlyphState, to: GlyphState): TransitionRule {
  return {
    from,
    to,
    duration: 1000,
    easing: Easing.easeInOut,
    trigger: 'manual',
  };
}

// ============================================================================
// Animation Parameters by State
// ============================================================================

export interface StateAnimationParams {
  scale: number;
  rotationSpeed: number; // radians per second
  pulseFrequency: number; // Hz
  pulseAmplitude: number;
  glowIntensity: number;
  opacity: number;
  strokeWidth: number;
}

export const STATE_ANIMATION_PARAMS: Record<GlyphState, StateAnimationParams> = {
  [GlyphState.IDLE]: {
    scale: 1.0,
    rotationSpeed: 0.1,
    pulseFrequency: 0.5,
    pulseAmplitude: 0.05,
    glowIntensity: 0.3,
    opacity: 0.7,
    strokeWidth: 1.0,
  },

  [GlyphState.ACTIVE]: {
    scale: 1.1,
    rotationSpeed: 0.3,
    pulseFrequency: 1.0,
    pulseAmplitude: 0.1,
    glowIntensity: 0.6,
    opacity: 0.9,
    strokeWidth: 1.2,
  },

  [GlyphState.CRITICAL]: {
    scale: 1.2,
    rotationSpeed: 0.5,
    pulseFrequency: 2.0,
    pulseAmplitude: 0.2,
    glowIntensity: 1.0,
    opacity: 1.0,
    strokeWidth: 1.5,
  },

  [GlyphState.TRANSITIONING]: {
    scale: 1.05,
    rotationSpeed: 0.2,
    pulseFrequency: 0.75,
    pulseAmplitude: 0.08,
    glowIntensity: 0.5,
    opacity: 0.85,
    strokeWidth: 1.1,
  },
};

// ============================================================================
// Hover Behaviors
// ============================================================================

export interface HoverEffect {
  scaleMultiplier: number;
  glowBoost: number;
  opacityBoost: number;
  transitionDuration: number; // milliseconds
  easing: EasingFunction;
}

export const HOVER_EFFECT: HoverEffect = {
  scaleMultiplier: 1.15,
  glowBoost: 0.3,
  opacityBoost: 0.1,
  transitionDuration: 200,
  easing: Easing.easeOut,
};

export interface HoverAnimationState {
  isHovered: boolean;
  progress: number; // 0-1
  startTime: number;
}

export function updateHoverAnimation(
  state: HoverAnimationState,
  currentTime: number
): HoverAnimationState {
  const elapsed = currentTime - state.startTime;
  const progress = Math.min(1, elapsed / HOVER_EFFECT.transitionDuration);
  const easedProgress = HOVER_EFFECT.easing(progress);

  return {
    ...state,
    progress: state.isHovered ? easedProgress : 1 - easedProgress,
  };
}

export function applyHoverEffect(
  baseParams: StateAnimationParams,
  hoverState: HoverAnimationState
): StateAnimationParams {
  const t = hoverState.progress;

  return {
    ...baseParams,
    scale: baseParams.scale * (1 + (HOVER_EFFECT.scaleMultiplier - 1) * t),
    glowIntensity: Math.min(1, baseParams.glowIntensity + HOVER_EFFECT.glowBoost * t),
    opacity: Math.min(1, baseParams.opacity + HOVER_EFFECT.opacityBoost * t),
  };
}

// ============================================================================
// Canvas Rendering Configurations
// ============================================================================

export interface CanvasRenderConfig {
  width: number;
  height: number;
  pixelRatio: number;
  antialias: boolean;
  alpha: boolean;
  clearColor: string;
  clearAlpha: number;
}

export const DEFAULT_CANVAS_CONFIG: CanvasRenderConfig = {
  width: 1920,
  height: 1080,
  pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  antialias: true,
  alpha: true,
  clearColor: '#000000',
  clearAlpha: 0,
};

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: new THREE.Vector3(0, 0, 50),
  lookAt: new THREE.Vector3(0, 0, 0),
};

export interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: THREE.Vector3;
  };
  point: {
    color: string;
    intensity: number;
    position: THREE.Vector3;
    distance: number;
    decay: number;
  };
}

export const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    color: '#ffffff',
    intensity: 0.5,
  },
  directional: {
    color: '#ffffff',
    intensity: 0.8,
    position: new THREE.Vector3(10, 10, 10),
  },
  point: {
    color: '#ffffff',
    intensity: 1.0,
    position: new THREE.Vector3(0, 0, 30),
    distance: 100,
    decay: 2,
  },
};

// ============================================================================
// Performance Optimization
// ============================================================================

export interface PerformanceConfig {
  maxGlyphs: number;
  cullingDistance: number;
  lodLevels: number;
  updateFrequency: number; // Hz
  batchSize: number;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  maxGlyphs: 20,
  cullingDistance: 100,
  lodLevels: 3,
  updateFrequency: 60,
  batchSize: 5,
};

// ============================================================================
// Animation Clock and Timing
// ============================================================================

export class AnimationClock {
  private startTime: number;
  private pausedTime: number;
  private isPaused: boolean;
  private timeScale: number;

  constructor() {
    this.startTime = performance.now();
    this.pausedTime = 0;
    this.isPaused = false;
    this.timeScale = 1.0;
  }

  getElapsedTime(): number {
    if (this.isPaused) {
      return this.pausedTime;
    }
    return (performance.now() - this.startTime) * this.timeScale;
  }

  getDeltaTime(lastTime: number): number {
    return this.getElapsedTime() - lastTime;
  }

  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedTime();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.startTime = performance.now() - this.pausedTime / this.timeScale;
      this.isPaused = false;
    }
  }

  setTimeScale(scale: number): void {
    const currentTime = this.getElapsedTime();
    this.timeScale = Math.max(0.1, Math.min(10, scale));
    this.startTime = performance.now() - currentTime / this.timeScale;
  }

  reset(): void {
    this.startTime = performance.now();
    this.pausedTime = 0;
    this.isPaused = false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function interpolate(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function interpolateColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  if (!fromRgb || !toRgb) return from;

  const r = Math.round(interpolate(fromRgb.r, toRgb.r, t));
  const g = Math.round(interpolate(fromRgb.g, toRgb.g, t));
  const b = Math.round(interpolate(fromRgb.b, toRgb.b, t));

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
