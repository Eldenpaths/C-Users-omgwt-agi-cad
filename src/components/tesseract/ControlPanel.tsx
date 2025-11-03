
"use client";

import { useControls, Leva } from 'leva';
import { getFirestoreInstance } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import eventBus from '@/lib/EventBus';

export default function ControlPanel() {
  const db = getFirestoreInstance();
  const settingsRef = doc(db, 'console_settings', 'default');

  const [values, set] = useControls(() => ({
    latencyThreshold: {
      value: 75,
      min: 0,
      max: 500,
      step: 1,
      label: 'Latency Threshold (ms)',
      onChange: (value) => {
        eventBus.emit('control_change', { control: 'latencyThreshold', value });
      },
    },
    alertSensitivity: {
      value: 'Medium',
      options: ['Low', 'Medium', 'High'],
      label: 'Alert Sensitivity',
      onChange: (value) => {
        eventBus.emit('control_change', { control: 'alertSensitivity', value });
      },
    },
    predictionWindow: {
      value: 5,
      min: 1,
      max: 100,
      step: 1,
      label: 'Prediction Window',
      onChange: (value) => {
        eventBus.emit('control_change', { control: 'predictionWindow', value });
      },
    },
    autoResolve: {
      value: false,
      label: 'Auto-Resolve',
      onChange: (value) => {
        eventBus.emit('control_change', { control: 'autoResolve', value });
      },
    },
  }));

  // Load settings from Firestore on component mount
  useEffect(() => {
    getDoc(settingsRef).then((doc) => {
      if (doc.exists()) {
        set(doc.data());
      }
    });
  }, []);

  // Save settings to Firestore when they change
  useEffect(() => {
    setDoc(settingsRef, values);
  }, [values]);

  return <Leva oneLineLabels titleBar={{ title: 'Heuristic Controls' }} />;
}
