import { useEffect } from "react";
// TODO: Implement these agents
// import { initForgewright } from "@/agents/Forgewright";
// import { initVaultkeeper } from "@/agents/Vaultkeeper";

export default function useAgents(user) {
  useEffect(() => {
    if (!user) return;
    // TODO: Re-enable when agents are implemented
    // const unsubs = [
    //   initForgewright(user.uid),
    //   initVaultkeeper(user.uid),
    // ];
    // return () => unsubs.forEach((u) => u && u());
  }, [user]);
}
