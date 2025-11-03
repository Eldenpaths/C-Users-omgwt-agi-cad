/**
 * Phase 17B: Lab Fidelity Simulator
 * Swarm dynamics for 100k+ agents, Shannon entropy, thermal propagation, and spatial partitioning
 */

import * as THREE from "three";

// ============================================================================
// Agent Interface
// ============================================================================

export interface Agent {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  temperature: number;
  labType: string;
}

// ============================================================================
// Swarm Parameters
// ============================================================================

export interface SwarmParams {
  alignmentWeight: number;
  cohesionWeight: number;
  separationWeight: number;
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  separationRadius: number;
  thermalDiffusionRate: number;
}

export const DEFAULT_SWARM_PARAMS: SwarmParams = {
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  separationWeight: 1.5,
  maxSpeed: 2.0,
  maxForce: 0.1,
  perceptionRadius: 5.0,
  separationRadius: 2.0,
  thermalDiffusionRate: 0.3,
};

// ============================================================================
// Quadtree for Spatial Partitioning
// ============================================================================

export interface QuadTreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class QuadTreeNode {
  bounds: QuadTreeBounds;
  capacity: number;
  agents: Agent[];
  divided: boolean;
  northwest: QuadTreeNode | null;
  northeast: QuadTreeNode | null;
  southwest: QuadTreeNode | null;
  southeast: QuadTreeNode | null;

  constructor(bounds: QuadTreeBounds, capacity: number = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.agents = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  contains(point: THREE.Vector3): boolean {
    return (
      point.x >= this.bounds.x - this.bounds.width &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y - this.bounds.height &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  intersects(range: QuadTreeBounds): boolean {
    return !(
      range.x - range.width > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x - this.bounds.width ||
      range.y - range.height > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y - this.bounds.height
    );
  }

  insert(agent: Agent): boolean {
    if (!this.contains(agent.position)) {
      return false;
    }

    if (this.agents.length < this.capacity) {
      this.agents.push(agent);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest!.insert(agent) ||
      this.northeast!.insert(agent) ||
      this.southwest!.insert(agent) ||
      this.southeast!.insert(agent)
    );
  }

  subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.northwest = new QuadTreeNode({ x: x - w, y: y - h, width: w, height: h }, this.capacity);
    this.northeast = new QuadTreeNode({ x: x + w, y: y - h, width: w, height: h }, this.capacity);
    this.southwest = new QuadTreeNode({ x: x - w, y: y + h, width: w, height: h }, this.capacity);
    this.southeast = new QuadTreeNode({ x: x + w, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }

  query(range: QuadTreeBounds, found: Agent[] = []): Agent[] {
    if (!this.intersects(range)) {
      return found;
    }

    for (const agent of this.agents) {
      if (
        agent.position.x >= range.x - range.width &&
        agent.position.x < range.x + range.width &&
        agent.position.y >= range.y - range.height &&
        agent.position.y < range.y + range.height
      ) {
        found.push(agent);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }
}

// ============================================================================
// Shannon Entropy Calculations
// ============================================================================

export function calculateShannonEntropy(agents: Agent[], gridSize: number = 10): number {
  const grid = new Map<string, number>();
  const cellSize = gridSize;

  // Count agents in each grid cell
  for (const agent of agents) {
    const cellX = Math.floor(agent.position.x / cellSize);
    const cellY = Math.floor(agent.position.y / cellSize);
    const key = `${cellX},${cellY}`;
    grid.set(key, (grid.get(key) || 0) + 1);
  }

  const total = agents.length;
  let entropy = 0;

  // Calculate Shannon entropy: H = -Σ(p * log2(p))
  for (const count of Array.from(grid.values())) {
    if (count > 0) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }
  }

  return entropy;
}

export function calculateLocalEntropy(
  position: THREE.Vector3,
  agents: Agent[],
  radius: number
): number {
  const localAgents = agents.filter((agent) => {
    return agent.position.distanceTo(position) <= radius;
  });

  if (localAgents.length === 0) return 0;

  return calculateShannonEntropy(localAgents, radius / 2);
}

// ============================================================================
// Thermal Propagation with Diffusion Model
// ============================================================================

export interface ThermalState {
  temperature: number;
  gradient: THREE.Vector3;
  flux: number;
}

export function calculateThermalDiffusion(
  agents: Agent[],
  dt: number,
  diffusionRate: number
): void {
  const thermalStates = new Map<number, ThermalState>();

  // Calculate thermal gradients
  for (const agent of agents) {
    const neighbors = agents.filter((other) => {
      if (other.id === agent.id) return false;
      return agent.position.distanceTo(other.position) < 5.0;
    });

    let gradient = new THREE.Vector3(0, 0, 0);
    let avgTemp = 0;

    for (const neighbor of neighbors) {
      const direction = new THREE.Vector3()
        .subVectors(neighbor.position, agent.position)
        .normalize();

      const tempDiff = neighbor.temperature - agent.temperature;
      gradient.add(direction.multiplyScalar(tempDiff));
      avgTemp += neighbor.temperature;
    }

    if (neighbors.length > 0) {
      avgTemp /= neighbors.length;
      gradient.divideScalar(neighbors.length);
    }

    const flux = gradient.length() * diffusionRate;

    thermalStates.set(agent.id, {
      temperature: agent.temperature,
      gradient,
      flux,
    });
  }

  // Apply thermal diffusion
  for (const agent of agents) {
    const state = thermalStates.get(agent.id);
    if (state) {
      // Heat equation: dT/dt = α ∇²T
      const diffusion = state.flux * dt * diffusionRate;
      agent.temperature += diffusion;

      // Clamp temperature to valid range
      agent.temperature = Math.max(0, Math.min(1, agent.temperature));
    }
  }
}

// ============================================================================
// Swarm Dynamics (Boids Algorithm)
// ============================================================================

function alignment(agent: Agent, neighbors: Agent[]): THREE.Vector3 {
  if (neighbors.length === 0) return new THREE.Vector3(0, 0, 0);

  const avgVelocity = new THREE.Vector3(0, 0, 0);
  for (const neighbor of neighbors) {
    avgVelocity.add(neighbor.velocity);
  }
  avgVelocity.divideScalar(neighbors.length);

  return avgVelocity.sub(agent.velocity).normalize();
}

function cohesion(agent: Agent, neighbors: Agent[]): THREE.Vector3 {
  if (neighbors.length === 0) return new THREE.Vector3(0, 0, 0);

  const centerOfMass = new THREE.Vector3(0, 0, 0);
  for (const neighbor of neighbors) {
    centerOfMass.add(neighbor.position);
  }
  centerOfMass.divideScalar(neighbors.length);

  return centerOfMass.sub(agent.position).normalize();
}

function separation(agent: Agent, neighbors: Agent[], separationRadius: number): THREE.Vector3 {
  if (neighbors.length === 0) return new THREE.Vector3(0, 0, 0);

  const steering = new THREE.Vector3(0, 0, 0);
  let count = 0;

  for (const neighbor of neighbors) {
    const distance = agent.position.distanceTo(neighbor.position);
    if (distance < separationRadius && distance > 0) {
      const diff = new THREE.Vector3().subVectors(agent.position, neighbor.position);
      diff.normalize();
      diff.divideScalar(distance); // Weight by distance
      steering.add(diff);
      count++;
    }
  }

  if (count > 0) {
    steering.divideScalar(count);
    steering.normalize();
  }

  return steering;
}

export function applySwarmBehaviors(
  agents: Agent[],
  quadTree: QuadTreeNode,
  params: SwarmParams
): void {
  for (const agent of agents) {
    // Query nearby agents using quadtree
    const range: QuadTreeBounds = {
      x: agent.position.x,
      y: agent.position.y,
      width: params.perceptionRadius,
      height: params.perceptionRadius,
    };

    const neighbors = quadTree.query(range).filter((n) => n.id !== agent.id);

    // Calculate steering forces
    const alignmentForce = alignment(agent, neighbors).multiplyScalar(params.alignmentWeight);
    const cohesionForce = cohesion(agent, neighbors).multiplyScalar(params.cohesionWeight);
    const separationForce = separation(agent, neighbors, params.separationRadius).multiplyScalar(
      params.separationWeight
    );

    // Combine forces
    const totalForce = new THREE.Vector3()
      .add(alignmentForce)
      .add(cohesionForce)
      .add(separationForce);

    // Limit force magnitude
    if (totalForce.length() > params.maxForce) {
      totalForce.normalize().multiplyScalar(params.maxForce);
    }

    // Apply force (F = ma, assume mass = 1)
    agent.acceleration.add(totalForce.divideScalar(agent.mass));
  }
}

// ============================================================================
// Agent Update
// ============================================================================

export function updateAgents(agents: Agent[], dt: number, maxSpeed: number): void {
  for (const agent of agents) {
    // Update velocity
    agent.velocity.add(agent.acceleration.clone().multiplyScalar(dt));

    // Limit speed
    if (agent.velocity.length() > maxSpeed) {
      agent.velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Update position
    agent.position.add(agent.velocity.clone().multiplyScalar(dt));

    // Reset acceleration
    agent.acceleration.set(0, 0, 0);
  }
}

// ============================================================================
// Simulator Class
// ============================================================================

export interface SimulatorConfig {
  maxAgents: number;
  bounds: QuadTreeBounds;
  swarmParams: SwarmParams;
  entropyGridSize: number;
}

export class LabFidelitySimulator {
  private agents: Agent[];
  private quadTree: QuadTreeNode | null;
  private config: SimulatorConfig;
  private entropyTexture: THREE.Texture;
  private lastUpdateTime: number;

  constructor(config: Partial<SimulatorConfig> = {}) {
    this.config = {
      maxAgents: config.maxAgents || 100000,
      bounds: config.bounds || { x: 0, y: 0, width: 100, height: 100 },
      swarmParams: config.swarmParams || DEFAULT_SWARM_PARAMS,
      entropyGridSize: config.entropyGridSize || 10,
    };

    this.agents = [];
    this.quadTree = null;
    this.entropyTexture = new THREE.Texture();
    this.lastUpdateTime = performance.now();
  }

  addAgent(labType: string, position?: THREE.Vector3): Agent {
    const agent: Agent = {
      id: this.agents.length,
      position: position || new THREE.Vector3(
        Math.random() * this.config.bounds.width * 2 - this.config.bounds.width,
        Math.random() * this.config.bounds.height * 2 - this.config.bounds.height,
        0
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        0
      ),
      acceleration: new THREE.Vector3(0, 0, 0),
      mass: 1.0,
      temperature: Math.random(),
      labType,
    };

    this.agents.push(agent);
    return agent;
  }

  removeAgent(id: number): void {
    this.agents = this.agents.filter((agent) => agent.id !== id);
  }

  buildQuadTree(): void {
    this.quadTree = new QuadTreeNode(this.config.bounds, 4);
    for (const agent of this.agents) {
      this.quadTree.insert(agent);
    }
  }

  update(dt: number): void {
    if (this.agents.length === 0) return;

    // Rebuild quadtree for spatial queries
    this.buildQuadTree();

    // Apply swarm behaviors
    if (this.quadTree) {
      applySwarmBehaviors(this.agents, this.quadTree, this.config.swarmParams);
    }

    // Update agent positions and velocities
    updateAgents(this.agents, dt, this.config.swarmParams.maxSpeed);

    // Apply thermal diffusion
    calculateThermalDiffusion(
      this.agents,
      dt,
      this.config.swarmParams.thermalDiffusionRate
    );

    // Update entropy texture
    this.updateEntropyTexture();

    this.lastUpdateTime = performance.now();
  }

  updateEntropyTexture(): void {
    // Create a 2D texture representing entropy distribution
    const size = 64;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i / size) * this.config.bounds.width * 2 - this.config.bounds.width;
        const y = (j / size) * this.config.bounds.height * 2 - this.config.bounds.height;
        const position = new THREE.Vector3(x, y, 0);

        const entropy = calculateLocalEntropy(position, this.agents, 10);
        const normalized = Math.min(255, Math.floor(entropy * 50));

        const idx = (i * size + j) * 4;
        data[idx] = normalized;
        data[idx + 1] = normalized;
        data[idx + 2] = normalized;
        data[idx + 3] = 255;
      }
    }

    this.entropyTexture.image = { data, width: size, height: size };
    this.entropyTexture.needsUpdate = true;
  }

  getEntropy(): number {
    return calculateShannonEntropy(this.agents, this.config.entropyGridSize);
  }

  getAverageTemperature(): number {
    if (this.agents.length === 0) return 0;
    const sum = this.agents.reduce((acc, agent) => acc + agent.temperature, 0);
    return sum / this.agents.length;
  }

  getSwarmDensity(): number {
    const area =
      this.config.bounds.width * 2 * this.config.bounds.height * 2;
    return this.agents.length / area;
  }

  setETSWeights(weights: { alignment?: number; cohesion?: number; separation?: number }): void {
    if (weights.alignment !== undefined) {
      this.config.swarmParams.alignmentWeight = weights.alignment;
    }
    if (weights.cohesion !== undefined) {
      this.config.swarmParams.cohesionWeight = weights.cohesion;
    }
    if (weights.separation !== undefined) {
      this.config.swarmParams.separationWeight = weights.separation;
    }
  }

  getEntropyTexture(): THREE.Texture {
    return this.entropyTexture;
  }

  dispose(): void {
    this.agents = [];
    this.quadTree = null;
    this.entropyTexture.dispose();
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  getConfig(): SimulatorConfig {
    return this.config;
  }
}

// ============================================================================
// Factory Function (for backward compatibility)
// ============================================================================

export const createSimulator = (config?: Partial<SimulatorConfig>) => {
  return new LabFidelitySimulator(config);
};
