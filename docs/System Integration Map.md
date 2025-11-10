AGI-CAD: System Integration MapThis map illustrates the high-level data flow and dependencies between the 7 core operational systems of AGI-CAD.Data Flow Graph (Mermaid)graph TD
    subgraph "User / Client"
        A[Nexus Visualization]
        B[Science Labs UI]
    end

    subgraph "Core OS & Governance"
        C[Intelligence Router]
        D[Governor System]
        E[Firebase (VAULT/CANON)]
    end

    subgraph "Learning & Evolution"
        F[Neuroevolution System]
        G[LearningCore (FS-QMIX/SLR)]
    end

    subgraph "Agents & Runtimes"
        H[Deep-Scan Agents]
        I[Simwright/Mathwright]
        J[WebGPU Rendering]
    end

    %% --- Data Flows ---
    A -->|1. Task (SymbolicIntent)| C
    B -->|2. Run Sim (SymbolicIntent)| C

    C -->|3a. Route| H[Deep-Scan Agents]
    C -->|3b. Route| I[Simwright/Mathwright]
    
    H -->|4. Log| E
    I -->|4. Log| E
    C -->|5. Log All| E

    B -->|6. Render| J
    A -->|6. Render| J

    F -- 7. Get Fitness Formula --> G
    F -- 8. Get Veto Signal --> D
    
    G -- 9. Get mu_dyn --> D
    
    D -- 10. Audit/Read --> E
    D -- 11. Audit/Read --> G
Critical Paths & DependenciesThe Main Task Loop (1 $\rightarrow$ 3a/b $\rightarrow$ 4 $\rightarrow$ 5):A user in the Nexus (A) sends a SymbolicIntent to the Intelligence Router (C).The Router (C) logs the intent to Firebase (E) and routes it to a specialized Agent (H or I).The Agent (H/I) executes, logs its result to Firebase (E), and returns to the user.The Neuroevolution Loop (7, 8, 9, 10):This is the self-improving "heartbeat" of the system.The Neuroevolution System (F) asks the LearningCore (G) for the fitness formula.It also asks the Governor (D) for a veto signal for each agent.Simultaneously, the LearningCore (G) asks the Governor (D) for the mu_dyn coefficient to stabilize its own learning.The Governor (D) makes all its decisions by reading from the VAULT (E) and LearningCore (G).Conclusion: The Governor System (D) and Firebase (E) are the two most critical dependencies, as they are required for both the main user-facing task loop and the internal learning loop.