'use client';

import React from 'react';
import { useHeartbeat } from './useHeartbeat';

export default function AgentHUD({ vaultId = 'phase7' }) {
  const { isAlive, syncDelta } = useHeartbeat(vaultId);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-gray-100 border border-gray-700 rounded-xl shadow-lg p-4 font-mono">
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            isAlive
              ? syncDelta < 10_000
                ? 'bg-green-500 animate-pulse'
                : 'bg-yellow-400 animate-ping'
              : 'bg-red-600'
          }`}
        ></div>
        <span className="text-sm">
          {isAlive ? `Δ ${syncDelta.toFixed(0)} ms` : 'offline'}
        </span>
      </div>
    </div>
  );
}