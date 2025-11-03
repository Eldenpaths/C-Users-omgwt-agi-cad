# AGI-CAD User Guide

Welcome to AGI-CAD, your AI-powered research and experimentation platform. This guide will help you understand and master every feature.

---

## Table of Contents

1. [Welcome to AGI-CAD](#welcome)
2. [Understanding SOS](#understanding-sos)
3. [Your First Experiment](#first-experiment)
4. [Working with Agents](#working-with-agents)
5. [Using the VAULT](#using-the-vault)
6. [Pattern Recognition](#pattern-recognition)
7. [Meet Miss Avak](#meet-miss-avak)
8. [Build Canon](#build-canon)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [FAQ](#faq)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Welcome to AGI-CAD {#welcome}

AGI-CAD is a **Symbolic Operating System** designed for researchers, developers, and creative thinkers who want to:

- Run structured experiments across multiple domains
- Leverage AI agents for planning, implementation, and analysis
- Build a knowledge base that learns from your patterns
- Establish "canon" – validated decisions that guide future work

Think of it as your **mystical research lab** powered by AGI.

---

## 🔮 Understanding SOS {#understanding-sos}

**SOS** stands for **Symbolic Operating System**. It's built on three core concepts:

### The FORGE 🔥
**Center area** – Where creation happens

- Select labs from different areas (Science, Crypto, Design, Custom)
- Run experiments with interactive tools
- Coordinate AI agents for complex tasks
- The mystical golden core represents active processes

### The VAULT 🗄️
**Left sidebar** – Your persistent memory

- All experiments are automatically saved
- Never lose work – everything is preserved
- Tag experiments for organization
- Mark important discoveries as "Canon"
- Smart suggestions powered by AI

### The CANON 📜
**Right sidebar** – Locked knowledge

- Track decisions that matter
- Pin promising approaches
- Lock validated patterns
- Document deviations with reasons
- Export your build log

---

## 🚀 Your First Experiment {#first-experiment}

### Step 1: Choose an Area

Click one of the area buttons:
- **🔬 Science** – Physics, chemistry, natural sciences
- **₿ Crypto** – Blockchain, tokenomics, DeFi
- **🎨 Design** – Visual design, UX, creative tools
- **⚙️ Custom** – Your own labs (coming soon)

### Step 2: Select a Lab

Browse the lab cards and click one to launch it. For example:

**Plasma Lab** – Temperature simulation
- Control plasma temperature (300K - 10,000K)
- Watch ionization rates in real-time
- Experiment with different parameters

**Spectral Lab** – Wavelength analysis
- Adjust wavelength (380-750nm)
- See colors change dynamically
- Analyze full spectrum

### Step 3: Run Your Experiment

1. Adjust parameters using the controls
2. Click action buttons (IGNITE, HALT, ANALYZE, etc.)
3. Observe results in real-time
4. The experiment auto-saves to VAULT

### Step 4: Review in VAULT

1. Click your experiment in the VAULT sidebar
2. See full details and parameters
3. Mark important experiments as "Canon"
4. Check smart suggestions for related work

---

## 🤖 Working with Agents {#working-with-agents}

AGI-CAD includes three specialized AI agents that work together:

### Strategy Agent 🧠
- **Role:** High-level planning
- **When it activates:** Complex multi-step tasks
- **What it does:** Breaks down problems, coordinates other agents

### Coder Agent 💻
- **Role:** Implementation
- **When it activates:** Writing code, building features
- **What it does:** Implements solutions following best practices

### Researcher Agent 🔬
- **Role:** Analysis & patterns
- **When it activates:** Data analysis, pattern detection
- **What it does:** Finds insights, validates hypotheses

### Agent Status Panel

**Location:** Top-right corner (below Miss Avak)

**What you see:**
- 🟢 Green dot = Agent is active
- ⚪ Gray dot = Agent is idle
- 🔴 Red dot = Agent has an error

**Click to expand** and see:
- Current task
- Tasks completed
- Last active time
- Activity log

### How to Trigger Agents

Agents activate automatically when you:
1. Process experiments through VAULT
2. Request pattern analysis
3. Coordinate complex tasks
4. Use the `/api/agents/coordinate` endpoint

---

## 🗄️ Using the VAULT {#using-the-vault}

### What Gets Saved

**Everything.** Every experiment you run is automatically saved with:
- All parameters
- Results and outputs
- Timestamp
- Lab information
- Tags and metadata

### Organizing Experiments

**Mark as Canon**
- Click an experiment
- Click "Mark as Canon" button
- It gets the green ✓ Canon badge
- These become your reference points

**Add Tags**
- Experiments automatically get lab tags
- You can add custom tags (coming soon)
- Filter by tags in search

### Finding Similar Work

When you click an experiment, look for:

**"Similar Experiments"** section
- Shows experiments with >70% similarity
- Powered by Pinecone vector embeddings
- Click to compare approaches

**Smart Suggestions** (bottom of VAULT)
- 💡 Try This – Recommended parameters
- 🎯 Similar – Related experiments
- 📊 Pattern Detected – Workflow suggestions
- ⚡ Workflow – Automation opportunities

### Searching the VAULT

(Coming soon)
- Full-text search
- Filter by date, lab, tags
- Sort by relevance or recency
- Export to JSON/CSV

---

## 🔍 Pattern Recognition {#pattern-recognition}

AGI-CAD learns from your work and detects patterns:

### How It Works

1. **Every experiment** is converted to a vector embedding
2. **Pinecone** stores embeddings for fast similarity search
3. **Pattern detector** analyzes your workflow
4. **Suggestions** appear based on what works for you

### Types of Patterns

**Similarity Patterns**
- "You ran a similar experiment 2 days ago"
- Compare parameters and results
- Learn from past successes

**Workflow Patterns**
- "You often follow plasma with spectral"
- Suggests automation
- Saves time on repeated tasks

**Success Patterns**
- "Users with similar experiments found X works better"
- Community-driven insights
- Evidence-based suggestions

### Pattern Confidence

Each suggestion shows a confidence score:
- **90-100%** – Very high confidence, strong pattern
- **70-89%** – Good confidence, likely helpful
- **50-69%** – Moderate confidence, worth considering
- **<50%** – Low confidence, experimental

### Giving Feedback

Help the system learn:
- 👍 Thumbs up = "This was helpful"
- 👎 Thumbs down = "Not helpful"
- ✕ Dismiss = "Don't show this again"

Your feedback improves suggestions over time.

---

## 💬 Meet Miss Avak {#meet-miss-avak}

**Your AI Guide**

### Who She Is

Miss Avak is your mystical guide through AGI-CAD. She's:
- Wise and warm, with a hint of mystery
- Professional but approachable
- Always ready to help
- Powered by contextual AI

### Where to Find Her

**Top-right corner** – Look for the glowing golden avatar
- Hover to see tooltip
- Click to open dialog
- Red dot = She has a message for you

### What She Can Do

**Answer Questions**
- How do I use this feature?
- What's the difference between FORGE and VAULT?
- How do agents work?

**Provide Guidance**
- "Show me around" – Guided tour
- "What's new?" – Recent experiments
- "Agent status" – Agent activity
- "Help with [topic]" – Contextual help

**Contextual Awareness**

She knows:
- What time of day it is
- Your experiment history
- Recent successes and failures
- Current lab and area
- Agent activity

**Her Personality**

Expect:
- Thoughtful, wise advice
- Occasional dry humor
- Mystical language (but never cryptic)
- References to FORGE, VAULT, CANON
- Celebration of achievements

### Quick Actions

When you open Miss Avak's dialog, use buttons:
- 📖 **Show Guide** – Start tutorial
- ⚡ **Agent Status** – Check agents
- ✨ **What's New?** – Recent activity
- ❓ **Help** – Contextual assistance

### Chat History

Your conversations are saved:
- Last 10 exchanges preserved
- Scroll to review
- Minimizes without losing context

---

## 📜 Build Canon {#build-canon}

**Your Decision Log**

### What is Canon?

Canon is your **validated knowledge base** – decisions, principles, and patterns that have proven themselves.

### Location

**Right sidebar** – Click the 📜 icon to open

### Four States

**🔄 Exploring** (Gray)
- New ideas being tested
- Not yet validated
- Can be changed freely

**📌 Pinned** (Amber)
- Promising approaches
- Showing good results
- Ready for validation

**🔒 Locked** (Golden)
- Fully validated
- Confirmed to work
- Reference for future decisions

**⚠️ Deviated** (Orange)
- Intentional changes from canon
- Requires reason/documentation
- Tracked for learning

### How to Use Canon

**During Build/Development:**

1. **Create Entry** – Add decisions as you make them
2. **Pin** – Mark working approaches
3. **Lock** – Confirm validated patterns
4. **Deviate** – Document when you change course

**Example Workflow:**

```
🔄 "Try LangChain for agents"
   ↓ (works well)
📌 "LangChain for agents"
   ↓ (validated)
🔒 "LangChain.js for agent orchestration"
   ↓ (later need to change)
⚠️ "Switching to CrewAI for better Python integration"
    Reason: "Project pivoting to Python backend"
```

### Canon Types

**Decision** 🎯
- Technical choices
- Framework selections
- Architecture decisions

**Principle** 📐
- Design rules
- Coding standards
- Naming conventions

**Constraint** 🚧
- Limitations
- Requirements
- Boundaries

**Pattern** 🔁
- Recurring solutions
- Best practices
- Workflows

### Exporting Canon

Click **Download** icon to export as markdown:
- Organized by status
- Includes descriptions and reasons
- Date stamped
- Ready for documentation

---

## ⌨️ Keyboard Shortcuts {#keyboard-shortcuts}

(Coming soon in next phase)

**Navigation**
- `?` – Show help
- `Esc` – Close dialogs
- `/` – Focus search
- `Ctrl/Cmd + K` – Command palette

**Labs**
- `Ctrl/Cmd + 1-4` – Switch areas
- `Tab` – Next lab
- `Shift + Tab` – Previous lab

**VAULT**
- `Ctrl/Cmd + S` – Save experiment
- `Ctrl/Cmd + E` – Export
- `Ctrl/Cmd + F` – Find in VAULT

**Agents**
- `Ctrl/Cmd + Shift + A` – Open Agent Status
- `Ctrl/Cmd + Shift + M` – Open Miss Avak
- `Ctrl/Cmd + Shift + C` – Open Canon

---

## ❓ FAQ {#faq}

### General

**Q: Do I need API keys to use AGI-CAD?**
A: For full functionality (agents, embeddings), yes. But basic labs work without them.

**Q: Where is my data stored?**
A: Firestore (Google Cloud). All experiments are encrypted and tied to your account.

**Q: Can I use this offline?**
A: No, AGI-CAD requires an internet connection for AI features and data sync.

### Agents

**Q: How much do agent API calls cost?**
A: Depends on your provider (Anthropic/OpenAI). Typical experiment processing costs $0.01-0.05.

**Q: Can I use my own AI models?**
A: Yes, AGI-CAD supports Anthropic Claude, OpenAI GPT, and custom endpoints.

**Q: Why are agents sometimes idle?**
A: They activate on-demand for specific tasks. Idle = ready and waiting.

### VAULT

**Q: Is there a limit to experiments?**
A: Firestore has generous limits. Typical users can store 100,000+ experiments.

**Q: Can I delete experiments?**
A: Not yet, but coming soon. Everything is preserved by design.

**Q: What's the difference between Canon and regular experiments?**
A: Canon is a marker for important/validated work. It's organizational, not functional.

### Canon

**Q: Do I have to use Canon?**
A: No, it's optional. But it's helpful for tracking build decisions.

**Q: Can I have multiple canon documents?**
A: Currently one per user, but you can export multiple versions.

**Q: What if I disagree with locked canon?**
A: You can deviate – just document the reason.

---

## 🔧 Troubleshooting {#troubleshooting}

### Miss Avak Not Appearing

**Symptoms:** Avatar doesn't show in top-right corner

**Solutions:**
- Check screen width (hidden on mobile <768px)
- Clear localStorage: `localStorage.removeItem('miss-avak-state')`
- Refresh page
- Check browser console for errors

### Agents Stuck in "Active" State

**Symptoms:** Agents showing active but not completing tasks

**Solutions:**
- Check API keys in `.env.local`
- Verify internet connection
- Check `/api/agents/coordinate` endpoint
- Refresh page to reset state

### Smart Suggestions Not Loading

**Symptoms:** "No suggestions" message or infinite loading

**Solutions:**
- Verify Pinecone API key configured
- Check browser console for errors
- Need at least 3 experiments for patterns
- Embeddings may be processing (wait 30s)

### Canon Sidebar Empty

**Symptoms:** No entries showing in Canon sidebar

**Solutions:**
- Canon initializes with system entries on first load
- Check browser console for errors
- Clear localStorage and refresh
- Verify Firebase connection

### Experiments Not Saving

**Symptoms:** Experiments disappear after refresh

**Solutions:**
- Verify Firebase configuration
- Check authentication (must be logged in)
- Check browser console for Firestore errors
- Verify internet connection

### Performance Issues

**Symptoms:** Slow page load, laggy animations

**Solutions:**
- Close unused canon/agent panels
- Clear browser cache
- Reduce number of active labs
- Check CPU usage (Three.js can be intensive)

---

## 🎓 Learn More

- **Architecture Docs:** See `/src/docs/ARCHITECTURE.md`
- **API Reference:** Coming soon
- **Video Tutorials:** Coming soon
- **Discord Community:** Coming soon

---

## 🙌 Support

Need help? Contact through:
- GitHub Issues
- Email: support@agi-cad.com (placeholder)
- Miss Avak in-app (she might actually help!)

---

**Welcome to the FORGE. May your experiments be fruitful and your canon grow strong.** ✨
