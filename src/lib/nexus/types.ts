// src/lib/nexus/types.ts
// Core types for Nexus layout system

/**
 * Position in 3D space [x, y, z]
 */
export type Position3D = [number, number, number];

/**
 * Rotation in 3D space (Euler angles) [x, y, z]
 */
export type Rotation3D = [number, number, number];

/**
 * Scale in 3D space [x, y, z]
 */
export type Scale3D = [number, number, number];

/**
 * Core node data structure
 */
export interface NexusNode {
  id: string;
  label: string;
  type: string;
  metadata?: Record<string, any>;
}

/**
 * Node position output from layout strategy
 */
export interface NodePosition {
  nodeId: string;
  position: Position3D;
  rotation: Rotation3D;
  scale: Scale3D;
}

/**
 * Layout strategy interface
 * All layout implementations must conform to this
 */
export interface LayoutStrategy {
  layout(nodes: NexusNode[]): NodePosition[];
}

/**
 * Available layout types
 */
export type LayoutType =
  | 'solar'
  | 'graph'
  | 'timeline'
  | 'hierarchy'
  | 'geo-spatial'
  | 'flowchart';

/**
 * Layout configuration
 */
export interface LayoutConfig {
  type: LayoutType;
  name: string;
  description: string;
  icon?: string;
}

/**
 * Layout metadata for UI
 */
export const LAYOUT_CONFIGS: Record<LayoutType, LayoutConfig> = {
  'solar': {
    type: 'solar',
    name: 'Solar',
    description: 'Circular orbit layout with central focus',
  },
  'graph': {
    type: 'graph',
    name: 'Graph',
    description: 'Force-directed network layout',
  },
  'timeline': {
    type: 'timeline',
    name: 'Timeline',
    description: 'Linear temporal progression',
  },
  'hierarchy': {
    type: 'hierarchy',
    name: 'Hierarchy',
    description: 'Tree-based hierarchical structure',
  },
  'geo-spatial': {
    type: 'geo-spatial',
    name: 'Geo-Spatial',
    description: 'Real-world coordinate mapping',
  },
  'flowchart': {
    type: 'flowchart',
    name: 'Flowchart',
    description: 'Sequential workflow with dependencies',
  },
};
