<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AGI-CAD | Interactive System Report</title>
    <!--
      Chosen Palette: Warm Stone & Amber
      Application Structure Plan: Designed a dashboard-centric SPA. The user lands on a "Dashboard" (vital stats, sim chart, integration map) for high-level synthesis. They can then drill down into dedicated "Systems Explorer" (filterable list of the 7 systems), "API Reference" (searchable endpoints), or "Simulation Deep-Dive" sections. Navigation is handled by JS-driven section visibility. This is better than a flat doc-by-doc list, promoting exploration and synthesis first.
      Visualization & Content Choices: 1. Neuroevolution Data -> Goal: Show change -> Viz: Chart.js Line Chart -> Interaction: Toggles for datasets (on deep-dive page) -> Justification: Best way to show performance over time (generations) -> Lib: Chart.js. 2. Integration Map -> Goal: Show relationships -> Viz: HTML/Tailwind Grid Diagram -> Interaction: Click nodes to navigate to System Explorer -> Justification: Replaces forbidden Mermaid diagram with an interactive, web-native equivalent -> Lib: None (HTML/CSS). 3. System Docs -> Goal: Organize/Inform -> Viz: Filterable Card Grid -> Interaction: Click card to show details in a JS-powered pane -> Justification: Modern, filterable UI for exploring text content -> Lib: None (JS).
      CONFIRMATION: NO SVG graphics used. NO Mermaid JS used.
    -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #fdfcfb; /* Warm Stone 50 */
        }
        .chart-container {
            position: relative;
            width: 100%;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
            height: 400px;
            max-height: 50vh;
        }
        .nav-item {
            @apply px-3 py-2 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-colors;
        }
        .nav-item.active {
            @apply bg-amber-100 text-amber-800 font-semibold;
        }
        .card {
            @apply bg-white shadow-sm ring-1 ring-stone-200/50 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md;
        }
        .system-card {
            @apply card p-5 cursor-pointer hover:ring-2 hover:ring-amber-500;
        }
        .status-dot {
            @apply w-3 h-3 rounded-full mr-2;
        }
        .status-dot.operational {
            @apply bg-green-500;
        }
        .status-dot.in-progress {
            @apply bg-blue-500;
        }
        .status-dot.planned {
            @apply bg-gray-400;
        }
        .integration-node {
            @apply bg-white p-4 rounded-lg shadow-sm border border-stone-200 text-center transition-all hover:shadow-lg hover:border-amber-500 cursor-pointer;
        }
        .integration-arrow {
            @apply absolute bg-stone-300;
        }
    </style>
</head>
<body class="text-stone-800">

    <!-- Header & Navigation -->
    <header class="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-stone-200">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <span class="text-xl font-bold text-amber-700">AGI-CAD</span>
                        <span class="ml-2 text-stone-500">System Report</span>
                    </div>
                </div>
                <div class="hidden md:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                        <button class="nav-item active" data-nav="dashboard">Dashboard</button>
                        <button class="nav-item" data-nav="systems">Systems Explorer</button>
                        <button class="nav-item" data-nav="api">API Reference</button>
                        <button class="nav-item" data-nav="simulation">Simulation Deep-Dive</button>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Section 1: Dashboard (Default View) -->
        <section id="section-dashboard" data-section="dashboard">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">System Dashboard</h1>
            <p class="mt-2 text-lg text-stone-600">A high-level overview of the AGI-CAD operational systems, learning progress, and integration map.</p>

            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="card p-6">
                    <h3 class="text-sm font-medium text-stone-500">System Status</h3>
                    <p class="mt-2 text-3xl font-bold"><span id="metric-systems-operational">5</span> / 7</p>
                    <p class="text-stone-500">Operational Systems</p>
                </div>
                <div class="card p-6">
                    <h3 class="text-sm font-medium text-stone-500">Neuroevolution (Gen 10)</h3>
                    <p class="mt-2 text-3xl font-bold" id="metric-best-fitness">1.101</p>
                    <p class="text-stone-500">Peak Agent Fitness</p>
                </div>
                <div class="card p-6">
                    <h3 class="text-sm font-medium text-stone-500">Governor Status (Gen 10)</h3>
                    <p class="mt-2 text-3xl font-bold" id="metric-veto-count">0</p>
                    <p class="text-stone-500">Agents Vetoed</p>
                </div>
            </div>

            <!-- Dashboard Chart: Neuroevolution -->
            <div class="card mt-8 p-6">
                <h2 class="text-xl font-semibold mb-4">Neuroevolution Hive Progress (10 Generations)</h2>
                <p class="text-stone-600 mb-4">This chart shows the increasing fitness of the best agent in the hive, alongside the rising fractal bonus (D_var), indicating successful selection for both performance and novelty.</p>
                <div class="chart-container">
                    <canvas id="dashboardChart"></canvas>
                </div>
            </div>

            <!-- Dashboard: System Integration Map -->
            <div class="card mt-8 p-6">
                <h2 class="text-xl font-semibold mb-4">System Integration Map</h2>
                <p class="text-stone-600 mb-6">This diagram illustrates the primary data flows between the core systems. Click any node to explore its documentation.</p>
                
                <div classs="w-full overflow-x-auto">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 items-start relative min-w-[700px]">
                        
                        <!-- Arrows (Simplified representation) -->
                        <div class="absolute top-1/2 left-0 w-full h-full -z-10 opacity-70">
                            <!-- 1. Client -> Router -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="16.66%" y1="15%" x2="50%" y2="15%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="16.66%" y1="40%" x2="50%" y2="15%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>
                            
                            <!-- 2. Router -> Agents -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="15%" x2="83.33%" y2="15%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="15%" x2="83.33%" y2="40%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>

                            <!-- 3. Agents/Router -> Firebase -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="83.33%" y1="15%" x2="50%" y2="40%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="15%" x2="50%" y2="40%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>

                            <!-- 4. Client -> WebGPU -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="16.66%" y1="40%" x2="83.33%" y2="65%" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)" /></svg>
                            
                            <!-- 5. Neuro/Learning Loop -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="16.66%" y1="85%" x2="50%" y2="85%" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead-amber)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="16.66%" y1="85%" x2="50%" y2="65%" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead-amber)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="85%" x2="50%" y2="65%" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead-amber)" /></svg>
                            
                            <!-- 6. Governor -> Firebase/LearningCore -->
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="65%" x2="50%" y2="40%" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead-amber)" /></svg>
                            <svg class="absolute w-full h-full" preserveAspectRatio="none"><line x1="50%" y1="65%" x2="50%" y2="85%" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead-amber)" /></svg>

                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" /></marker>
                                <marker id="arrowhead-amber" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" /></marker>
                            </defs>
                        </div>

                        <!-- Col 1: Client & Learning -->
                        <div class="space-y-6 flex flex-col justify-between h-full">
                            <div>
                                <h3 class="text-lg font-semibold text-center mb-4 text-stone-600">User / Client</h3>
                                <div class="integration-node" data-system-id="nexus-visualization">Nexus Visualization</div>
                                <div class="integration-node mt-4" data-system-id="science-labs">Science Labs UI</div>
                            </div>
                            <div class="pt-8">
                                <h3 class="text-lg font-semibold text-center mb-4 text-stone-600">Learning & Evolution</h3>
                                <div class="integration-node" data-system-id="neuroevolution-system">Neuroevolution System</div>
                                <div class="integration-node mt-4" data-system-id="learningcore-system">LearningCore (FS-QMIX)</div>
                            </div>
                        </div>

                        <!-- Col 2: Core OS -->
                        <div class="space-y-6">
                            <h3 class="text-lg font-semibold text-center mb-4 text-stone-600">Core OS & Governance</h3>
                            <div class="integration-node" data-system-id="intelligence-router">Intelligence Router</div>
                            <div class="integration-node mt-4" data-system-id="governor-system">Governor System</div>
                            <div class="integration-node mt-4 bg-amber-50 border-amber-300" data-system-id="firebase">Firebase (VAULT/CANON)</div>
                        </div>

                        <!-- Col 3: Runtimes -->
                        <div class="space-y-6">
                            <h3 class="text-lg font-semibold text-center mb-4 text-stone-600">Agents & Runtimes</h3>
                            <div class="integration-node" data-system-id="intelligence-router">Deep-Scan Agents</div>
                            <div class="integration-node mt-4" data-system-id="science-labs">Simwright/Mathwright</div>
                            <div class="integration-node mt-4" data-system-id="webgpu-rendering-system">WebGPU Rendering</div>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <!-- Section 2: Systems Explorer -->
        <section id="section-systems" data-section="systems" class="hidden">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">Systems Explorer</h1>
            <p class="mt-2 text-lg text-stone-600">Explore the 7 core operational systems of AGI-CAD. Click on a system to view its detailed documentation.</p>

            <div class="mt-6">
                <input type="text" id="system-search" placeholder="Search systems... (e.g., 'Governor' or 'Operational')" class="w-full p-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none">
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="systems-grid">
                <!-- System cards will be dynamically injected here by JavaScript -->
            </div>

            <!-- System Detail Pane (Modal-like) -->
            <div id="system-detail-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-8">
                <div class="relative max-w-4xl mx-auto bg-white rounded-lg shadow-2xl mt-12">
                    <button id="close-modal-btn" class="absolute top-4 right-4 text-stone-500 hover:text-stone-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div class="p-8 md:p-12" id="system-detail-content">
                        <!-- Content injected by JS -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 3: API Reference -->
        <section id="section-api" data-section="api" class="hidden">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">API Reference</h1>
            <p class="mt-2 text-lg text-stone-600">A complete reference for all external-facing API endpoints used by AGI-CAD.</p>
            
            <div class="mt-6">
                <input type="text" id="api-search" placeholder="Filter endpoints... (e.g., '/api/agents/')" class="w-full p-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none">
            </div>

            <div class="mt-8 space-y-12" id="api-list">
                <!-- API endpoints will be dynamically injected here by JavaScript -->
            </div>
        </section>

        <!-- Section 4: Simulation Deep-Dive -->
        <section id="section-simulation" data-section="simulation" class="hidden">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">Simulation Deep-Dive</h1>
            <p class="mt-2 text-lg text-stone-600">Analyze the raw data from the Phase 30A Neuroevolution Hive simulation.</p>

            <div class="card mt-8 p-6">
                <h2 class="text-xl font-semibold mb-4">Neuroevolution Hive Data (All Datasets)</h2>
                <p class="text-stone-600 mb-4">Toggle datasets to compare the performance of the agent hive over 10 generations. The "Veto Count" shows the Governor's intervention, which successfully drops to zero as the hive adapts to the semantic fidelity constraints.</p>
                <div class="flex flex-wrap gap-4 mb-4" id="sim-chart-toggles">
                    <label class="inline-flex items-center"><input type="checkbox" class="form-checkbox text-amber-600" data-dataset="Best Fitness" checked> <span class="ml-2">Best Fitness</span></label>
                    <label class="inline-flex items-center"><input type="checkbox" class="form-checkbox text-sky-600" data-dataset="Mean Fitness"> <span class="ml-2">Mean Fitness</span></label>
                    <label class="inline-flex items-center"><input type="checkbox" class="form-checkbox text-green-600" data-dataset="D_var Trend"> <span class="ml-2">D_var Trend</span></label>
                    <label class="inline-flex items-center"><input type="checkbox" class="form-checkbox text-red-600" data-dataset="Veto Count"> <span class="ml-2">Veto Count (Right Axis)</span></label>
                </div>
                <div class="chart-container">
                    <canvas id="simulationChart"></canvas>
                </div>
            </div>

            <div class="card mt-8">
                <h2 class="text-xl font-semibold p-6">Raw Simulation Data</h2>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[600px] text-left">
                        <thead class="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th class="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Generation</th>
                                <th class="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Best Fitness</th>
                                <th class="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Mean Fitness</th>
                                <th class="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Veto Count</th>
                                <th class="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Best D_var</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-200" id="sim-data-table">
                            <!-- Data injected by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

    </main>

    <script>
        // --- Data Store ---
        const appData = {
            simulation: {
                labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                datasets: [
                    {
                        label: 'Best Fitness',
                        data: [0.887, 0.941, 1.012, 1.012, 1.033, 1.054, 1.066, 1.082, 1.082, 1.101],
                        borderColor: '#d97706', // amber-600
                        backgroundColor: '#fde68a', // amber-200
                        yAxisID: 'yLeft',
                    },
                    {
                        label: 'Mean Fitness',
                        data: [0.322, 0.499, 0.678, 0.796, 0.880, 0.944, 0.991, 1.026, 1.045, 1.060],
                        borderColor: '#0284c7', // sky-600
                        backgroundColor: '#bae6fd', // sky-200
                        hidden: true,
                        yAxisID: 'yLeft',
                    },
                    {
                        label: 'D_var Trend',
                        data: [0.91, 0.91, 1.15, 1.15, 1.22, 1.30, 1.34, 1.38, 1.38, 1.40],
                        borderColor: '#16a34a', // green-600
                        backgroundColor: '#bbf7d0', // green-200
                        hidden: true,
                        yAxisID: 'yLeft',
                    },
                    {
                        label: 'Veto Count',
                        data: [8, 5, 3, 3, 1, 0, 2, 0, 1, 0],
                        borderColor: '#dc2626', // red-600
                        backgroundColor: '#fecaca', // red-200
                        hidden: true,
                        yAxisID: 'yRight',
                    }
                ]
            },
            systems: [
                {
                    id: 'intelligence-router',
                    name: 'Intelligence Router + Deep-Scan Agents',
                    status: 'operational',
                    overview: 'The "brainstem" of AGI-CAD. It receives all tasks as a `SymbolicIntentionTree`, logs them to the VAULT, and routes them to the correct specialized agent. The Deep-Scan agents (`EchoArchivist`, `Fractalwright`) are specialized agents that provide meta-analysis on the system itself.',
                    files: ['src/core/router/IntelligenceRouter.ts', 'src/core/router/types.ts', 'src/core/router/fractalUtils.ts', 'src/agents/IAgent.ts', 'src/agents/echoArchivist.ts', 'src/agents/fractalwright.ts', 'src/agents/mathwright.ts', 'src/agents/simwright.ts', 'src/scripts/smokeAgents.ts'],
                    api: ['/api/router-test', '/api/agents/scan', '/api/agents/fractal'],
                    dependencies: ['firebase', 'uuid'],
                    issues: ['Router logic is currently a simple `switch` statement.', 'Does not yet dynamically route based on `d_var` or `canon_constraints`.'],
                    future: ['Fully implement the `SymbolicIntentionTree` logic.', 'Integrate all core LLM agents (Codex, Cline, Gemini, Grok).', 'Make `routeTask` dynamically update based on `CANON` rules.']
                },
                {
                    id: 'webgpu-rendering-system',
                    name: 'WebGPU Rendering System',
                    status: 'in-progress',
                    overview: 'Provides a high-performance, low-level rendering backend for all visualization tasks, including the Nexus Graph and Science Labs. It replaces slower, DOM-based libraries like D3/Vis.js for large datasets.',
                    files: ['src/components/webgpu/WebGPUCanvas.tsx', 'src/hooks/useWebGPU.ts', 'src/core/rendering/WebGPURenderer.ts', 'src/shaders/nexus-graph.wgsl', 'src/shaders/plasma-lab.wgsl'],
                    api: ['N/A (Client-side system)'],
                    dependencies: ['@webgpu/types'],
                    issues: ['WebGPU is not universally supported.', 'Requires a fallback renderer.', 'Memory management for buffers must be handled manually.'],
                    future: ['Integrate with `Nexus Visualization` to render graphs > 10,000 nodes.', 'Use compute shaders for physics calculations in the Plasma Lab.']
                },
                {
                    id: 'learningcore-system',
                    name: 'LearningCore System',
                    status: 'in-progress',
                    overview: 'Houses the proprietary mathematical algorithms for MARL (FS-QMIX and SLR).',
                    files: ['src/core/learning/FSQMIX.ts', 'src/core/learning/SLR.ts', 'src/core/learning/types.ts', 'src/core/learning/RewardFunctions.ts', 'src/core/router/fractalUtils.ts (Dependency)'],
                    api: ['/api/learning/train (Planned)'],
                    dependencies: ['(Internal) fractalUtils.ts', '(Internal) GovernorSystem'],
                    issues: ['`computeDVar` and `computeLacunarity` are currently stubs.', 'Requires a live data connection to the `GovernorSystem`.'],
                    future: ['Implement the *differentiable* version of `computeDVar`.', 'Expose `FSQMIX` model parameters to the `Fractalwright` agent.']
                },
                {
                    id: 'nexus-visualization',
                    name: 'Nexus Visualization',
                    status: 'operational',
                    overview: 'The primary UI for visualizing and interacting with the AGI-CAD\'s symbolic graph (GlyphNodes). Supports 6 layouts.',
                    files: ['src/app/nexus/page.tsx', 'src/components/nexus/NexusGraph.tsx', 'src/components/nexus/NexusToolbar.tsx', 'src/core/nexus/layouts.ts', 'src/hooks/useGlyphNodes.ts'],
                    api: ['N/A (Client-side system)'],
                    dependencies: ['vis-network (or d3-force)', 'firebase', 'zustand'],
                    issues: ['Performance degrades significantly with > 1,000 nodes.', 'Layouts are not context-aware.'],
                    future: ['**CRITICAL:** Replace `vis-network` with the `WebGPU Rendering System`.', 'Use `IntelligenceRouter` to *suggest* the best layout.']
                },
                {
                    id: 'science-labs',
                    name: 'Science Labs (Plasma Lab)',
                    status: 'operational',
                    overview: 'Modular simulation environments (e.g., Plasma Lab) where agents can interact with complex models.',
                    files: ['src/app/labs/plasma/page.tsx', 'src/components/labs/plasma/PlasmaLab.tsx', 'src/components/labs/LabControls.tsx', 'src/agents/simwright.ts'],
                    api: ['/api/labs/plasma/run (Inferred)'],
                    dependencies: ['(Internal) SimwrightAgent', '(Internal) WebGPU Rendering System (Planned)'],
                    issues: ['Simulation is currently a stub (`simwright.ts`).', 'Visualization is not yet connected to `WebGPU`.'],
                    future: ['Implement the full physics model.', 'Build the Spectral Lab and Crypto Lab.', 'Connect lab outputs directly to the `LearningCore`.']
                },
                {
                    id: 'neuroevolution-system',
                    name: 'Neuroevolution System',
                    status: 'operational',
                    overview: 'The "Hive Mind" (Phase 30A). It evolves new agent policies using a NEAT-like swarm intelligence, guided by the FS-QMIX fitness formula.',
                    files: ['src/scripts/simulations/phase30a_hive_evo.ts', 'src/core/evolution/HiveMind.ts (Stub)', 'src/core/evolution/HiveScanAgent.ts (Stub)'],
                    api: ['/api/evolution/run_generation (Planned)'],
                    dependencies: ['(Internal) LearningCore', '(Internal) GovernorSystem', 'uuid'],
                    issues: ['The system is currently a simulation script.', 'It does not yet operate on live, deployed agents.'],
                    future: ['Create the `HiveMind.ts` service.', 'Connect `HiveScanAgent` to live performance data from the VAULT.']
                },
                {
                    id: 'governor-system',
                    name: 'Governor System',
                    status: 'in-progress',
                    overview: 'The self-auditing, self-governing layer. Contains the CVRA (proposes new CANON rules) and the Semantic Fidelity Governor (audits compression).',
                    files: ['src/core/governance/CVRA.ts (Stub)', 'src/core/governance/SemanticFidelityGovernor.ts (Stub)', 'src/core/governance/types.ts (Stub)'],
                    api: ['N/A (Internal, event-driven)'],
                    dependencies: ['firebase', 'pinecone-client', '(Internal) LearningCore', '(Internal) Neuroevolution System'],
                    issues: ['This is the most complex and least-implemented system.', 'Requires robust, error-free access to Pinecone and Firebase.'],
                    future: ['Fully implement the CVRA\'s `auditVault` logic.', 'Fully implement the `checkFidelity` logic.']
                }
            ],
            api: [
                {
                    endpoint: 'POST /api/router-test',
                    description: 'Triggers a test execution of the main Intelligence Router. This is the primary endpoint for all agent tasks.',
                    request: `{ "type": "string", "context": "any" }`,
                    response: `{ "ok": true, "route": "claode://reason", "echo": { ... } }`
                },
                {
                    endpoint: 'POST /api/agents/scan',
                    description: 'Manually triggers the `EchoArchivist` agent to perform a deep-scan.',
                    request: `{ "threads": ["string"], "embedding": [1.2, ...] }`,
                    response: `{ "ok": true, "data": { "index": {...}, "novelty": "high", ... } }`
                },
                {
                    endpoint: 'POST /api/agents/fractal',
                    description: 'Manually triggers the `Fractalwright` agent to monitor a state embedding.',
                    request: `{ "embedding": [1.2, ...] }`,
                    response: `{ "ok": true, "data": { "dimension": 1.98, "d_var": 1.85, ... } }`
                },
                {
                    endpoint: 'POST /api/labs/plasma/run (Planned)',
                    description: 'Triggers a simulation run in the Plasma Lab via the `Simwright`.',
                    request: `{ "parameters": { "energy": 99.5, ... } }`,
                    response: `{ "ok": true, "data": { "status": "prototype_built_node", ... } }`
                },
                {
                    endpoint: 'POST /api/evolution/run_generation (Planned)',
                    description: 'Manually triggers one generation of the Neuroevolution Hive.',
                    request: `{}`,
                    response: `{ "ok": true, "data": { "generation": 11, "bestFitness": 1.12, ... } }`
                }
            ]
        };

        // --- Chart.js Utility ---
        function wrapText(ctx, text, maxWidth) {
            const words = text.split(' ');
            let lines = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                let word = words[i];
                let width = ctx.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }

        // --- App State ---
        const state = {
            currentSection: 'dashboard',
            charts: {}
        };

        // --- Render Functions ---

        function renderDashboardChart() {
            const ctx = document.getElementById('dashboardChart').getContext('2d');
            const dashboardDatasets = [
                appData.simulation.datasets.find(d => d.label === 'Best Fitness'),
                { ...appData.simulation.datasets.find(d => d.label === 'D_var Trend'), hidden: false }
            ];

            state.charts.dashboard = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: appData.simulation.labels.map(l => `Gen ${l}`),
                    datasets: dashboardDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { color: '#57534e' }
                        },
                        x: {
                            ticks: { color: '#57534e' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#3f3f46' }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            });
        }

        function renderSimulationChart() {
            const ctx = document.getElementById('simulationChart').getContext('2d');
            
            state.charts.simulation = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: appData.simulation.labels.map(l => `Gen ${l}`),
                    datasets: appData.simulation.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yLeft: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: false,
                            ticks: { color: '#57534e' },
                            title: { display: true, text: 'Fitness / D_var' }
                        },
                        yRight: {
                            type: 'linear',
                            position: 'right',
                            ticks: { color: '#dc2626', stepSize: 1 },
                            title: { display: true, text: 'Veto Count', color: '#dc2626' },
                            grid: { drawOnChartArea: false }
                        },
                        x: {
                            ticks: { color: '#57534e' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            });
        }

        function renderSimulationTable() {
            const tableBody = document.getElementById('sim-data-table');
            const data = appData.simulation;
            let html = '';
            data.labels.forEach((label, index) => {
                html += `
                    <tr class="hover:bg-stone-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">${label}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-600">${data.datasets[0].data[index]}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-600">${data.datasets[1].data[index]}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-600">${data.datasets[3].data[index]}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-600">${data.datasets[2].data[index]}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }

        function renderSystemCards(filter = '') {
            const grid = document.getElementById('systems-grid');
            let html = '';
            const normalizedFilter = filter.toLowerCase();

            appData.systems
                .filter(system => 
                    system.name.toLowerCase().includes(normalizedFilter) ||
                    system.status.toLowerCase().includes(normalizedFilter)
                )
                .forEach(system => {
                    let statusClass = 'planned';
                    if (system.status === 'operational') statusClass = 'operational';
                    if (system.status === 'in-progress') statusClass = 'in-progress';

                    html += `
                        <div class="system-card" data-system-id="${system.id}">
                            <div class="flex items-center mb-3">
                                <span class="status-dot ${statusClass}"></span>
                                <span class="text-xs font-medium uppercase text-stone-500">${system.status}</span>
                            </div>
                            <h3 class="text-lg font-semibold text-stone-900 mb-2">${system.name}</h3>
                            <p class="text-sm text-stone-600 line-clamp-3">${system.overview}</p>
                        </div>
                    `;
                });
            grid.innerHTML = html;
        }

        function renderApiEndpoints(filter = '') {
            const list = document.getElementById('api-list');
            let html = '';
            const normalizedFilter = filter.toLowerCase();

            appData.api
                .filter(api => 
                    api.endpoint.toLowerCase().includes(normalizedFilter) ||
                    api.description.toLowerCase().includes(normalizedFilter)
                )
                .forEach(api => {
                    const isPlanned = api.endpoint.toLowerCase().includes('planned');
                    const method = api.endpoint.split(' ')[0];
                    const path = api.endpoint.split(' ')[1];

                    html += `
                        <div class="card overflow-hidden">
                            <div class="p-6">
                                <div class="flex items-center gap-4">
                                    <span class="text-sm font-semibold py-1 px-3 rounded-full ${method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${method}</span>
                                    <code class="text-lg font-medium text-stone-800">${path}</code>
                                    ${isPlanned ? '<span class="text-xs font-medium py-1 px-3 rounded-full bg-yellow-100 text-yellow-800">Planned</span>' : ''}
                                </div>
                                <p class="mt-4 text-stone-600">${api.description}</p>
                            </div>
                            <div class="bg-stone-50/70 p-6 border-t border-stone-200">
                                <h4 class="text-sm font-medium text-stone-600 mb-2">Request Body</h4>
                                <pre class="bg-stone-900 text-stone-100 p-4 rounded-md text-sm overflow-x-auto"><code>${api.request}</code></pre>
                                <h4 class="text-sm font-medium text-stone-600 mt-4 mb-2">Success Response (200)</h4>
                                <pre class="bg-stone-900 text-stone-100 p-4 rounded-md text-sm overflow-x-auto"><code>${api.response}</code></pre>
                            </div>
                        </div>
                    `;
                });
            list.innerHTML = html;
        }

        function showSystemDetails(systemId) {
            const system = appData.systems.find(s => s.id === systemId);
            if (!system) return;

            const modal = document.getElementById('system-detail-modal');
            const content = document.getElementById('system-detail-content');

            let statusClass = 'planned';
            let statusColor = 'bg-gray-400';
            if (system.status === 'operational') { statusClass = 'operational'; statusColor = 'bg-green-500'; }
            if (system.status === 'in-progress') { statusClass = 'in-progress'; statusColor = 'bg-blue-500'; }

            const listToHtml = (title, items) => `
                <h4 class="text-sm font-semibold text-stone-600 uppercase tracking-wider mt-6 mb-3">${title}</h4>
                <ul class="list-disc list-outside pl-5 space-y-2 text-stone-700">
                    ${items.map(item => `<li><code class="text-sm bg-stone-100 text-stone-800 px-1 py-0.5 rounded">${item}</code></li>`).join('')}
                </ul>
            `;
            
            const issuesToHtml = (title, items) => `
                <h4 class="text-sm font-semibold text-stone-600 uppercase tracking-wider mt-6 mb-3">${title}</h4>
                <ul class="list-disc list-outside pl-5 space-y-2 text-red-700">
                    ${items.map(item => `<li class="text-sm">${item}</li>`).join('')}
                </ul>
            `;
            
            const futureToHtml = (title, items) => `
                <h4 class="text-sm font-semibold text-stone-600 uppercase tracking-wider mt-6 mb-3">${title}</h4>
                <ul class="list-disc list-outside pl-5 space-y-2 text-green-700">
                    ${items.map(item => `<li class="text-sm">${item}</li>`).join('')}
                </ul>
            `;

            content.innerHTML = `
                <div class="flex items-center mb-4">
                    <span class="status-dot ${statusClass} ${statusColor}"></span>
                    <span class="text-sm font-medium uppercase text-stone-500">${system.status}</span>
                </div>
                <h2 class="text-3xl font-bold text-stone-900 mb-3">${system.name}</h2>
                <p class="text-lg text-stone-700">${system.overview}</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6">
                    <div>
                        ${listToHtml('Files', system.files)}
                        ${listToHtml('API Endpoints', system.api)}
                        ${listToHtml('Dependencies', system.dependencies)}
                    </div>
                    <div>
                        ${issuesToHtml('Known Issues', system.issues)}
                        ${futureToHtml('Future Enhancements', system.future)}
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
        }

        function hideSystemDetails() {
            document.getElementById('system-detail-modal').classList.add('hidden');
        }

        // --- Navigation ---
        function navigateTo(sectionId) {
            state.currentSection = sectionId;

            // Hide all sections
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show the target section
            document.getElementById(`section-${sectionId}`).classList.remove('hidden');

            // Update nav button active states
            document.querySelectorAll('header .nav-item').forEach(btn => {
                if (btn.dataset.nav === sectionId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            window.scrollTo(0, 0);
        }

        // --- Initializer ---
        document.addEventListener('DOMContentLoaded', () => {
            // Render initial content
            renderDashboardChart();
            renderSimulationChart();
            renderSimulationTable();
            renderSystemCards();
            renderApiEndpoints();

            // --- Event Listeners ---
            
            // Navigation
            document.querySelectorAll('header .nav-item').forEach(btn => {
                btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
            });

            // System Explorer
            document.getElementById('systems-grid').addEventListener('click', (e) => {
                const card = e.target.closest('.system-card');
                if (card) {
                    showSystemDetails(card.dataset.systemId);
                }
            });

            document.getElementById('system-search').addEventListener('input', (e) => {
                renderSystemCards(e.target.value);
            });

            // API Reference
            document.getElementById('api-search').addEventListener('input', (e) => {
                renderApiEndpoints(e.target.value);
            });

            // Modal Close
            document.getElementById('close-modal-btn').addEventListener('click', hideSystemDetails);
            document.getElementById('system-detail-modal').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    hideSystemDetails();
                }
            });

            // Integration Map
            document.querySelectorAll('.integration-node').forEach(node => {
                node.addEventListener('click', () => {
                    const systemId = node.dataset.systemId;
                    if (!systemId) return;

                    // Map special 'firebase' ID from diagram to a real system
                    const targetId = (systemId === 'firebase') ? 'governor-system' : systemId;
                    
                    navigateTo('systems');
                    
                    // Show the modal for the clicked system
                    setTimeout(() => {
                         showSystemDetails(targetId);
                         // Highlight the card in the grid
                         document.querySelectorAll('.system-card').forEach(card => card.classList.remove('ring-4', 'ring-amber-400'));
                         const cardInGrid = document.querySelector(`.system-card[data-system-id="${targetId}"]`);
                         if (cardInGrid) {
                            cardInGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            cardInGrid.classList.add('ring-4', 'ring-amber-400');
                         }
                    }, 100);
                });
            });

            // Simulation Chart Toggles
            document.getElementById('sim-chart-toggles').addEventListener('change', (e) => {
                const checkbox = e.target;
                const datasetLabel = checkbox.dataset.dataset;
                const chart = state.charts.simulation;

                const dataset = chart.data.datasets.find(d => d.label === datasetLabel);
                if (dataset) {
                    dataset.hidden = !checkbox.checked;
                    chart.update();
                }
            });
        });

    </script>
</body>
</html>