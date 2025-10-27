"use client";
import { useState } from "react";

export default function SentinelHUD() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function runSentinel() {
    setStatus("running");
    setMessage("Running Checksum Sentinel…");

    try {
      const res = await fetch("/api/sentinel", { method: "POST" });
      const data = await res.json();

      if (data.status === "ok") {
        setStatus("success");
        setMessage("Checksum Sentinel Sweep completed successfully ✅");
      } else {
        setStatus("error");
        setMessage(`⚠️ ${data.message || "Sentinel returned an error."}`);
      }
    } catch (err) {
      console.error("Sentinel error:", err);
      setStatus("error");
      setMessage("❌ Failed to reach Sentinel API.");
    }

    // Auto-reset back to idle after 5 seconds
    setTimeout(() => setStatus("idle"), 5000);
  }

  const statusColor =
    status === "running"
      ? "bg-yellow-500"
      : status === "success"
      ? "bg-green-500"
      : status === "error"
      ? "bg-red-500"
      : "bg-gray-700";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={runSentinel}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-lg"
      >
        Run Checksum Sentinel
      </button>

      {status !== "idle" && (
        <div
          className={`${statusColor} mt-2 text-white px-3 py-2 rounded shadow-md transition-all`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
