/**
 * AGENT TRACE LOGGING SYSTEM
 *
 * Logs every LangChain agent action to Firestore for debugging and learning.
 * This is the foundation for CVRA (Canon Validated Reasoning Adjustments).
 *
 * Purpose:
 * - Track all agent decisions and actions
 * - Enable debugging of multi-agent systems
 * - Feed data into CVRA for anomaly detection
 * - Build historical context for pattern matching
 */

import { getDbInstance } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Agent Trace - Complete record of an agent action
 */
export interface AgentTrace {
  // Identity
  agentId: string;           // Which agent (archivist, forgewright, etc.)
  agentType: string;         // Type category (research, synthesis, execution)

  // Action details
  action: string;            // What the agent did (e.g., "analyze_drift", "create_vault_entry")
  input: any;                // Input data (experiment results, queries, etc.)
  output: any;               // Output data (decisions, generated content, etc.)

  // Context
  timestamp: Date;           // When this happened
  duration: number;          // How long it took (ms)
  sessionId?: string;        // Optional session grouping
  parentTraceId?: string;    // For nested agent calls

  // Quality metrics
  confidence: number;        // Agent's confidence (0-1)
  errors: string[];          // Any errors encountered
  warnings: string[];        // Any warnings generated

  // Metadata
  metadata?: {
    agentName?: string;      // Human-readable agent name
    labId?: string;          // Which lab generated this
    experimentId?: string;   // Related experiment
    userId?: string;         // User who triggered this
    tags?: string[];         // Custom tags
  };
}

/**
 * Lightweight trace for high-frequency logging
 */
export interface QuickTrace {
  agentId: string;
  action: string;
  timestamp: Date;
  success: boolean;
  duration: number;
}

/**
 * Log an agent action to Firestore
 */
export async function logAgentAction(trace: AgentTrace): Promise<string> {
  try {
    const docRef = await addDoc(collection(getDbInstance(), 'agent-traces'), {
      ...trace,
      timestamp: trace.timestamp.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error) {
    console.error('[AgentTracer] Failed to log action:', error);
    // Don't throw - logging should never break the agent
    return '';
  }
}

/**
 * Log multiple actions in batch (more efficient)
 */
export async function logAgentBatch(traces: AgentTrace[]): Promise<void> {
  try {
    const promises = traces.map(trace => logAgentAction(trace));
    await Promise.all(promises);
  } catch (error) {
    console.error('[AgentTracer] Failed to log batch:', error);
  }
}

/**
 * Create a lightweight quick trace (for high-frequency actions)
 */
export function createQuickTrace(
  agentId: string,
  action: string,
  success: boolean,
  duration: number
): QuickTrace {
  return {
    agentId,
    action,
    timestamp: new Date(),
    success,
    duration,
  };
}

/**
 * Wrap an agent function to automatically trace it
 */
export function traceAgent<T extends (...args: any[]) => Promise<any>>(
  agentId: string,
  agentType: string,
  actionName: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const trace: AgentTrace = {
      agentId,
      agentType,
      action: actionName,
      input: args,
      output: null,
      timestamp: new Date(),
      duration: 0,
      confidence: 1.0,
      errors: [],
      warnings: [],
    };

    try {
      const result = await fn(...args);
      trace.output = result;
      trace.duration = Date.now() - startTime;

      // Log asynchronously (don't block)
      logAgentAction(trace).catch(console.error);

      return result;
    } catch (error) {
      trace.duration = Date.now() - startTime;
      trace.errors.push(error instanceof Error ? error.message : String(error));
      trace.confidence = 0;

      // Log the error
      logAgentAction(trace).catch(console.error);

      // Re-throw the original error
      throw error;
    }
  }) as T;
}

/**
 * Query agent traces by agent ID
 */
export async function getTracesByAgent(
  agentId: string,
  limitCount: number = 100
): Promise<AgentTrace[]> {
  try {
    const q = query(
      collection(getDbInstance(), 'agent-traces'),
      where('agentId', '==', agentId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: new Date(doc.data().timestamp),
    })) as AgentTrace[];
  } catch (error) {
    console.error('[AgentTracer] Failed to query traces:', error);
    return [];
  }
}

/**
 * Query traces by action type
 */
export async function getTracesByAction(
  action: string,
  limitCount: number = 100
): Promise<AgentTrace[]> {
  try {
    const q = query(
      collection(getDbInstance(), 'agent-traces'),
      where('action', '==', action),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: new Date(doc.data().timestamp),
    })) as AgentTrace[];
  } catch (error) {
    console.error('[AgentTracer] Failed to query traces:', error);
    return [];
  }
}

/**
 * Query traces with errors
 */
export async function getFailedTraces(limitCount: number = 50): Promise<AgentTrace[]> {
  try {
    const q = query(
      collection(getDbInstance(), 'agent-traces'),
      where('errors', '!=', []),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: new Date(doc.data().timestamp),
    })) as AgentTrace[];
  } catch (error) {
    console.error('[AgentTracer] Failed to query failed traces:', error);
    return [];
  }
}

/**
 * Get agent performance metrics
 */
export async function getAgentMetrics(agentId: string): Promise<{
  totalActions: number;
  successRate: number;
  avgDuration: number;
  avgConfidence: number;
  errorCount: number;
}> {
  try {
    const traces = await getTracesByAgent(agentId, 1000);

    if (traces.length === 0) {
      return {
        totalActions: 0,
        successRate: 0,
        avgDuration: 0,
        avgConfidence: 0,
        errorCount: 0,
      };
    }

    const successfulTraces = traces.filter(t => t.errors.length === 0);
    const totalDuration = traces.reduce((sum, t) => sum + t.duration, 0);
    const totalConfidence = traces.reduce((sum, t) => sum + t.confidence, 0);
    const errorCount = traces.reduce((sum, t) => sum + t.errors.length, 0);

    return {
      totalActions: traces.length,
      successRate: successfulTraces.length / traces.length,
      avgDuration: totalDuration / traces.length,
      avgConfidence: totalConfidence / traces.length,
      errorCount,
    };
  } catch (error) {
    console.error('[AgentTracer] Failed to calculate metrics:', error);
    return {
      totalActions: 0,
      successRate: 0,
      avgDuration: 0,
      avgConfidence: 0,
      errorCount: 0,
    };
  }
}

/**
 * Session-based tracing helper
 */
export class AgentSession {
  private sessionId: string;
  private traces: AgentTrace[] = [];

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async trace(trace: Omit<AgentTrace, 'sessionId'>): Promise<void> {
    const fullTrace: AgentTrace = {
      ...trace,
      sessionId: this.sessionId,
    };

    this.traces.push(fullTrace);
    await logAgentAction(fullTrace);
  }

  getLocalTraces(): AgentTrace[] {
    return [...this.traces];
  }

  async flush(): Promise<void> {
    if (this.traces.length > 0) {
      await logAgentBatch(this.traces);
      this.traces = [];
    }
  }
}

/**
 * Example usage:
 *
 * // Simple logging
 * await logAgentAction({
 *   agentId: 'archivist',
 *   agentType: 'research',
 *   action: 'analyze_drift',
 *   input: { driftMapId: '123' },
 *   output: { findings: [...] },
 *   timestamp: new Date(),
 *   duration: 1523,
 *   confidence: 0.92,
 *   errors: [],
 *   warnings: [],
 * });
 *
 * // Auto-tracing wrapper
 * const tracedFunction = traceAgent(
 *   'archivist',
 *   'research',
 *   'analyze_drift',
 *   async (driftMapId: string) => {
 *     // Your agent logic here
 *     return analysis;
 *   }
 * );
 *
 * // Session-based tracing
 * const session = new AgentSession();
 * await session.trace({
 *   agentId: 'archivist',
 *   agentType: 'research',
 *   action: 'step1',
 *   input: {...},
 *   output: {...},
 *   timestamp: new Date(),
 *   duration: 100,
 *   confidence: 0.9,
 *   errors: [],
 *   warnings: [],
 * });
 * await session.flush();
 */
