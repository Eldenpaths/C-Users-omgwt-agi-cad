import useThemeToggle from "@/hooks/useThemeToggle";
import { createCommand, listQueuedCommands, flushQueuedCommands } from "@/lib/stp";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, toggleTheme } = useThemeToggle();
  const [queue, setQueue] = useState([]);
  const [opText, setOpText] = useState("SET_NOTE");

  async function refreshQueue() {
    const q = await listQueuedCommands();
    setQueue(q);
  }

  useEffect(() => { refreshQueue(); }, []);

  const addCommand = async () => {
    await createCommand(opText, { text: "Hello Forge" });
    await refreshQueue();
  };

  const flush = async () => {
    const events = await flushQueuedCommands();
    await refreshQueue();
    alert("Applied events: " + events.length);
  };

  return (
    <main className="body-grid min-h-screen">
      <header className="header">
        <h1 className="text-2xl font-bold">AGI-CAD Dashboard</h1>
        <button onClick={toggleTheme} className="toggle-btn" title="Toggle theme">
          {theme === "blueprint" ? "📜" : "🧭"}
        </button>
      </header>

      <section className="p-6 space-y-4">
        <p>Connected to Firebase project: <b>agi-cad-core</b></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Firestore → Symbolic CAD State (coming in next step)</li>
          <li>Functions → Agent Logic Layer (scaffolded)</li>
          <li>Hosting → Dashboard interface</li>
        </ul>

        <div className="mt-6 p-4 rounded border border-white/20">
          <h2 className="font-semibold mb-2">STP v2 Demo (Local)</h2>
          <div className="flex gap-2 mb-3">
            <input className="px-2 py-1 text-black rounded" value={opText} onChange={e=>setOpText(e.target.value)} />
            <button onClick={addCommand} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Queue Command</button>
            <button onClick={flush} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Flush → Apply</button>
            <button onClick={refreshQueue} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Refresh</button>
          </div>
          <p className="text-sm opacity-80">Queued commands: {queue.length}</p>
          <pre className="text-xs opacity-80 overflow-auto max-h-48 mt-2">{JSON.stringify(queue, null, 2)}</pre>
        </div>

        <p className="mt-6 italic text-sm opacity-80">
          Toggle in the top-right corner to switch between Blueprint and Parchment modes.
        </p>
      </section>
<div className="fixed bottom-3 right-4 text-xs opacity-80">
  🔄 Memory Sync: <span className="font-semibold">Online</span>
</div>
    </main>
  );
}