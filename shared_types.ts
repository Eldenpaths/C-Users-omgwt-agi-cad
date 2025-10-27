// packages/types/src/index.ts
// Shared types for AGI-CAD Phase 8

/**
 * AGI-CAD File Format v0.1
 */
export interface AgcFile {
  version: '0.1.0';
  encoding: 'crystal' | 'ifs';
  data: AgcData;
  metadata: AgcMetadata;
}

export interface AgcMetadata {
  modelName: string;
  originalSize: number;        // bytes
  compressedSize: number;       // bytes
  compressionRatio: number;     // originalSize / compressedSize
  processingTime: number;       // milliseconds
  createdAt: string;           // ISO timestamp
  userId?: string;
}

export type AgcData = CrystalData | IfsData;

/**
 * Crystalline Encoding
 */
export interface CrystalData {
  type: 'crystal';
  lattice: LatticeParams;
  unitCell: {
    shape: [number, number, number];
    compressed: string;          // base64 encoded zlib data
  };
  confidence: number;            // 0-1, periodicity measure
}

export interface LatticeParams {
  latticeType: 'cubic' | 'hexagonal' | 'tetragonal' | 'orthorhombic';
  vectors: [Vector3, Vector3, Vector3];  // a, b, c lattice vectors
  origin: Vector3;
}

export type Vector3 = [number, number, number];

/**
 * IFS Encoding
 */
export interface IfsData {
  type: 'ifs';
  transforms: IfsTransform[];
  iterations: number;
  boundingBox: {
    min: Vector3;
    max: Vector3;
  };
}

export interface IfsTransform {
  matrix: number[];              // 4x4 affine transform (16 floats)
  probability: number;           // weight for stochastic IFS
  color?: [number, number, number, number];  // RGBA
}

/**
 * Compression Job (Firestore)
 */
export interface CompressionJob {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  userId: string;
  inputFile: {
    name: string;
    size: number;
    storageUrl: string;          // gs://bucket/path
  };
  outputFile?: {
    name: string;
    size: number;
    storageUrl: string;
  };
  metadata?: AgcMetadata;
  error?: string;
  createdAt: number;             // Unix timestamp
  updatedAt: number;
  completedAt?: number;
}

/**
 * Telemetry Data (Firestore)
 */
export interface TelemetrySnapshot {
  userId: string;
  modelId: string;
  timestamp: number;
  metrics: RenderMetrics;
}

export interface RenderMetrics {
  fps: number;
  frameTime: number;             // ms
  gpuMemory?: number;            // MB
  shaderCompileTime?: number;    // ms
  voxelResolution: number;
  triangleCount?: number;
}

/**
 * WebGPU Pipeline State
 */
export interface GlyphPipeline {
  device: GPUDevice;
  pipeline: GPUComputePipeline;
  bindGroup: GPUBindGroup;
  outputBuffer: GPUBuffer;
  resolution: number;
}

/**
 * Camera State
 */
export interface CameraState {
  position: Vector3;
  target: Vector3;
  fov: number;
  near: number;
  far: number;
}

/**
 * Firebase Collections Schema
 */
export const COLLECTIONS = {
  COMPRESSION_JOBS: 'compressionJobs',
  TELEMETRY: 'telemetry',
  MODELS: 'models',
  USERS: 'users',
} as const;

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadResponse {
  jobId: string;
  uploadUrl: string;
}

export interface CompressionStatus {
  jobId: string;
  status: CompressionJob['status'];
  progress?: number;            // 0-100
  metadata?: AgcMetadata;
}

/**
 * Error Codes
 */
export enum ErrorCode {
  INVALID_FILE = 'INVALID_FILE',
  VOXEL_FAILED = 'VOXEL_FAILED',
  ENCODING_ERROR = 'ENCODING_ERROR',
  WEBGPU_UNSUPPORTED = 'WEBGPU_UNSUPPORTED',
  SHADER_COMPILE_ERROR = 'SHADER_COMPILE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
}

/**
 * SDF Shader Template
 */
export interface SdfShaderTemplate {
  encoding: AgcFile['encoding'];
  wgsl: string;
  uniforms: Record<string, number | number[]>;
}
