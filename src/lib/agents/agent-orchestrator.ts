/**
 * AGENT ORCHESTRATOR
 *
 * Coordinates multiple specialized agents to solve complex tasks.
 * Uses LangChain.js for agent communication and task delegation.
 */

import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import {
  STRATEGY_AGENT,
  CODER_AGENT,
  RESEARCHER_AGENT,
  createLLM,
  type AgentRole
} from './agent-config';

export interface TaskResult {
  success: boolean;
  agentId: string;
  agentName: string;
  output: string;
  timestamp: number;
}

export interface OrchestrationResult {
  success: boolean;
  plan: string;
  results: TaskResult[];
  synthesis: string;
  totalTime: number;
  error?: string;
}

/**
 * Agent Orchestrator Class
 * Coordinates multiple agents to solve complex user prompts
 */
export class AgentOrchestrator {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  private log(message: string) {
    if (this.verbose) {
      console.log(`[Orchestrator] ${message}`);
    }
  }

  /**
   * Execute a single agent with a specific prompt
   */
  private async executeAgent(agent: AgentRole, prompt: string): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      this.log(`Executing ${agent.name}...`);

      const llm = createLLM(agent);
      const messages = [
        new SystemMessage(agent.systemPrompt),
        new HumanMessage(prompt)
      ];

      const response = await llm.invoke(messages);
      const output = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      this.log(`${agent.name} completed in ${Date.now() - startTime}ms`);

      return {
        success: true,
        agentId: agent.id,
        agentName: agent.name,
        output,
        timestamp: Date.now()
      };
    } catch (error: any) {
      this.log(`${agent.name} failed: ${error.message}`);

      return {
        success: false,
        agentId: agent.id,
        agentName: agent.name,
        output: `Error: ${error.message}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Main orchestration method
   * Coordinates all agents to solve a user prompt
   */
  async coordinateTask(userPrompt: string): Promise<OrchestrationResult> {
    const overallStartTime = Date.now();

    try {
      this.log('=== ORCHESTRATION START ===');
      this.log(`User prompt: ${userPrompt}`);

      // STEP 1: Strategy Agent creates the plan
      this.log('\n--- PHASE 1: Strategic Planning ---');
      const planningPrompt = `
User Request: "${userPrompt}"

Analyze this request and create a strategic plan:
1. What is the user trying to achieve?
2. Break this into 2-3 specific subtasks
3. Which specialists (Coder or Researcher) should handle each subtask?
4. What order should tasks be executed?

Respond in this format:
ANALYSIS: [your analysis]
SUBTASKS:
1. [task] - [agent: coder/researcher]
2. [task] - [agent: coder/researcher]
ORDER: [sequential/parallel]
`;

      const planResult = await this.executeAgent(STRATEGY_AGENT, planningPrompt);

      if (!planResult.success) {
        throw new Error(`Strategy Agent failed: ${planResult.output}`);
      }

      const plan = planResult.output;
      this.log(`Plan created:\n${plan}`);

      // STEP 2: Execute specialized agents based on plan
      this.log('\n--- PHASE 2: Specialist Execution ---');

      // For MVP, we'll execute both Coder and Researcher in parallel
      // In production, we'd parse the plan and execute accordingly
      const specialistPromises = [
        this.executeAgent(CODER_AGENT, `
Strategic Plan:
${plan}

User Request: "${userPrompt}"

Based on the strategic plan, provide your technical implementation perspective.
Focus on code, architecture, and technical execution.
`),
        this.executeAgent(RESEARCHER_AGENT, `
Strategic Plan:
${plan}

User Request: "${userPrompt}"

Based on the strategic plan, provide relevant research and analysis.
Focus on patterns, precedents, and data-driven insights.
`)
      ];

      const specialistResults = await Promise.all(specialistPromises);
      this.log('Specialists completed');

      // STEP 3: Strategy Agent synthesizes results
      this.log('\n--- PHASE 3: Synthesis ---');
      const synthesisPrompt = `
Original Request: "${userPrompt}"

Your Strategic Plan:
${plan}

Coder Agent Result:
${specialistResults[0].output}

Researcher Agent Result:
${specialistResults[1].output}

Synthesize these results into a coherent response for the user.
Be concise and actionable.
`;

      const synthesisResult = await this.executeAgent(STRATEGY_AGENT, synthesisPrompt);
      const synthesis = synthesisResult.success ? synthesisResult.output : 'Synthesis failed';

      // STEP 4: Return orchestration result
      const totalTime = Date.now() - overallStartTime;
      this.log(`\n=== ORCHESTRATION COMPLETE (${totalTime}ms) ===`);

      return {
        success: true,
        plan,
        results: [planResult, ...specialistResults, synthesisResult],
        synthesis,
        totalTime
      };

    } catch (error: any) {
      this.log(`\n=== ORCHESTRATION FAILED ===`);
      this.log(`Error: ${error.message}`);

      return {
        success: false,
        plan: '',
        results: [],
        synthesis: '',
        totalTime: Date.now() - overallStartTime,
        error: error.message
      };
    }
  }

  /**
   * Simple single-agent call (for testing or simple queries)
   */
  async askAgent(agentId: string, prompt: string): Promise<TaskResult> {
    const agent = agentId === 'strategy' ? STRATEGY_AGENT
                : agentId === 'coder' ? CODER_AGENT
                : agentId === 'researcher' ? RESEARCHER_AGENT
                : null;

    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    return this.executeAgent(agent, prompt);
  }
}

/**
 * Singleton instance for easy import
 */
export const orchestrator = new AgentOrchestrator(true);
