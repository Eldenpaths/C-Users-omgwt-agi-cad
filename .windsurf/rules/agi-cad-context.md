---
trigger: always_on
---

PROJECT: AGI-CAD Intelligence Router
FRAMEWORK: Next.js 14, TypeScript
GOAL: Register agents for multi-AI coordination

KEY FILES:
- src/agents/nexus/AgentRegistry.ts (agent definitions)
- src/app/api/router/route.ts (API endpoint)

CURRENT TASK:
Fix /api/router?action=agents to return 3 agents (FractalForge, Buildsmith, CanonSentinel)

EXECUTION MODE:
- Make actual file edits, don't just explain
- Show diffs before applying
- Use correct import: @/agents/nexus/AgentRegistry
- When user says "do it", DO IT without permission
```

### **Step 4: Save** (Ctrl+S)

---

## AFTER SAVING

**Go back to Cascade Chat** and paste the execution prompt again:
```
Execute edits to src/app/api/router/route.ts:

1. Add import: import { registerAgents, getAllAgents } from '@/agents/nexus/AgentRegistry';
2. Add initialization block
3. Fix case 'agents' to call getAllAgents()

Apply changes now.
