# FS-QMIX: Flexible and Scalable QMIX for Task Routing in AGI-CAD

**Status**: ✅ Complete

## 1. Introduction

FS-QMIX (Flexible and Scalable Q-learning for Multi-Agent Systems) is a sophisticated task routing algorithm designed for AGI-CAD. It dynamically assigns incoming tasks to the most suitable AI agent based on a combination of task complexity, agent capabilities, and real-time performance metrics. This ensures optimal resource utilization, cost-effectiveness, and high-quality output.

## 2. D_var Complexity Scoring

The core of FS-QMIX's routing strategy is the **D_var (Dynamic Variance)** complexity score. This score analyzes the user's input text to determine its intrinsic complexity, which is then used to guide agent selection.

### D_var Formula

The D_var score is calculated as follows:

`D_var = (TextLength / 500) * 0.7 + (PunctuationCount / 20) * 0.3`

- **TextLength**: The number of characters in the input text.
- **PunctuationCount**: The number of punctuation marks in the input text.

The result is capped at a maximum value of 1.0.

## 3. Agent Selection Logic

FS-QMIX uses a value-based reinforcement learning approach to select the best agent for a given task. The algorithm maintains a Q-table that maps state-action pairs to Q-values, which represent the expected future reward of taking a particular action in a given state.

### Pseudocode

```
function selectAgent(task):
  // Calculate D_var score for the task
  d_var = calculateD_var(task.text)

  // Get the current state (e.g., system load, agent availability)
  state = getCurrentState()

  // Get the Q-values for the current state
  q_values = q_table[state]

  // Select the agent with the highest Q-value
  best_agent = null
  max_q_value = -infinity
  for agent in available_agents:
    if q_values[agent] > max_q_value:
      max_q_value = q_values[agent]
      best_agent = agent

  return best_agent
```

## 4. Decision Flow Diagram

```
+-----------------+      +----------------------+      +-----------------+
|  Incoming Task  |----->|  Calculate D_var Score |----->|  Get Current State  |
+-----------------+      +----------------------+      +-----------------+
       |
       |
       v
+-----------------+      +----------------------+      +-----------------+
|  Select Agent   |<-----|  Get Q-values        |<-----|  Available Agents |
+-----------------+      +----------------------+      +-----------------+
       |
       |
       v
+-----------------+
|  Assign Task    |
+-----------------+
```
