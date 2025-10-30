// CLAUDE-META: Phase 9B Hybrid Patch - Nexus Visualization
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: 3D orbital visualization of recursive agent hierarchy
// Status: Production - Hybrid Safe Mode Active

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAgentOrbits } from "@/agents/visual/useAgentOrbits";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export type AgentNode = {
  id: string;
  name: string;
  depth: number;
  parentId?: string;
  drift: boolean;
  stdDev: number;
  entropy: number;
};

type AgentOrbProps = {
  agent: AgentNode;
  position: THREE.Vector3;
};

function AgentOrb({ agent, position }: AgentOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(pulse);

      // Rotate if drift detected
      if (agent.drift) {
        meshRef.current.rotation.y += 0.02;
      }
    }
  });

  // Color based on drift status
  const color = agent.drift ? "#ef4444" : "#fbbf24"; // red if drift, amber normal
  const emissive = agent.drift ? "#dc2626" : "#d97706";

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={hovered ? 1.2 : 0.8}
        metalness={0.6}
        roughness={0.2}
      />
      {hovered && (
        <group>
          <mesh position={[0, 0.6, 0]}>
            <planeGeometry args={[2, 0.5]} />
            <meshBasicMaterial color="#000000" opacity={0.7} transparent />
          </mesh>
        </group>
      )}
    </mesh>
  );
}

type LineageLineProps = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  drift: boolean;
};

function LineageLine({ from, to, drift }: LineageLineProps) {
  const points = [from, to];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    // @ts-expect-error - R3F primitive element
    <line geometry={geometry}>
      <lineBasicMaterial
        color={drift ? "#ef4444" : "#fbbf24"}
        linewidth={2}
        opacity={0.6}
        transparent
      />
    </line>
  );
}

type NexusSceneProps = {
  agents: AgentNode[];
};

function NexusScene({ agents }: NexusSceneProps) {
  const { positionAt } = useAgentOrbits(agents.length);
  const [time, setTime] = useState(0);

  useFrame((state) => {
    setTime(state.clock.elapsedTime);
  });

  // Build parent-child relationships
  const lines = agents
    .filter(a => a.parentId)
    .map(child => {
      const parentIdx = agents.findIndex(a => a.id === child.parentId);
      const childIdx = agents.findIndex(a => a.id === child.id);
      if (parentIdx === -1 || childIdx === -1) return null;

      return {
        from: positionAt(parentIdx, time),
        to: positionAt(childIdx, time),
        drift: child.drift || agents[parentIdx].drift,
      };
    })
    .filter(Boolean) as LineageLineProps[];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#fbbf24" />

      {/* Render lineage lines */}
      {lines.map((line, i) => (
        <LineageLine key={i} {...line} />
      ))}

      {/* Render agent orbs */}
      {agents.map((agent, i) => (
        <AgentOrb
          key={agent.id}
          agent={agent}
          position={positionAt(i, time)}
        />
      ))}

      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
}

type NexusVizProps = {
  agents: AgentNode[];
};

export default function NexusViz({ agents }: NexusVizProps) {
  return (
    <div className="w-full h-full bg-black/90 rounded-lg border border-amber-500/30">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <NexusScene agents={agents} />
      </Canvas>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 text-amber-400 text-xs font-mono">
        <div>NEXUS STATUS: {agents.length} agents active</div>
        <div>DRIFT ALERTS: {agents.filter(a => a.drift).length}</div>
        <div>HYBRID_SAFE: ACTIVE</div>
      </div>
    </div>
  );
}
