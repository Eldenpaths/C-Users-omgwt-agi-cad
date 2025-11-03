
"use client";

import React, { useState, useEffect } from 'react';
import { getFirestoreInstance } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, limit } from 'firebase/firestore';

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(getFirestoreInstance(), "performance_logs"), orderBy("timestamp", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMetrics: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = (data.timestamp as Timestamp)?.toDate() ?? new Date();
        newMetrics.push({
          id: doc.id,
          timestamp: timestamp.toLocaleTimeString(),
          metricName: data.metricName,
          value: data.value,
          unit: data.unit,
        });
      });
      setMetrics(newMetrics);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg mt-6">
      <h4 className="text-sm font-bold text-white mb-3">Performance Metrics</h4>
      <div className="font-mono text-xs space-y-2">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded">
            <span className="text-gray-400">{metric.timestamp}</span>
            <span className="text-green-400 flex-1 px-4">{metric.metricName}</span>
            <div className="text-right">
              <span className="text-yellow-500">{metric.value.toFixed(2)} {metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
