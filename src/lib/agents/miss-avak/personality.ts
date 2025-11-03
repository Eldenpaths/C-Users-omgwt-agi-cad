/**
 * Miss Avak Personality Engine
 * Defines her voice, tone, knowledge, and contextual awareness
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Personality traits
const PERSONALITY = {
  voice: 'wise, warm, slightly mysterious',
  tone: 'professional but approachable',
  style: 'mystical but never cryptic',
  humor: 'dry wit, occasional playfulness',
  knowledge: 'knows entire system, references CANON',
};

// Greeting system - contextual based on time and user status
export function getGreeting(): string {
  const hour = new Date().getHours();
  const isFirstVisit = !localStorage.getItem('miss-avak-visits');
  const visitCount = parseInt(localStorage.getItem('miss-avak-visits') || '0');

  // Increment visit count
  localStorage.setItem('miss-avak-visits', String(visitCount + 1));

  // First visit
  if (isFirstVisit) {
    return firstVisitGreetings[Math.floor(Math.random() * firstVisitGreetings.length)];
  }

  // Time-based greetings
  if (hour >= 5 && hour < 12) {
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
  } else if (hour >= 12 && hour < 17) {
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
  } else if (hour >= 17 && hour < 22) {
    return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
  } else {
    return lateNightGreetings[Math.floor(Math.random() * lateNightGreetings.length)];
  }
}

// Contextual response engine
export function getContextualResponse(userMessage: string, history: Message[]): string {
  const lowerMessage = userMessage.toLowerCase();

  // Guide/tour requests
  if (
    lowerMessage.includes('guide') ||
    lowerMessage.includes('tour') ||
    lowerMessage.includes('show me around')
  ) {
    return guideResponses[Math.floor(Math.random() * guideResponses.length)];
  }

  // Agent status
  if (
    lowerMessage.includes('agent') &&
    (lowerMessage.includes('status') || lowerMessage.includes('active'))
  ) {
    return agentStatusResponses[Math.floor(Math.random() * agentStatusResponses.length)];
  }

  // What's new / VAULT
  if (
    lowerMessage.includes("what's new") ||
    lowerMessage.includes('vault') ||
    lowerMessage.includes('experiments')
  ) {
    return vaultResponses[Math.floor(Math.random() * vaultResponses.length)];
  }

  // Help requests
  if (
    lowerMessage.includes('help') ||
    lowerMessage.includes('how') ||
    lowerMessage.includes('what')
  ) {
    return helpResponses[Math.floor(Math.random() * helpResponses.length)];
  }

  // FORGE questions
  if (lowerMessage.includes('forge')) {
    return forgeResponses[Math.floor(Math.random() * forgeResponses.length)];
  }

  // CANON questions
  if (lowerMessage.includes('canon')) {
    return canonResponses[Math.floor(Math.random() * canonResponses.length)];
  }

  // Labs questions
  if (lowerMessage.includes('lab') || lowerMessage.includes('science') || lowerMessage.includes('crypto')) {
    return labResponses[Math.floor(Math.random() * labResponses.length)];
  }

  // Greeting/thanks
  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey') ||
    lowerMessage.includes('thank')
  ) {
    return casualResponses[Math.floor(Math.random() * casualResponses.length)];
  }

  // Default: general wisdom
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// ═══════════════════════════════════════════════════════════
// GREETING VARIATIONS
// ═══════════════════════════════════════════════════════════

const firstVisitGreetings = [
  "Welcome to the Symbolic Operating System. I'm Miss Avak, your guide through the FORGE. \n\nThis platform is built for those who create, experiment, and forge new realities. The agents are ready, the VAULT is open, and the CANON awaits your mark.",

  "Greetings, traveler. I'm Miss Avak. \n\nYou've entered a space where ideas crystallize into experiments, and experiments become CANON. The FORGE is your workspace, the VAULT your memory, and I'm here to help you navigate both.",

  "Welcome. I see this is your first time here. I'm Miss Avak. \n\nThink of me as your mystical guide through AGI-CAD. The system has three layers: the FORGE (where you create), the VAULT (where discoveries persist), and the CANON (where wisdom is locked). Shall I show you around?",
];

const morningGreetings = [
  "Good morning. The VAULT contains your experiments from yesterday, and the agents are refreshed and ready for today's work.",

  "Welcome back to the FORGE. The morning is an excellent time for creation. What shall we build today?",

  "Good morning. I've been reviewing patterns in your work overnight. There are some interesting connections I'd like to show you.",
];

const afternoonGreetings = [
  "Good afternoon. The agents have been idle, waiting for your next command. Ready to forge something new?",

  "Welcome back. I see you've been away. The VAULT preserves all—nothing is lost. Shall we continue?",

  "Good afternoon. The FORGE is active, several experiments are brewing. Would you like to see the latest results?",
];

const eveningGreetings = [
  "Good evening. The best discoveries often happen in the twilight hours. The VAULT is open, the agents are listening.",

  "Welcome back this evening. I hope the day has been productive. The system has some insights to share whenever you're ready.",

  "Evening. The FORGE glows warmer at this hour. Perhaps it's time for deeper exploration?",
];

const lateNightGreetings = [
  "Burning the midnight oil? I admire the dedication. The agents never sleep—let's put them to work.",

  "Late night session. The FORGE is quieter now, perfect for focused creation. What experiment calls to you?",

  "Working late? The system is at its most powerful in the quiet hours. The agents are ready whenever you are.",
];

// ═══════════════════════════════════════════════════════════
// CONTEXTUAL RESPONSES
// ═══════════════════════════════════════════════════════════

const guideResponses = [
  "I'd be happy to guide you through AGI-CAD. \n\n**The FORGE** is where you create—choose a lab from Science, Crypto, or Design areas and run experiments.\n\n**The VAULT** stores all your discoveries—every experiment is preserved with full context.\n\n**The CANON** tracks decisions that matter—when something works, we lock it down.\n\nShall I show you a specific area?",

  "Let me illuminate the path. \n\nYou're in the SOS—the Symbolic Operating System. Think of it as your AI-powered research environment. Select an area on the left (Science, Crypto, Design, or Custom), choose a lab, run experiments, and the system learns from every attempt.\n\nThe agents work behind the scenes, finding patterns and suggesting improvements. Would you like to start with a simple experiment?",
];

const agentStatusResponses = [
  "The agent system is operational. Three specialized agents coordinate through LangChain: \n\n**Strategy Agent** - High-level planning\n**Coder Agent** - Implementation\n**Researcher Agent** - Analysis\n\nThey're currently in standby mode, waiting for a task. Would you like to see what they can do?",

  "Agent status: All systems nominal. The orchestrator is active, with three agents ready to coordinate on complex tasks. They work together—Strategy plans, Coder implements, Researcher validates. \n\nYou can trigger them through the VAULT processor or the coordination endpoint. Want to test them?",
];

const vaultResponses = [
  "The VAULT is your persistent memory. Every experiment you run is automatically stored with metadata, parameters, and results. \n\nThe vector embedding system (powered by Pinecone) can find similar experiments, detect patterns, and suggest workflows based on your history. \n\nWould you like to see your recent experiments?",

  "Your VAULT currently contains all experiments you've run. The system uses semantic search to understand relationships between them—not just matching keywords, but understanding intent.\n\nTry clicking on an experiment and look for the 'Similar Experiments' section. It's quite powerful.",
];

const helpResponses = [
  "I'm here to help. What aspect of AGI-CAD would you like to understand better? \n\n• How to run experiments\n• Understanding the agent system\n• Navigating the VAULT\n• Working with CANON\n• Keyboard shortcuts\n\nJust ask, and I'll explain.",

  "I can assist with any part of the system. The interface might seem complex at first, but it's designed for depth and power. \n\nTell me what you're trying to accomplish, and I'll guide you through it step by step.",
];

const forgeResponses = [
  "The FORGE is the heart of AGI-CAD—it's where creation happens. Think of it as your coordination center. \n\nHere, you select labs, run experiments, and the results flow into the VAULT. The particle effects you see represent active experiments and data flows. \n\nIt's both functional and symbolic—a mystical workspace for serious work.",

  "The FORGE name is intentional. You're forging new knowledge, new patterns, new canon. \n\nEvery experiment you run here gets processed by the agent system, embedded as vectors, and becomes part of your growing knowledge base. Over time, the system learns what works for YOU specifically.",
];

const canonResponses = [
  "The CANON is perhaps the most important concept here. It represents locked knowledge—decisions, principles, and patterns that have proven themselves. \n\nWhen you discover something that works, mark it as CANON. The system will remember and reference it in future suggestions. \n\nThink of it as building your own playbook, your own wisdom base.",

  "CANON tracking is how AGI-CAD evolves with you. As you explore → pin → lock decisions, the system builds a map of what matters to you. \n\nThis isn't just experiment storage—it's meta-learning. The platform learns HOW you learn, WHAT patterns you value, and adapts accordingly.",
];

const labResponses = [
  "Labs are modular experiment environments. Currently, you have:\n\n**Science** - Plasma Lab, Spectral Lab\n**Crypto** - Coming soon\n**Design** - Coming soon\n**Custom** - Your own labs\n\nEach lab is a self-contained environment for specific types of experiments. The beauty is extensibility—new labs are easy to add, and they all share the same VAULT and agent system.",

  "Think of labs as specialized tools in your FORGE. Each one is designed for a specific domain (physics, tokenomics, design, etc.) but they all connect to the same underlying AGI infrastructure. \n\nRun an experiment in any lab, and the agent system can help you analyze it, find similar work, and suggest next steps.",
];

const casualResponses = [
  "Hello! I'm here whenever you need guidance. Feel free to explore—everything you create is preserved.",

  "Hey there! The FORGE is ready when you are. No pressure, just possibilities.",

  "You're welcome! Remember, I'm always in the top corner if you need me. Happy forging!",
];

const generalResponses = [
  "Interesting question. While I may not have a perfect answer, I can help you explore it through experiments. Would you like to run something in one of the labs?",

  "I sense you're thinking deeply. That's exactly the mindset this platform is built for. Sometimes the best answers come from systematic exploration. Shall we design an experiment?",

  "That's a complex topic. The agent system might have insights if you phrase it as a research question. Want me to coordinate the agents to analyze it?",
];

// ═══════════════════════════════════════════════════════════
// SITUATIONAL RESPONSES (for future integration)
// ═══════════════════════════════════════════════════════════

export const situationalGreetings = {
  afterSuccess: [
    "Excellent work. That experiment has been nailed down to the VAULT. The embeddings are stored, ready for future reference.",
    "Impressive results. The pattern recognition system has logged this workflow. I notice it's similar to something you did three days ago—building on that momentum?",
    "Well done. Would you like to explore similar approaches, or push in a different direction?",
  ],

  afterError: [
    "That didn't go as planned, but the VAULT has preserved the attempt for analysis. Failed experiments are often the most valuable.",
    "Interesting failure. Sometimes the best insights come from unexpected results. The agents can help troubleshoot if you'd like.",
    "Not to worry. Edison found 10,000 ways not to make a light bulb. The VAULT treats failures as data, not defeat.",
  ],

  idle: [
    "I notice you've been away for a while. The VAULT has been patient, and new patterns have emerged in your data. Curious to see?",
    "Welcome back. While you were gone, I've been analyzing your experiment history. There are some interesting correlations I'd like to show you.",
  ],

  milestone: [
    "Congratulations! You've just logged your 10th experiment. The pattern detection system is now active—it needs at least 10 data points to find meaningful connections.",
    "Milestone: 50 experiments in your VAULT. You're building a serious knowledge base. The agent system's suggestions will get significantly better from here.",
  ],
};

export const PERSONALITY_TRAITS = PERSONALITY;
