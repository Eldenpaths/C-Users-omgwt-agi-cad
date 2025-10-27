// CLAUDE-EDIT: Agent status HUD (placeholder)
"use client";
export default function AgentOverlay() {
  const agents = [
    { name: "Buildsmith", status: "idle" },
    { name: "Corewright", status: "watching" },
    { name: "Simwright", status: "standby" },
  ];
  return (
    <div className="forge-panel p-3 rounded-lg">
      <div className="text-sm mb-2 opacity-80">Agents</div>
      <ul className="space-y-1">
        {agents.map(a=>(
          <li key={a.name} className="flex justify-between text-amber-200/90">
            <span>{a.name}</span><span className="opacity-70">{a.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
