import { useEffect, useState } from 'react';
import { getAlertManager, Alert } from '@/lib/monitoring/alert-manager';
import { getAdaptiveScaler, ScalingStrategy } from '@/lib/monitoring/adaptive-scaler';

/**
 * Hook to initialize and manage monitoring systems
 */
export function useMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<ScalingStrategy>('balanced');
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Initialize Alert Manager
    const alertManager = getAlertManager();

    // Register alert callback
    const unsubscribe = alertManager.onAlert((alert) => {
      console.log('🚨 Alert received:', alert);
      setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
    });

    // Start monitoring
    alertManager.startMonitoring();

    // Initialize Adaptive Scaler
    const scaler = getAdaptiveScaler();
    scaler.start();
    setCurrentStrategy(scaler.getCurrentStrategy());

    // Update strategy periodically
    const strategyInterval = setInterval(() => {
      setCurrentStrategy(scaler.getCurrentStrategy());
    }, 5000);

    setIsMonitoring(true);

    console.log('✅ Monitoring systems started');
    console.log('📊 AlertManager: Monitoring every 30s');
    console.log('📈 AdaptiveScaler: Evaluating every 60s');

    // Cleanup
    return () => {
      unsubscribe();
      alertManager.stopMonitoring();
      scaler.stop();
      clearInterval(strategyInterval);
      setIsMonitoring(false);
      console.log('🛑 Monitoring systems stopped');
    };
  }, []);

  return {
    alerts,
    currentStrategy,
    isMonitoring
  };
}
