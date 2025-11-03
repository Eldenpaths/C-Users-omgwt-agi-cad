/**
 * AGENTS MODULE - Main Entry Point
 *
 * Multi-agent orchestration system using LangChain.js
 */

export {
  STRATEGY_AGENT,
  CODER_AGENT,
  RESEARCHER_AGENT,
  createLLM,
  getAllAgents,
  getAgentById,
  type AgentRole
} from './agent-config';

export {
  AgentOrchestrator,
  orchestrator,
  type TaskResult,
  type OrchestrationResult
} from './agent-orchestrator';
