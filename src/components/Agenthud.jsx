// components/AgentHUD.jsx
export default function AgentHUD({ status, checksum, delta }) {
  return (
    <div className="fixed bottom-3 right-4 bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 backdrop-blur">
      <div>🔄 Sync: <b>{status}</b></div>
      <div>🧮 Checksum: <b>{checksum?.slice?.(0, 6) ?? "--"}…</b></div>
      <div>⏱ Delta: <b>{delta}s</b></div>
    </div>
  );
}
