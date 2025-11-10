/**
 * @file src/core/router/IntelligenceRouter.ts
 * The core "brainstem" for AGI-CAD.
 * Routes tasks to specialized agents and logs all intents to the VAULT (Firestore).
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/firebaseClient'; // Assumed client path

// 1. --- ROUTES ---
// Defines the symbolic protocols and their designated handlers.
export const ROUTES = {
  build: 'codex://build', // Code generation
  refactor: 'cline://task', // Autonomous refactoring
  reason: 'claude://reason', // Strategic reasoning, logic
  render: 'gemini://render', // Visual, UI, aesthetic generation
  review: 'grok://review', // Audit, review, context sentinel
  archive: 'echo://scan', // Deep-scan, IP indexing
  fractal_monitor: 'fractal://analyze', // FS-QMIX/SLR analysis
} as const; // `as const` provides strict typing

type TaskType = keyof typeof ROUTES;

// 2. --- TASK PAYLOAD ---
interface TaskPayload {
  type: string; // Should be one of TaskType
  context?: any;
}

/**
 * Internal helper to log the task to Firestore.
 * This is the VAULT entry for the task's *intent*.
 * It's user-scoped by adding the `userId` to the log document.
 */
const logTaskToFirestore = async (task: TaskPayload, route: string) => {
  if (!db) {
    console.warn('Firebase (db) not initialized. Skipping router log.');
    return;
  }

  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const logData = {
      userId,
      route,
      task,
      timestamp: serverTimestamp(),
      status: 'pending',
    };
    await addDoc(collection(db, 'router_logs'), logData);
  } catch (error) {
    console.error('Failed to log task to Firestore:', error);
  }
};

// 3. --- CORE ROUTER FUNCTION ---
/**
 * Routes a task to the correct AI agent based on its type.
 * All tasks are logged to Firestore for auditing and future training.
 *
 * @param task An object containing the task type and context.
 * @returns A promise that resolves with the result from the agent.
 */
export const routeTask = async (task: TaskPayload): Promise<any> => {
  const taskType = task.type as TaskType;
  const route = ROUTES[taskType] || null;

  if (!route) {
    return {
      ok: false,
      error: `Invalid task type: ${task.type}`,
      echo: task,
    };
  }

  // Log the task intent *before* execution
  await logTaskToFirestore(task, route);

  // Switch on the symbolic route to call the correct agent
  // [STUB] All routes return a mock response for now.
  switch (route) {
    case ROUTES.build:
      // TODO: Call Codex API (or agent)
      break;

    case ROUTES.refactor:
      // TODO: Call Cline agent
      break;

    case ROUTES.reason:
      // TODO: Call Claude agent (claude://reason)
      break;

    case ROUTES.render:
      // TODO: Call Gemini API (gemini://render)
      break;

    case ROUTES.review:
      // TODO: Call Grok agent (grok://review)
      E.g., for `[mode: deep-scan]`
      break;

    case ROUTES.archive:
      // TODO: Call EchoArchivist agent (echo://scan)
      break;

    case ROUTES.fractal_monitor:
      // TODO: Call Fractalwright agent (fractal://analyze)
      break;

    default:
      // This case should be unreachable due to the initial check
      console.error(`Unrouted task: ${task.type}`);
  }

  // [STUB] Return a standard "ok" response with the task echoed
  return {
    ok: true,
    route,
    echo: task,
  };
};