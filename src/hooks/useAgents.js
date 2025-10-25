import { useEffect } from "react";
import { initForgewright } from "@/agents/Forgewright";
import { initVaultkeeper } from "@/agents/Vaultkeeper";

export default function useAgents(user) {
  useEffect(() => {
    if (!user) return;
    const unsubs = [
      initForgewright(user.uid),
      initVaultkeeper(user.uid),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [user]);
}
