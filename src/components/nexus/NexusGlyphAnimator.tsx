/**
 * Phase 17B: Nexus Glyph Animator
 * React Three Fiber component for rendering all 20 lab glyphs with state transitions and hover effects
 */

'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
  LabType,
  LAB_SVG_PATHS,
  LAB_CONFIGS,
  GlyphState,
  GlyphData,
  GlyphMetrics,
  getETSColor,
} from '@/lib/glyph/schema';
import {
  STATE_ANIMATION_PARAMS,
  HOVER_EFFECT,
  Easing,
  findTransitionRule,
  AnimationClock,
} from '@/lib/glyph/animSpec';
import { LayoutType, NexusNode } from '@/lib/nexus/types';
import GeoSpatialLayout from '@/lib/nexus/layouts/geo-spatial';
import FlowchartLayout from '@/lib/nexus/layouts/flowchart';

// ============================================================================
// Layout Data Generators
// ============================================================================

/**
 * Elden Paths world map locations (10 nodes)
 */
const ELDEN_PATHS_LOCATIONS = [
  { id: 'ironforge', label: 'Ironforge Citadel', geoPosition: [15, 3, 22] as [number, number, number] },
  { id: 'elderwood', label: 'Elderwood Forest', geoPosition: [8, 0.5, 15] as [number, number, number] },
  { id: 'stormkeep', label: 'Storm Keep', geoPosition: [20, 5, 18] as [number, number, number] },
  { id: 'crystalcave', label: 'Crystal Caverns', geoPosition: [5, -2, 10] as [number, number, number] },
  { id: 'volcano', label: 'Ember Volcano', geoPosition: [25, 8, 25] as [number, number, number] },
  { id: 'frostpeak', label: 'Frostpeak Mountain', geoPosition: [12, 10, 5] as [number, number, number] },
  { id: 'shadowmarsh', label: 'Shadow Marsh', geoPosition: [3, -1, 20] as [number, number, number] },
  { id: 'suntemple', label: 'Temple of Sun', geoPosition: [18, 2, 8] as [number, number, number] },
  { id: 'voidrift', label: 'Void Rift', geoPosition: [10, 15, 30] as [number, number, number] },
  { id: 'seaport', label: 'Azure Seaport', geoPosition: [0, 0, 12] as [number, number, number] },
];

/**
 * Plasma Lab experiment workflow (5 steps)
 */
const PLASMA_LAB_WORKFLOW = [
  { id: 'prepare', label: 'Prepare Sample', state: 'completed' as const, dependencies: [] },
  { id: 'heat', label: 'Heat to 1000°C', state: 'completed' as const, dependencies: ['prepare'] },
  { id: 'ionize', label: 'Ionize Gas', state: 'active' as const, dependencies: ['heat'] },
  { id: 'measure', label: 'Measure Output', state: 'pending' as const, dependencies: ['ionize'] },
  { id: 'analyze', label: 'Analyze Results', state: 'pending' as const, dependencies: ['measure'] },
];

/**
 * Generate glyphs positioned according to the selected layout
 */
function generateGlyphsForLayout(labTypes: LabType[], layout: LayoutType): GlyphData[] {
  switch (layout) {
    case 'geo-spatial':
      return generateGeoSpatialGlyphs(labTypes);
    case 'flowchart':
      return generateFlowchartGlyphs(labTypes);
    case 'solar':
      return generateSolarGlyphs(labTypes);
    case 'graph':
      return generateGraphGlyphs(labTypes);
    case 'timeline':
      return generateTimelineGlyphs(labTypes);
    case 'hierarchy':
      return generateHierarchyGlyphs(labTypes);
    default:
      return generateSolarGlyphs(labTypes);
  }
}

/**
 * Geo-Spatial Layout: Elden Paths world map
 */
function generateGeoSpatialGlyphs(labTypes: LabType[]): GlyphData[] {
  const geoLayout = new GeoSpatialLayout({
    scale: 1.0,
    yAxisMode: 'elevation',
  });

  // Create nodes with geo-spatial metadata
  const nodes: NexusNode[] = labTypes.slice(0, 10).map((labType, index) => {
    const location = ELDEN_PATHS_LOCATIONS[index % ELDEN_PATHS_LOCATIONS.length];
    return {
      id: `glyph-${index}`,
      label: LAB_CONFIGS[labType].name,
      type: 'lab',
      metadata: {
        geoPosition: location.geoPosition,
      },
    };
  });

  const positions = geoLayout.layout(nodes);

  return labTypes.map((labType, index) => {
    const position = positions[index % positions.length];
    return createGlyphData(
      labType,
      index,
      position.position[0],
      position.position[1],
      position.position[2]
    );
  });
}

/**
 * Flowchart Layout: Plasma Lab workflow
 */
function generateFlowchartGlyphs(labTypes: LabType[]): GlyphData[] {
  const flowLayout = new FlowchartLayout({
    direction: 'vertical',
    rankSpacing: 20,
    laneSpacing: 15,
    highlightActive: true,
  });

  // Create nodes with flowchart metadata
  const nodes: NexusNode[] = labTypes.slice(0, 5).map((labType, index) => {
    const step = PLASMA_LAB_WORKFLOW[index % PLASMA_LAB_WORKFLOW.length];
    return {
      id: `glyph-${index}`,
      label: step.label,
      type: 'flow_step',
      metadata: {
        dependencies: step.dependencies,
        state: step.state,
      },
    };
  });

  const positions = flowLayout.layout(nodes);

  return labTypes.map((labType, index) => {
    const position = positions[index % positions.length];
    const step = PLASMA_LAB_WORKFLOW[index % PLASMA_LAB_WORKFLOW.length];

    return createGlyphData(
      labType,
      index,
      position.position[0],
      position.position[1],
      position.position[2],
      step.state === 'active' ? GlyphState.ACTIVE : GlyphState.IDLE
    );
  });
}

/**
 * Solar Layout: Circular orbit with central focus
 */
function generateSolarGlyphs(labTypes: LabType[]): GlyphData[] {
  const radius = 30;
  const angleStep = (Math.PI * 2) / labTypes.length;

  return labTypes.map((labType, index) => {
    const angle = index * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(index * 0.5) * 5; // Add some vertical variation
    return createGlyphData(labType, index, x, y, z);
  });
}

/**
 * Graph Layout: Force-directed network
 */
function generateGraphGlyphs(labTypes: LabType[]): GlyphData[] {
  const gridSize = Math.ceil(Math.sqrt(labTypes.length));
  const spacing = 15;
  const offset = (gridSize * spacing) / 2;

  return labTypes.map((labType, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = col * spacing - offset + (Math.random() - 0.5) * 5;
    const y = row * spacing - offset + (Math.random() - 0.5) * 5;
    const z = (Math.random() - 0.5) * 10;
    return createGlyphData(labType, index, x, y, z);
  });
}

/**
 * Timeline Layout: Linear temporal progression
 */
function generateTimelineGlyphs(labTypes: LabType[]): GlyphData[] {
  const spacing = 40 / labTypes.length;

  return labTypes.map((labType, index) => {
    const x = (index - labTypes.length / 2) * spacing;
    const y = Math.sin(index * 0.3) * 3;
    const z = 0;
    return createGlyphData(labType, index, x, y, z);
  });
}

/**
 * Hierarchy Layout: Tree structure
 */
function generateHierarchyGlyphs(labTypes: LabType[]): GlyphData[] {
  const levels = Math.ceil(Math.log2(labTypes.length + 1));

  return labTypes.map((labType, index) => {
    const level = Math.floor(Math.log2(index + 1));
    const posInLevel = index - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);

    const x = (posInLevel - nodesInLevel / 2) * (40 / nodesInLevel);
    const y = level * -15;
    const z = 0;
    return createGlyphData(labType, index, x, y, z);
  });
}

/**
 * Helper to create a GlyphData object
 */
function createGlyphData(
  labType: LabType,
  index: number,
  x: number,
  y: number,
  z: number,
  state: GlyphState = GlyphState.IDLE
): GlyphData {
  return {
    id: `glyph-${index}`,
    labType,
    position: { x, y, z },
    state: {
      state,
      progress: 0,
      timestamp: Date.now(),
    },
    metrics: {
      etsScore: 50 + Math.random() * 30,
      temperature: Math.random(),
      entropy: Math.random() * 5,
      swarmDensity: Math.random(),
      fidelity: 0.8 + Math.random() * 0.2,
    },
    transition: null,
    hovered: false,
    lastUpdate: Date.now(),
  };
}

// ============================================================================
// SVG Path to Three.js Shape Conversion
// ============================================================================

function svgPathToShape(pathString: string): THREE.Shape {
  const shape = new THREE.Shape();
  const commands = pathString.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

  let currentX = 0;
  let currentY = 0;

  for (const command of commands) {
    const type = command[0];
    const params = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    switch (type) {
      case 'M': // Move to
        currentX = params[0];
        currentY = params[1];
        shape.moveTo(currentX, currentY);
        break;

      case 'L': // Line to
        currentX = params[0];
        currentY = params[1];
        shape.lineTo(currentX, currentY);
        break;

      case 'Q': // Quadratic curve
        shape.quadraticCurveTo(params[0], params[1], params[2], params[3]);
        currentX = params[2];
        currentY = params[3];
        break;

      case 'A': // Arc (simplified)
        // Arc parameters: rx ry x-axis-rotation large-arc-flag sweep-flag x y
        const endX = params[5];
        const endY = params[6];
        shape.lineTo(endX, endY);
        currentX = endX;
        currentY = endY;
        break;

      case 'Z': // Close path
        shape.closePath();
        break;

      default:
        // Handle other SVG commands as needed
        break;
    }
  }

  return shape;
}

// ============================================================================
// Individual Glyph Component
// ============================================================================

interface GlyphProps {
  data: GlyphData;
  onHover: (glyphId: string | null) => void;
}

function Glyph({ data, onHover }: GlyphProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [localHovered, setLocalHovered] = useState(false);

  const svgSpec = LAB_SVG_PATHS[data.labType];
  const labConfig = LAB_CONFIGS[data.labType];

  // Create geometry from SVG path
  const geometry = useMemo(() => {
    const shape = svgPathToShape(svgSpec.path);
    const extrudeSettings = {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [svgSpec.path]);

  // Center the geometry
  useMemo(() => {
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(0.1, 0.1, 0.1); // Scale down to reasonable size
  }, [geometry]);

  // Animation parameters based on state
  const animParams = STATE_ANIMATION_PARAMS[data.state.state];
  const etsColor = getETSColor(data.metrics.etsScore);

  // Apply hover effect
  const scale = localHovered
    ? animParams.scale * HOVER_EFFECT.scaleMultiplier
    : animParams.scale;
  const glowIntensity = localHovered
    ? Math.min(1, animParams.glowIntensity + HOVER_EFFECT.glowBoost)
    : animParams.glowIntensity;

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Rotation
    groupRef.current.rotation.z += animParams.rotationSpeed * delta;

    // Pulse effect
    const pulse =
      1 +
      Math.sin(time * animParams.pulseFrequency * Math.PI * 2) *
        animParams.pulseAmplitude;
    groupRef.current.scale.setScalar(scale * pulse);

    // Update material opacity
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.opacity = animParams.opacity;
      meshRef.current.material.emissiveIntensity = glowIntensity;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[data.position.x, data.position.y, data.position.z]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerEnter={() => {
          setLocalHovered(true);
          onHover(data.id);
        }}
        onPointerLeave={() => {
          setLocalHovered(false);
          onHover(null);
        }}
      >
        <meshStandardMaterial
          color={labConfig.baseColor}
          emissive={etsColor}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={animParams.opacity}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        position={[0, 0, 1]}
        color={etsColor}
        intensity={glowIntensity * 2}
        distance={5}
        decay={2}
      />
    </group>
  );
}

// ============================================================================
// Scene Component with All Glyphs
// ============================================================================

interface GlyphSceneProps {
  glyphs: GlyphData[];
  onHover: (glyphId: string | null) => void;
}

function GlyphScene({ glyphs, onHover }: GlyphSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[0, 0, 30]} intensity={1.0} distance={100} decay={2} />

      {/* Glyphs */}
      {glyphs.map((glyph) => (
        <Glyph key={glyph.id} data={glyph} onHover={onHover} />
      ))}
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface NexusGlyphAnimatorProps {
  glyphs?: GlyphData[];
  onGlyphHover?: (glyphId: string | null) => void;
  width?: number;
  height?: number;
  enableControls?: boolean;
  activeLayout?: import('@/lib/nexus/types').LayoutType;
}

export default function NexusGlyphAnimator({
  glyphs: externalGlyphs,
  onGlyphHover,
  width = 1920,
  height = 1080,
  enableControls = true,
  activeLayout = 'solar',
}: NexusGlyphAnimatorProps) {
  const [hoveredGlyph, setHoveredGlyph] = useState<string | null>(null);
  const animationClock = useRef(new AnimationClock());

  // Generate default glyphs with layout-aware positioning
  const defaultGlyphs = useMemo(() => {
    const labTypes = Object.values(LabType);
    return generateGlyphsForLayout(labTypes, activeLayout);
  }, [activeLayout]);

  const glyphs = externalGlyphs || defaultGlyphs;

  // Update ETS scores periodically to demonstrate state transitions
  useEffect(() => {
    const interval = setInterval(() => {
      // This is just for demo purposes
      // In production, this would be driven by real metrics
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleHover = (glyphId: string | null) => {
    setHoveredGlyph(glyphId);
    onGlyphHover?.(glyphId);
  };

  return (
    <div style={{ width, height }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={75} />

        <GlyphScene glyphs={glyphs} onHover={handleHover} />

        {enableControls && (
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            maxDistance={100}
            minDistance={10}
          />
        )}
      </Canvas>

      {/* Hover info overlay */}
      {hoveredGlyph && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          <div>Glyph ID: {hoveredGlyph}</div>
          {glyphs.find((g) => g.id === hoveredGlyph) && (
            <>
              <div>
                Lab: {LAB_CONFIGS[glyphs.find((g) => g.id === hoveredGlyph)!.labType].name}
              </div>
              <div>
                ETS Score: {glyphs.find((g) => g.id === hoveredGlyph)!.metrics.etsScore.toFixed(2)}
              </div>
              <div>
                State: {glyphs.find((g) => g.id === hoveredGlyph)!.state.state}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Hook for Glyph State Management
// ============================================================================

export function useGlyphStates(initialGlyphs: GlyphData[]) {
  const [glyphs, setGlyphs] = useState(initialGlyphs);

  const updateGlyphMetrics = (glyphId: string, metrics: Partial<GlyphMetrics>) => {
    setGlyphs((prev) =>
      prev.map((glyph) =>
        glyph.id === glyphId
          ? {
              ...glyph,
              metrics: { ...glyph.metrics, ...metrics },
              lastUpdate: Date.now(),
            }
          : glyph
      )
    );
  };

  const updateGlyphState = (glyphId: string, newState: GlyphState) => {
    setGlyphs((prev) =>
      prev.map((glyph) => {
        if (glyph.id !== glyphId) return glyph;

        const transitionRule = findTransitionRule(glyph.state.state, newState);
        const transition = transitionRule
          ? {
              from: glyph.state.state,
              to: newState,
              duration: transitionRule.duration,
              startTime: Date.now(),
            }
          : null;

        return {
          ...glyph,
          state: {
            state: newState,
            progress: 0,
            timestamp: Date.now(),
          },
          transition,
          lastUpdate: Date.now(),
        };
      })
    );
  };

  return {
    glyphs,
    updateGlyphMetrics,
    updateGlyphState,
  };
}
