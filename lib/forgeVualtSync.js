"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import Loader from "@/components/Loader";
import { subscribeForge, addForgeCommand } from "@/lib/forgeVaultSync";

export default function ForgePanel() {
  const { user } = useAuth();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommand, setNewCommand] = useState("");

  // 🔄 Subscribe to Firestore in real time via unified sync service
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeForge(user, (data) => {
      setCommands(data);
      setLoading(false);
    });
    return () => {
      console.log("🧹 Forge listener unsubscribed");
      unsub();
    };
  }, [user?.uid]);

  // ➕ Add new command using the debounced helper
  const handleAdd = () => {
    if (!newCommand.trim()) return;
    addForgeCommand(user, { type: "CUSTOM", payload: { text: newCommand } });
    setNewCommand("");
  };

  if (loading) return <Loader text="Loading Forge Queue..." />;

  return (
    <div className="card p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Forge Queue</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="px-2 py-1 rounded text-black flex-1"
          placeholder="Enter command..."
          value={newCommand}
          onChange={(e) => setNewCommand(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          Add
        </button>
      </div>

      {commands.length === 0 ? (
        <p className="text-gray-400 text-sm">No pending commands found.</p>
      ) : (
        <ul className="space-y-2">
          {commands.map((cmd) => (
            <li
              key={cmd.id}
              className="bg-gray-800/70 p-3 rounded-md text-sm flex justify-between"
            >
              <span className="text-cyan-400">{cmd.type || "UNKNOWN"}</span>
              <code className="opacity-70">{cmd.payload?.text || ""}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
