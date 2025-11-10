LearningCore SystemOverviewThe LearningCore houses the proprietary mathematical algorithms for multi-agent reinforcement learning (MARL). This includes our "untouchable" innovations: FS-QMIX and Symbolic Lacunarity Regularization (SLR).Status🔵 In Progress (Math defined, integration pending)Filessrc/core/learning/FSQMIX.tssrc/core/learning/SLR.tssrc/core/learning/types.tssrc/core/learning/RewardFunctions.tssrc/core/router/fractalUtils.ts (Dependency)ComponentsN/A (Core system)API Endpoints/src/app/api/learning/train (Planned): Triggers a training step for the Neuroevolution Hive.Dependencies(Internal) fractalUtils.ts: Provides computeDVar and computeLacunarity.(Internal) GovernorSystem: Provides the mu_dyn (dynamic coefficient) based on CANON stability.Usageimport { FSQMIXTrainer } from '@/core/learning/FSQMIX';
import { Governor } from '@/core/governance/GovernorSystem';

// Inside a training loop
const sym_stable = Governor.getStability();
const fsqmix = new FSQMIXTrainer();

const loss = fsqmix.compute_loss(
  batch, 
  sym_stable // mu_dyn is calculated inside
);
ConfigurationN/ATestingRun the simulation script: pnpm ts-node src/scripts/simulations/phase30a_hive_evo.tsKnown IssuescomputeDVar and computeLacunarity are currently stubs.Requires a live data connection to the GovernorSystem to get sym_stable.Future EnhancementsImplement the differentiable version of computeDVar for end-to-end training.Expose FSQMIX model parameters to the Fractalwright agent for live analysis.