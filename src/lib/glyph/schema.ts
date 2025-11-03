/**
 * Phase 17B: Glyph Schema
 * Lab type definitions, ETS color coding system, SVG specifications, and animation state interfaces
 */

// ============================================================================
// Lab Type Definitions
// ============================================================================

export enum LabType {
  QUANTUM_LAB = 'QUANTUM_LAB',
  GENETICS_LAB = 'GENETICS_LAB',
  NEURAL_LAB = 'NEURAL_LAB',
  FUSION_LAB = 'FUSION_LAB',
  CRYPTO_LAB = 'CRYPTO_LAB',
  BIOTECH_LAB = 'BIOTECH_LAB',
  PHOTONICS_LAB = 'PHOTONICS_LAB',
  NANOTECH_LAB = 'NANOTECH_LAB',
  MATERIALS_LAB = 'MATERIALS_LAB',
  ROBOTICS_LAB = 'ROBOTICS_LAB',
  SYNTHESIS_LAB = 'SYNTHESIS_LAB',
  ANALYSIS_LAB = 'ANALYSIS_LAB',
  SIMULATION_LAB = 'SIMULATION_LAB',
  FABRICATION_LAB = 'FABRICATION_LAB',
  COGNITION_LAB = 'COGNITION_LAB',
  PLASMA_LAB = 'PLASMA_LAB',
  ASTRO_LAB = 'ASTRO_LAB',
  PARTICLE_LAB = 'PARTICLE_LAB',
  CLIMATE_LAB = 'CLIMATE_LAB',
  ENERGY_LAB = 'ENERGY_LAB',
}

// ============================================================================
// ETS Color Coding System
// ============================================================================

export interface ETSColorRange {
  min: number;
  max: number;
  color: string;
  label: 'critical' | 'warning' | 'optimal';
}

export const ETS_COLOR_RANGES: readonly ETSColorRange[] = [
  { min: 0, max: 30, color: '#FF4444', label: 'critical' },
  { min: 31, max: 60, color: '#FFAA00', label: 'warning' },
  { min: 61, max: 100, color: '#44FF44', label: 'optimal' },
] as const;

export function getETSColor(score: number): string {
  if (score <= 30) return '#FF4444';
  if (score <= 60) return '#FFAA00';
  return '#44FF44';
}

export function getETSLabel(score: number): 'critical' | 'warning' | 'optimal' {
  if (score <= 30) return 'critical';
  if (score <= 60) return 'warning';
  return 'optimal';
}

// ============================================================================
// SVG Path Specifications
// ============================================================================

export interface SVGPathSpec {
  path: string;
  viewBox: string;
  strokeWidth: number;
  fillable: boolean;
}

export const LAB_SVG_PATHS: Record<LabType, SVGPathSpec> = {
  [LabType.QUANTUM_LAB]: {
    path: 'M50,10 L90,30 L90,70 L50,90 L10,70 L10,30 Z M50,30 L70,40 L70,60 L50,70 L30,60 L30,40 Z',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.GENETICS_LAB]: {
    path: 'M30,20 Q50,10 70,20 Q80,50 70,80 Q50,90 30,80 Q20,50 30,20 M40,35 L60,35 M40,50 L60,50 M40,65 L60,65',
    viewBox: '0 0 100 100',
    strokeWidth: 2.5,
    fillable: true,
  },
  [LabType.NEURAL_LAB]: {
    path: 'M50,20 L60,40 M50,20 L40,40 M50,20 L50,40 M30,50 L70,50 M40,40 L30,50 M60,40 L70,50 M30,50 L40,70 M70,50 L60,70 M50,40 L50,80',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: false,
  },
  [LabType.FUSION_LAB]: {
    path: 'M50,50 m-35,0 a35,35 0 1,0 70,0 a35,35 0 1,0 -70,0 M50,20 L50,80 M20,50 L80,50 M30,30 L70,70 M70,30 L30,70',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: false,
  },
  [LabType.CRYPTO_LAB]: {
    path: 'M30,40 L70,40 L70,80 L30,80 Z M40,40 L40,30 A10,10 0 0,1 60,30 L60,40 M50,55 L50,65',
    viewBox: '0 0 100 100',
    strokeWidth: 2.5,
    fillable: true,
  },
  [LabType.BIOTECH_LAB]: {
    path: 'M50,15 L55,35 L75,35 L60,47 L65,67 L50,55 L35,67 L40,47 L25,35 L45,35 Z',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.PHOTONICS_LAB]: {
    path: 'M20,50 L35,50 M65,50 L80,50 M50,20 L50,35 M50,65 L50,80 M30,30 L40,40 M60,60 L70,70 M70,30 L60,40 M40,60 L30,70 M50,50 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: false,
  },
  [LabType.NANOTECH_LAB]: {
    path: 'M50,20 L65,35 L65,50 L50,65 L35,50 L35,35 Z M50,35 L56,41 L56,50 L50,56 L44,50 L44,41 Z M50,44 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0',
    viewBox: '0 0 100 100',
    strokeWidth: 1.5,
    fillable: true,
  },
  [LabType.MATERIALS_LAB]: {
    path: 'M25,25 L75,25 L75,75 L25,75 Z M25,50 L75,50 M50,25 L50,75 M35,35 L45,45 M55,35 L65,45 M35,55 L45,65 M55,55 L65,65',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: false,
  },
  [LabType.ROBOTICS_LAB]: {
    path: 'M35,30 L65,30 L65,50 L70,50 L70,70 L60,70 L60,80 L55,80 L55,70 L45,70 L45,80 L40,80 L40,70 L30,70 L30,50 L35,50 Z M42,40 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M58,40 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.SYNTHESIS_LAB]: {
    path: 'M50,15 L35,40 L45,40 L45,60 L30,60 L30,75 L70,75 L70,60 L55,60 L55,40 L65,40 Z',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.ANALYSIS_LAB]: {
    path: 'M30,70 L30,30 L70,30 M25,40 L30,40 M25,50 L30,50 M25,60 L30,60 M40,75 L40,70 M50,75 L50,70 M60,75 L60,70 M70,60 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M80,70 L90,80',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: false,
  },
  [LabType.SIMULATION_LAB]: {
    path: 'M20,30 L50,15 L80,30 L80,70 L50,85 L20,70 Z M35,40 L65,40 M30,50 L70,50 M35,60 L65,60',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.FABRICATION_LAB]: {
    path: 'M25,35 L75,35 L75,40 L25,40 Z M30,40 L30,70 M45,40 L45,70 M55,40 L55,70 M70,40 L70,70 M25,70 L75,70',
    viewBox: '0 0 100 100',
    strokeWidth: 2.5,
    fillable: true,
  },
  [LabType.COGNITION_LAB]: {
    path: 'M50,20 Q70,20 80,35 Q85,50 80,65 Q70,80 50,80 Q30,80 20,65 Q15,50 20,35 Q30,20 50,20 M35,40 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M65,40 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M35,60 Q50,70 65,60',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.PLASMA_LAB]: {
    path: 'M50,50 m-30,0 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0 M35,35 Q45,45 50,40 T65,35 M35,65 Q45,55 50,60 T65,65',
    viewBox: '0 0 100 100',
    strokeWidth: 2.5,
    fillable: false,
  },
  [LabType.ASTRO_LAB]: {
    path: 'M50,15 L55,40 L80,40 L60,55 L68,80 L50,65 L32,80 L40,55 L20,40 L45,40 Z M50,50 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.PARTICLE_LAB]: {
    path: 'M50,50 m-35,0 a35,35 0 1,0 70,0 a35,35 0 1,0 -70,0 M30,30 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M70,30 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M30,70 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M70,70 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M50,50 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0',
    viewBox: '0 0 100 100',
    strokeWidth: 1.5,
    fillable: false,
  },
  [LabType.CLIMATE_LAB]: {
    path: 'M50,20 L45,35 L30,35 L40,45 L35,60 L50,50 L65,60 L60,45 L70,35 L55,35 Z M50,65 Q40,75 30,75 Q25,75 25,70 M50,65 Q60,75 70,75 Q75,75 75,70',
    viewBox: '0 0 100 100',
    strokeWidth: 2,
    fillable: true,
  },
  [LabType.ENERGY_LAB]: {
    path: 'M55,20 L40,50 L50,50 L35,80 L60,45 L48,45 L65,20 Z',
    viewBox: '0 0 100 100',
    strokeWidth: 2.5,
    fillable: true,
  },
};

// ============================================================================
// Animation State Interfaces
// ============================================================================

export enum GlyphState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  CRITICAL = 'CRITICAL',
  TRANSITIONING = 'TRANSITIONING',
}

export interface AnimationState {
  state: GlyphState;
  progress: number; // 0-1
  timestamp: number;
}

export interface GlyphTransition {
  from: GlyphState;
  to: GlyphState;
  duration: number; // milliseconds
  startTime: number;
}

export interface GlyphMetrics {
  etsScore: number;
  temperature: number; // 0-1 normalized
  entropy: number; // Shannon entropy
  swarmDensity: number; // agents per unit area
  fidelity: number; // 0-1 normalized
}

export interface GlyphData {
  id: string;
  labType: LabType;
  position: { x: number; y: number; z: number };
  state: AnimationState;
  metrics: GlyphMetrics;
  transition: GlyphTransition | null;
  hovered: boolean;
  lastUpdate: number;
}

export interface GlyphVisualConfig {
  scale: number;
  rotation: number; // radians
  opacity: number;
  glowIntensity: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export interface HoverState {
  glyphId: string | null;
  position: { x: number; y: number } | null;
  timestamp: number;
}

// ============================================================================
// Lab Configuration
// ============================================================================

export interface LabConfig {
  type: LabType;
  name: string;
  description: string;
  baseColor: string;
  capabilities: string[];
  maxAgents: number;
  thermalCapacity: number;
}

export const LAB_CONFIGS: Record<LabType, LabConfig> = {
  [LabType.QUANTUM_LAB]: {
    type: LabType.QUANTUM_LAB,
    name: 'Quantum Laboratory',
    description: 'Quantum computing and superposition experiments',
    baseColor: '#8B5CF6',
    capabilities: ['quantum_entanglement', 'superposition', 'quantum_tunneling'],
    maxAgents: 5000,
    thermalCapacity: 0.8,
  },
  [LabType.GENETICS_LAB]: {
    type: LabType.GENETICS_LAB,
    name: 'Genetics Laboratory',
    description: 'DNA sequencing and genetic engineering',
    baseColor: '#10B981',
    capabilities: ['gene_editing', 'sequencing', 'cloning'],
    maxAgents: 8000,
    thermalCapacity: 0.6,
  },
  [LabType.NEURAL_LAB]: {
    type: LabType.NEURAL_LAB,
    name: 'Neural Laboratory',
    description: 'Neural network training and optimization',
    baseColor: '#F59E0B',
    capabilities: ['deep_learning', 'neural_architecture', 'training'],
    maxAgents: 12000,
    thermalCapacity: 0.9,
  },
  [LabType.FUSION_LAB]: {
    type: LabType.FUSION_LAB,
    name: 'Fusion Laboratory',
    description: 'Nuclear fusion and plasma containment',
    baseColor: '#EF4444',
    capabilities: ['fusion_reaction', 'plasma_control', 'energy_extraction'],
    maxAgents: 3000,
    thermalCapacity: 1.0,
  },
  [LabType.CRYPTO_LAB]: {
    type: LabType.CRYPTO_LAB,
    name: 'Cryptography Laboratory',
    description: 'Encryption, decryption, and security protocols',
    baseColor: '#6366F1',
    capabilities: ['encryption', 'key_generation', 'hash_functions'],
    maxAgents: 6000,
    thermalCapacity: 0.5,
  },
  [LabType.BIOTECH_LAB]: {
    type: LabType.BIOTECH_LAB,
    name: 'Biotechnology Laboratory',
    description: 'Biological systems and synthetic biology',
    baseColor: '#14B8A6',
    capabilities: ['biofabrication', 'fermentation', 'protein_synthesis'],
    maxAgents: 7000,
    thermalCapacity: 0.6,
  },
  [LabType.PHOTONICS_LAB]: {
    type: LabType.PHOTONICS_LAB,
    name: 'Photonics Laboratory',
    description: 'Light manipulation and optical computing',
    baseColor: '#FBBF24',
    capabilities: ['laser_systems', 'optical_computing', 'light_modulation'],
    maxAgents: 5500,
    thermalCapacity: 0.7,
  },
  [LabType.NANOTECH_LAB]: {
    type: LabType.NANOTECH_LAB,
    name: 'Nanotechnology Laboratory',
    description: 'Molecular assembly and nanoscale engineering',
    baseColor: '#A78BFA',
    capabilities: ['molecular_assembly', 'nanofabrication', 'atomic_manipulation'],
    maxAgents: 15000,
    thermalCapacity: 0.4,
  },
  [LabType.MATERIALS_LAB]: {
    type: LabType.MATERIALS_LAB,
    name: 'Materials Laboratory',
    description: 'Material synthesis and testing',
    baseColor: '#94A3B8',
    capabilities: ['material_synthesis', 'stress_testing', 'composite_design'],
    maxAgents: 9000,
    thermalCapacity: 0.7,
  },
  [LabType.ROBOTICS_LAB]: {
    type: LabType.ROBOTICS_LAB,
    name: 'Robotics Laboratory',
    description: 'Robot design and autonomous systems',
    baseColor: '#64748B',
    capabilities: ['robot_assembly', 'motion_planning', 'sensor_fusion'],
    maxAgents: 6500,
    thermalCapacity: 0.6,
  },
  [LabType.SYNTHESIS_LAB]: {
    type: LabType.SYNTHESIS_LAB,
    name: 'Synthesis Laboratory',
    description: 'Chemical synthesis and compound creation',
    baseColor: '#06B6D4',
    capabilities: ['chemical_synthesis', 'purification', 'analysis'],
    maxAgents: 7500,
    thermalCapacity: 0.8,
  },
  [LabType.ANALYSIS_LAB]: {
    type: LabType.ANALYSIS_LAB,
    name: 'Analysis Laboratory',
    description: 'Data analysis and pattern recognition',
    baseColor: '#3B82F6',
    capabilities: ['data_analysis', 'pattern_recognition', 'visualization'],
    maxAgents: 10000,
    thermalCapacity: 0.5,
  },
  [LabType.SIMULATION_LAB]: {
    type: LabType.SIMULATION_LAB,
    name: 'Simulation Laboratory',
    description: 'Complex system simulation and modeling',
    baseColor: '#8B5CF6',
    capabilities: ['simulation', 'modeling', 'prediction'],
    maxAgents: 11000,
    thermalCapacity: 0.9,
  },
  [LabType.FABRICATION_LAB]: {
    type: LabType.FABRICATION_LAB,
    name: 'Fabrication Laboratory',
    description: 'Manufacturing and prototyping',
    baseColor: '#F97316',
    capabilities: ['3d_printing', 'cnc_machining', 'assembly'],
    maxAgents: 5000,
    thermalCapacity: 0.7,
  },
  [LabType.COGNITION_LAB]: {
    type: LabType.COGNITION_LAB,
    name: 'Cognition Laboratory',
    description: 'Cognitive systems and consciousness research',
    baseColor: '#EC4899',
    capabilities: ['consciousness_modeling', 'cognitive_simulation', 'attention_systems'],
    maxAgents: 8500,
    thermalCapacity: 0.6,
  },
  [LabType.PLASMA_LAB]: {
    type: LabType.PLASMA_LAB,
    name: 'Plasma Laboratory',
    description: 'Plasma physics and ionized gas research',
    baseColor: '#F43F5E',
    capabilities: ['plasma_generation', 'ion_acceleration', 'field_manipulation'],
    maxAgents: 4000,
    thermalCapacity: 1.0,
  },
  [LabType.ASTRO_LAB]: {
    type: LabType.ASTRO_LAB,
    name: 'Astrophysics Laboratory',
    description: 'Astronomical observation and cosmic phenomena',
    baseColor: '#1E293B',
    capabilities: ['observation', 'spectroscopy', 'cosmology'],
    maxAgents: 6000,
    thermalCapacity: 0.3,
  },
  [LabType.PARTICLE_LAB]: {
    type: LabType.PARTICLE_LAB,
    name: 'Particle Physics Laboratory',
    description: 'Particle acceleration and collision experiments',
    baseColor: '#7C3AED',
    capabilities: ['particle_acceleration', 'collision_detection', 'decay_analysis'],
    maxAgents: 4500,
    thermalCapacity: 0.9,
  },
  [LabType.CLIMATE_LAB]: {
    type: LabType.CLIMATE_LAB,
    name: 'Climate Laboratory',
    description: 'Climate modeling and environmental systems',
    baseColor: '#059669',
    capabilities: ['climate_modeling', 'weather_prediction', 'carbon_analysis'],
    maxAgents: 13000,
    thermalCapacity: 0.5,
  },
  [LabType.ENERGY_LAB]: {
    type: LabType.ENERGY_LAB,
    name: 'Energy Laboratory',
    description: 'Energy generation and storage research',
    baseColor: '#FBBF24',
    capabilities: ['energy_generation', 'storage', 'conversion'],
    maxAgents: 7000,
    thermalCapacity: 0.8,
  },
};

// ============================================================================
// Type Guards and Utilities
// ============================================================================

export function isValidLabType(type: string): type is LabType {
  return Object.values(LabType).includes(type as LabType);
}

export function isValidETSScore(score: number): boolean {
  return score >= 0 && score <= 100;
}

export function normalizeMetric(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Nexus Visualizer Types
// ============================================================================

export type LabId = LabType;
export type LabDomain = string;

export interface GlyphNode {
  id: LabId;
  labType: LabType;
  position?: { x: number; y: number; z: number };
  config: LabConfig;
  state?: GlyphState;
  metrics?: GlyphMetrics;
}

export function getAllLabs(): GlyphNode[] {
  return Object.entries(LAB_CONFIGS).map(([labType, config]) => ({
    id: labType as LabId,
    labType: labType as LabType,
    config,
    state: GlyphState.IDLE,
  }));
}
