/**
 * AGENT CONFIGURATION
 *
 * Multi-agent system using LangChain.js for AGI scaffolding.
 * Three specialized agents work together to solve complex tasks.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";

// Agent role definitions
export interface AgentRole {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  capabilities: string[];
}

/**
 * Strategy Agent - High-level planning and task decomposition
 */
export const STRATEGY_AGENT: AgentRole = {
  id: 'strategy',
  name: 'Strategy Agent',
  role: 'Strategic Planning & Task Decomposition',
  systemPrompt: `You are a strategic planning agent. Your role is to:
1. Analyze complex user requests
2. Break them down into actionable subtasks
3. Identify which specialists (Coder, Researcher) should handle each subtask
4. Create a coordination plan
5. Synthesize results from other agents

Be concise and structured. Output task breakdowns in JSON format when possible.`,
  capabilities: [
    'Task decomposition',
    'Strategic planning',
    'Agent coordination',
    'Result synthesis'
  ]
};

/**
 * Coder Agent - Implementation and code generation
 */
export const CODER_AGENT: AgentRole = {
  id: 'coder',
  name: 'Coder Agent',
  role: 'Code Implementation & Technical Execution',
  systemPrompt: `You are a coding specialist agent. Your role is to:
1. Implement code solutions based on strategic plans
2. Write clean, efficient, production-ready code
3. Follow best practices and design patterns
4. Provide technical recommendations
5. Debug and optimize implementations

Focus on TypeScript/React/Next.js in this project. Be practical and pragmatic.`,
  capabilities: [
    'Code generation',
    'Technical implementation',
    'Debugging',
    'Code optimization',
    'Best practices'
  ]
};

/**
 * Researcher Agent - Information gathering and analysis
 */
export const RESEARCHER_AGENT: AgentRole = {
  id: 'researcher',
  name: 'Researcher Agent',
  role: 'Information Gathering & Analysis',
  systemPrompt: `You are a research specialist agent. Your role is to:
1. Gather relevant information from context
2. Analyze patterns in data
3. Provide insights and recommendations
4. Identify similar cases or precedents
5. Support decision-making with evidence

Be thorough but concise. Cite sources when available.`,
  capabilities: [
    'Information gathering',
    'Data analysis',
    'Pattern recognition',
    'Insight generation',
    'Evidence-based recommendations'
  ]
};

/**
 * Create LLM instance based on environment configuration
 */
export function createLLM(agentRole: AgentRole) {
  // Prefer Anthropic (Claude) if available, fall back to OpenAI
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    return new ChatAnthropic({
      modelName: "claude-3-5-sonnet-20241022",
      anthropicApiKey: anthropicKey,
      temperature: 0.7,
      maxTokens: 2000,
    });
  } else if (openaiKey) {
    return new ChatOpenAI({
      modelName: "gpt-4",
      openAIApiKey: openaiKey,
      temperature: 0.7,
      maxTokens: 2000,
    });
  } else {
    throw new Error('No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local');
  }
}

/**
 * Get all available agents
 */
export function getAllAgents(): AgentRole[] {
  return [STRATEGY_AGENT, CODER_AGENT, RESEARCHER_AGENT];
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): AgentRole | undefined {
  return getAllAgents().find(agent => agent.id === id);
}
