/**
 * Phase 19: Task Router API
 * RESTful API for task routing and queue management
 */

import { NextRequest, NextResponse } from 'next/server';
import { routingEngine } from '@/lib/router/routingEngine';
import { taskQueueManager } from '@/lib/router/taskQueue';
import { Task, Agent, TaskStatus } from '@/lib/router/taskTypes';

// ============================================================================
// GET - Query Tasks and Agents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        return handleGetMetrics();

      case 'agents':
        return handleGetAgents();

      case 'task':
        return handleGetTask(searchParams.get('id')!);

      case 'queue':
        return handleGetQueue(searchParams.get('id') || 'default');

      case 'stats':
        return handleGetStats();

      default:
        return handleGetAllTasks(searchParams);
    }
  } catch (error) {
    console.error('❌ Router GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleGetMetrics() {
  const metrics = routingEngine.getMetrics();
  return NextResponse.json({
    success: true,
    data: metrics,
  });
}

async function handleGetAgents() {
  const agents = routingEngine.getAllAgents();
  return NextResponse.json({
    success: true,
    data: agents,
  });
}

async function handleGetTask(id: string) {
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Task ID required' },
      { status: 400 }
    );
  }

  const task = taskQueueManager.getTask(id);

  if (!task) {
    return NextResponse.json(
      { success: false, error: 'Task not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: task,
  });
}

async function handleGetQueue(queueId: string) {
  const stats = taskQueueManager.getQueueStatistics(queueId);

  if (!stats) {
    return NextResponse.json(
      { success: false, error: 'Queue not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: stats,
  });
}

async function handleGetStats() {
  const stats = taskQueueManager.getAllStatistics();
  return NextResponse.json({
    success: true,
    data: stats,
  });
}

async function handleGetAllTasks(searchParams: URLSearchParams) {
  const status = searchParams.get('status') as TaskStatus | null;

  const tasks = status
    ? taskQueueManager.getTasksByStatus(status)
    : taskQueueManager.getAllTasks();

  return NextResponse.json({
    success: true,
    data: tasks,
  });
}

// ============================================================================
// POST - Create and Route Tasks
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'enqueue':
        return handleEnqueueTask(body);

      case 'route':
        return handleRouteTask(body);

      case 'register_agent':
        return handleRegisterAgent(body);

      case 'create_queue':
        return handleCreateQueue(body);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Router POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleEnqueueTask(body: any) {
  const { task, queueId } = body;

  if (!task) {
    return NextResponse.json(
      { success: false, error: 'Task data required' },
      { status: 400 }
    );
  }

  const success = taskQueueManager.enqueue(task as Task, queueId);

  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Failed to enqueue task' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { taskId: task.id, queueId: queueId || 'default' },
  }, { status: 201 });
}

async function handleRouteTask(body: any) {
  const { task } = body;

  if (!task) {
    return NextResponse.json(
      { success: false, error: 'Task data required' },
      { status: 400 }
    );
  }

  const decision = routingEngine.route(task as Task);

  if (!decision) {
    return NextResponse.json(
      { success: false, error: 'No suitable agent found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: decision,
  });
}

async function handleRegisterAgent(body: any) {
  const { agent } = body;

  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent data required' },
      { status: 400 }
    );
  }

  routingEngine.registerAgent(agent as Agent);

  return NextResponse.json({
    success: true,
    data: { agentId: agent.id },
  }, { status: 201 });
}

async function handleCreateQueue(body: any) {
  const { id, name, strategy, maxSize } = body;

  if (!id || !name) {
    return NextResponse.json(
      { success: false, error: 'Queue ID and name required' },
      { status: 400 }
    );
  }

  const queue = taskQueueManager.createQueue(id, name, strategy, maxSize);

  return NextResponse.json({
    success: true,
    data: queue,
  }, { status: 201 });
}

// ============================================================================
// PUT - Update Tasks and Agents
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId, status, agentId, output } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Status required' },
            { status: 400 }
          );
        }
        taskQueueManager.updateTaskStatus(taskId, status as TaskStatus, agentId);
        break;

      case 'complete':
        taskQueueManager.completeTask(taskId, output);
        routingEngine.recordTaskCompletion(
          taskQueueManager.getTask(taskId)!,
          true
        );
        break;

      case 'fail':
        const error = body.error || 'Unknown error';
        taskQueueManager.failTask(taskId, error);
        routingEngine.recordTaskCompletion(
          taskQueueManager.getTask(taskId)!,
          false
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { taskId },
    });
  } catch (error) {
    console.error('❌ Router PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Tasks and Agents
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'task':
        taskQueueManager.removeTask(id);
        break;

      case 'agent':
        routingEngine.unregisterAgent(id);
        break;

      case 'queue':
        taskQueueManager.deleteQueue(id);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
    });
  } catch (error) {
    console.error('❌ Router DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
