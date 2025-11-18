/**
 * AGI-CAD Phase Manifest and Context Type Definitions
 *
 * These types define the structure for AI context sharing across conversations
 * and the phase manifest system for tracking project state.
 */

// =============================================================================
// Core Types
// =============================================================================

export type PhaseStatus = 'planned' | 'active' | 'completed' | 'deprecated';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AgentStatus = 'active' | 'inactive' | 'deprecated';
export type BuildCheckStatus = 'pass' | 'warning' | 'fail';

// =============================================================================
// Project Overview
// =============================================================================

export interface TechStack {
  framework: string;
  language: string;
  ui: string[];
  '3d': string[];
  state: string[];
  database: string[];
  ai: string[];
}

export interface ProjectOverview {
  name: string;
  description: string;
  healthScore: number;
  totalSourceFiles: number;
  stack: TechStack;
}

// =============================================================================
// Tasks and Decisions
// =============================================================================

export interface RemainingTask {
  task: string;
  priority: TaskPriority;
  description: string;
  estimatedTime: string;
}

export interface CanonicalDecision {
  decision: string;
  choice: string;
  rationale: string;
  date: string;
}

// =============================================================================
// Agents
// =============================================================================

export interface AgentDefinition {
  name: string;
  role: string;
  status: AgentStatus;
}

export interface AgentConfig {
  defined: AgentDefinition[];
  constraints: string[];
}

// =============================================================================
// Build and Deployment
// =============================================================================

export interface BuildStatus {
  dependencies: BuildCheckStatus;
  environment: BuildCheckStatus;
  typescript: BuildCheckStatus;
  typeErrorCount: number;
  firebase: BuildCheckStatus;
  fileStructure: BuildCheckStatus;
  git: BuildCheckStatus;
}

export interface DeploymentReadiness {
  environment: boolean;
  firebase: boolean;
  build: BuildCheckStatus | boolean;
  tests: 'pass' | 'fail' | 'in_progress';
  security: boolean;
  errorLogging: boolean;
  performance: boolean;
  documentation: boolean;
  recommendation: string;
}

// =============================================================================
// History and Commits
// =============================================================================

export interface CommitInfo {
  hash: string;
  message: string;
}

export interface NextPhaseInfo {
  phase: number;
  focus: string;
  goals: string[];
}

// =============================================================================
// SEL (Semantic Expression Language)
// =============================================================================

export interface SELGlossary {
  forge: string;
  bloom: string;
  cascade: string;
  crystallize: string;
  drift: string;
  [key: string]: string; // Allow additional SEL terms
}

// =============================================================================
// Phase Manifest
// =============================================================================

export interface PhaseManifest {
  phase: number;
  status: PhaseStatus;
  name: string;
  completion: string;
  lastUpdated: string;
  summary: string;

  projectOverview: ProjectOverview;
  completedFeatures: string[];
  remainingTasks: RemainingTask[];
  canonicalDecisions: CanonicalDecision[];

  criticalPaths: Record<string, string>;
  agents: AgentConfig;

  buildStatus: BuildStatus;
  deploymentReadiness: DeploymentReadiness;

  nextPhase: NextPhaseInfo;
  recentCommits: CommitInfo[];
  selGlossary: SELGlossary;
}

// =============================================================================
// Agent Context (for self-aware agents)
// =============================================================================

export interface AgentContext {
  currentPhase: number;
  myRole: string;
  canonicalConstraints: string[];
  availableAgents: string[];
  graphState: Record<string, unknown>;
}

// =============================================================================
// Utility Types
// =============================================================================

export type PartialPhaseManifest = Partial<PhaseManifest> & {
  phase: number;
  status: PhaseStatus;
};

export type PhaseManifestUpdate = {
  phase: number;
  updates: Partial<PhaseManifest>;
};

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidPhaseManifest(data: unknown): data is PhaseManifest {
  if (!data || typeof data !== 'object') return false;

  const manifest = data as Record<string, unknown>;

  return (
    typeof manifest.phase === 'number' &&
    typeof manifest.status === 'string' &&
    typeof manifest.name === 'string' &&
    typeof manifest.summary === 'string' &&
    manifest.projectOverview !== undefined &&
    Array.isArray(manifest.completedFeatures) &&
    Array.isArray(manifest.remainingTasks) &&
    Array.isArray(manifest.canonicalDecisions)
  );
}

export function createEmptyManifest(phase: number): PhaseManifest {
  return {
    phase,
    status: 'planned',
    name: `Phase ${phase}`,
    completion: '0%',
    lastUpdated: new Date().toISOString().split('T')[0],
    summary: '',

    projectOverview: {
      name: 'AGI-CAD',
      description: '',
      healthScore: 0,
      totalSourceFiles: 0,
      stack: {
        framework: '',
        language: '',
        ui: [],
        '3d': [],
        state: [],
        database: [],
        ai: []
      }
    },

    completedFeatures: [],
    remainingTasks: [],
    canonicalDecisions: [],

    criticalPaths: {},
    agents: {
      defined: [],
      constraints: []
    },

    buildStatus: {
      dependencies: 'pass',
      environment: 'pass',
      typescript: 'pass',
      typeErrorCount: 0,
      firebase: 'pass',
      fileStructure: 'pass',
      git: 'pass'
    },

    deploymentReadiness: {
      environment: false,
      firebase: false,
      build: false,
      tests: 'in_progress',
      security: false,
      errorLogging: false,
      performance: false,
      documentation: false,
      recommendation: ''
    },

    nextPhase: {
      phase: phase + 1,
      focus: '',
      goals: []
    },

    recentCommits: [],
    selGlossary: {
      forge: 'create/generate with intentionality',
      bloom: 'expand/grow organically',
      cascade: 'propagate through system',
      crystallize: 'solidify/finalize structure',
      drift: 'ambient state monitoring'
    }
  };
}
