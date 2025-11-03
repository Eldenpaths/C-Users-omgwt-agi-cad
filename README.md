# ⬡ AGI-CAD

**Symbolic Operating System for AI-Powered Research**

A Next.js-powered platform for running experiments, coordinating AI agents, and building validated knowledge bases.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4-orange)](https://firebase.google.com/)

---

## 🌟 What is AGI-CAD?

AGI-CAD is a **Symbolic Operating System (SOS)** that combines:
- 🔬 **Extensible Lab System** – Run experiments across Science, Crypto, Design, and custom domains
- 🤖 **AI Agent Orchestration** – Three specialized agents (Strategy, Coder, Researcher) powered by LangChain.js
- 🧠 **Vector Embeddings** – Semantic search and pattern recognition with Pinecone
- 📜 **Canon Tracking** – Build and validate knowledge as you work
- 💬 **AI Guide (Miss Avak)** – Contextual assistance throughout your journey

---

## 🎥 Demo

(Coming soon: Screenshots and video walkthrough)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- Firebase project
- (Optional) Anthropic or OpenAI API key
- (Optional) Pinecone account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agi-cad.git
cd agi-cad

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your keys
# (see Environment Variables section below)

# Run development server
pnpm dev
```

Visit [http://localhost:3000/sos](http://localhost:3000/sos)

---

## 🔧 Environment Variables

Create a `.env.local` file with the following:

```bash
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@...iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Provider (Choose one or both)
ANTHROPIC_API_KEY=sk-ant-...          # For Claude models
OPENAI_API_KEY=sk-...                 # For GPT models and embeddings

# Pinecone (Required for vector embeddings)
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1        # or your region
PINECONE_INDEX_NAME=agi-cad-experiments

# Optional
NODE_ENV=development
```

### Getting API Keys

**Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project or use existing
3. Get config from Project Settings
4. Download service account JSON for admin

**Anthropic:**
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create API key
3. Free tier: $5 credit

**OpenAI:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Pay-as-you-go pricing

**Pinecone:**
1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create index: `agi-cad-experiments`
3. Dimension: 1536 (for OpenAI ada-002)
4. Metric: cosine
5. Free tier: 1M vectors

---

## 📁 Project Structure

```
agi-cad/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── agents/             # Agent coordination
│   │   │   └── vault/              # Experiment processing
│   │   ├── sos/                    # Main SOS dashboard
│   │   └── ...
│   ├── components/
│   │   └── sos/
│   │       ├── MissAvak/           # AI Guide components
│   │       ├── AgentStatus.tsx     # Agent monitoring panel
│   │       ├── CanonSidebar.tsx    # Canon tracking UI
│   │       └── SmartSuggestions.tsx # AI-powered suggestions
│   ├── lib/
│   │   ├── agents/                 # Agent system
│   │   │   ├── agent-config.ts     # Agent definitions
│   │   │   ├── agent-orchestrator.ts # Coordination logic
│   │   │   └── miss-avak/          # Miss Avak personality
│   │   ├── embeddings/             # Vector operations
│   │   │   └── vector-service.ts   # Pinecone integration
│   │   ├── events/                 # Event processors
│   │   │   └── vault-processor.ts  # Experiment processing
│   │   ├── labs/                   # Lab system
│   │   │   ├── registry.ts         # Lab registry
│   │   │   ├── system-labs.ts      # Built-in labs
│   │   │   └── components/         # Lab implementations
│   │   ├── canon/                  # Canon tracking
│   │   │   └── canon-tracker.ts    # Decision logging
│   │   └── firestore/              # Database
│   ├── hooks/                      # React hooks
│   ├── docs/                       # Documentation
│   └── ...
├── public/                         # Static assets
├── .env.local                      # Environment variables (create this)
├── package.json
└── README.md
```

---

## 🏗️ Architecture

### Three Core Systems

**1. FORGE (Creation)**
- Extensible lab system
- Interactive experiments
- Real-time visualizations
- Multi-domain support

**2. VAULT (Persistence)**
- Automatic experiment storage
- Vector embeddings for similarity
- Smart suggestions
- Pattern detection

**3. CANON (Knowledge)**
- Decision tracking
- Validation workflow
- Export capability
- Build history

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5.9
- Tailwind CSS
- Framer Motion (animations)
- Three.js (3D visualizations)

**Backend:**
- Next.js API Routes
- Firebase Firestore
- Firebase Admin SDK

**AI/ML:**
- LangChain.js (agent orchestration)
- Anthropic Claude / OpenAI GPT (LLMs)
- Pinecone (vector database)
- OpenAI Embeddings (text-embedding-3-small)

**State Management:**
- Zustand (global state)
- React Context (auth)
- React hooks (local state)

---

## 🎯 Key Features

### Multi-Agent System

Three specialized agents coordinate through LangChain:

**Strategy Agent** 🧠
- High-level planning
- Task decomposition
- Result synthesis

**Coder Agent** 💻
- Implementation
- Code generation
- Best practices

**Researcher Agent** 🔬
- Data analysis
- Pattern recognition
- Research validation

### Vector Embeddings

Every experiment is embedded as a 1536-dimensional vector:
- Semantic similarity search
- Find related experiments (>70% similarity)
- Pattern detection across lab boundaries
- AI-powered suggestions

### Extensible Labs

Add new labs in 3 steps (~30 lines of code):

```typescript
// 1. Create component
export default function MyLab() {
  return <div>My experiment UI</div>;
}

// 2. Register lab
registerLab({
  id: 'my-lab',
  name: 'My Lab',
  component: MyLab,
  category: 'custom',
  // ...
});

// 3. Add to area
// Done! Lab appears in SOS
```

### Canon Tracking

Track build decisions through four states:
- 🔄 **Exploring** – New ideas
- 📌 **Pinned** – Validated
- 🔒 **Locked** – Canonical
- ⚠️ **Deviated** – Intentional changes

Export as markdown for documentation.

---

## 📚 Documentation

- **[User Guide](src/docs/USER_GUIDE.md)** – How to use AGI-CAD
- **[Architecture](src/docs/ARCHITECTURE.md)** – System design deep-dive
- **[API Reference](src/docs/API.md)** – API endpoints (coming soon)
- **[Contributing](CONTRIBUTING.md)** – How to contribute (coming soon)

---

## 🛠️ Development

### Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Lint code

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
```

### Adding a New Lab

1. Create component in `src/lib/labs/components/`
2. Register in `src/lib/labs/system-labs.ts`
3. Test in SOS dashboard
4. Document in user guide

### Working with Agents

```typescript
import { coordinateAgents } from '@/lib/agents/agent-orchestrator';

const result = await coordinateAgents({
  prompt: 'Design a token economics model',
  verbose: true,
});

console.log(result.synthesis); // Final coordinated response
```

### Vector Operations

```typescript
import { vectorService } from '@/lib/embeddings/vector-service';

// Generate embedding
const vector = await vectorService.generateEmbedding('experiment description');

// Find similar
const similar = await vectorService.findSimilarByText('plasma temperature', 5);
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:phase10b        # Phase 10B tests
pnpm test:drift           # Drift map tests
pnpm test:telemetry       # Telemetry tests
pnpm test:ai-nexus        # AI Nexus tests

# Coverage
pnpm test:coverage
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Add environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add PINECONE_API_KEY
# ... (add all from .env.local)

# Deploy to production
vercel --prod
```

### Other Platforms

AGI-CAD works on any platform supporting Next.js:
- AWS Amplify
- Netlify
- Railway
- Docker

See Next.js deployment docs for details.

---

## 🎨 Customization

### Theming

The mystical golden aesthetic is defined in:
- `src/app/globals.css` – Global styles
- Tailwind config – Color palette
- Component-level styling – Framer Motion animations

To customize:
1. Update Tailwind config colors
2. Adjust gradient values in components
3. Modify animation timings

### Adding AI Providers

AGI-CAD supports multiple AI providers:

```typescript
// src/lib/agents/agent-config.ts
const model = new ChatAnthropic({
  modelName: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Or OpenAI
const model = new ChatOpenAI({
  modelName: 'gpt-4-turbo',
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See CONTRIBUTING.md (coming soon) for guidelines.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

**Built with:**
- [Next.js](https://nextjs.org/)
- [LangChain.js](https://js.langchain.com/)
- [Pinecone](https://www.pinecone.io/)
- [Firebase](https://firebase.google.com/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Framer Motion](https://www.framer.com/motion/)

**Inspired by:**
- Symbolic AI research
- AGI safety frameworks
- Mystical knowledge systems
- Research lab workflows

---

## 📞 Contact

- **GitHub Issues:** Bug reports and feature requests
- **Email:** support@agi-cad.com (placeholder)
- **Discord:** Coming soon

---

## 🗺️ Roadmap

**Phase 18 (Current):** ✅ Complete
- Multi-agent orchestration
- Vector embeddings
- Miss Avak AI guide
- Canon tracking

**Phase 19-20 (Next 2-4 weeks):**
- User-created labs
- Agent sandbox
- Lab marketplace
- Advanced pattern detection

**Phase 21-23 (Months 2-4):**
- Graph neural networks (Neo4j)
- Reinforcement learning
- Multi-modal inputs
- Collaborative features

**Phase 24+ (Months 6+):**
- Full AGI scaffolding
- Self-improving agents
- Knowledge graph reasoning
- Developer SDK

---

## 💎 Support the Project

If AGI-CAD helps your research:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve docs
- 🤝 Contribute code

---

**Welcome to the FORGE. Build something beautiful.** ✨

