// CLAUDE-META: AGI-CAD Phase 12B - Alert Manager
// Purpose: Monitor nexus_metrics and trigger alerts when thresholds exceeded
// Architect: Claude Code (Sonnet 4.5)

import { getFirebase } from '../firebase/client';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, addDoc } from 'firebase/firestore';
import { nexusAnalytics, SystemHealth } from './nexus-analytics';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert types
 */
export type AlertType =
  | 'high_error_rate'
  | 'high_cost'
  | 'slow_response'
  | 'low_success_rate'
  | 'token_spike'
  | 'agent_failure'
  | 'system_degradation';

/**
 * Alert interface
 */
export interface Alert {
  id?: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  type: AlertType;
  enabled: boolean;
  severity: AlertSeverity;
  threshold: number;
  timeWindowMinutes: number;
  cooldownMinutes: number;
  condition: (value: number, threshold: number) => boolean;
  messageTemplate: (value: number) => string;
}

/**
 * Alert callback function type
 */
export type AlertCallback = (alert: Alert) => void | Promise<void>;

/**
 * AlertManager
 * Monitors nexus_metrics collection and triggers alerts based on configurable rules
 */
export class AlertManager {
  private rules: Map<AlertType, AlertRule>;
  private callbacks: AlertCallback[] = [];
  private activeAlerts: Map<AlertType, Date> = new Map(); // Track cooldowns
  private unsubscribers: (() => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.rules = new Map(Object.entries(this.getDefaultRules()) as [AlertType, AlertRule][]);
  }

  /**
   * Default alert rules
   */
  private getDefaultRules(): Record<AlertType, AlertRule> {
    return {
      high_error_rate: {
        type: 'high_error_rate',
        enabled: true,
        severity: 'critical',
        threshold: 10, // 10% error rate
        timeWindowMinutes: 15,
        cooldownMinutes: 30,
        condition: (value, threshold) => value > threshold,
        messageTemplate: (value) => `Error rate is ${value.toFixed(1)}% (threshold: 10%)`
      },
      high_cost: {
        type: 'high_cost',
        enabled: true,
        severity: 'warning',
        threshold: 1.0, // $1.00 in 1 hour
        timeWindowMinutes: 60,
        cooldownMinutes: 60,
        condition: (value, threshold) => value > threshold,
        messageTemplate: (value) => `Cost is $${value.toFixed(2)} in the last hour (threshold: $1.00)`
      },
      slow_response: {
        type: 'slow_response',
        enabled: true,
        severity: 'warning',
        threshold: 5000, // 5 seconds average
        timeWindowMinutes: 10,
        cooldownMinutes: 20,
        condition: (value, threshold) => value > threshold,
        messageTemplate: (value) => `Average response time is ${value.toFixed(0)}ms (threshold: 5000ms)`
      },
      low_success_rate: {
        type: 'low_success_rate',
        enabled: true,
        severity: 'critical',
        threshold: 90, // 90% success rate
        timeWindowMinutes: 30,
        cooldownMinutes: 45,
        condition: (value, threshold) => value < threshold,
        messageTemplate: (value) => `Success rate is ${value.toFixed(1)}% (threshold: 90%)`
      },
      token_spike: {
        type: 'token_spike',
        enabled: true,
        severity: 'info',
        threshold: 50000, // 50k tokens in 15 minutes
        timeWindowMinutes: 15,
        cooldownMinutes: 30,
        condition: (value, threshold) => value > threshold,
        messageTemplate: (value) => `Token usage spike: ${value.toLocaleString()} tokens in 15 minutes`
      },
      agent_failure: {
        type: 'agent_failure',
        enabled: true,
        severity: 'critical',
        threshold: 3, // 3 consecutive failures
        timeWindowMinutes: 5,
        cooldownMinutes: 10,
        condition: (value, threshold) => value >= threshold,
        messageTemplate: (value) => `Agent has failed ${value} consecutive times`
      },
      system_degradation: {
        type: 'system_degradation',
        enabled: true,
        severity: 'warning',
        threshold: 0.7, // Performance degraded to 70% of baseline
        timeWindowMinutes: 20,
        cooldownMinutes: 30,
        condition: (value, threshold) => value < threshold,
        messageTemplate: (value) => `System performance degraded to ${(value * 100).toFixed(0)}% of baseline`
      }
    };
  }

  /**
   * Start monitoring metrics
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('[AlertManager] Already monitoring');
      return;
    }

    const { db } = getFirebase();
    if (!db) {
      console.error('[AlertManager] Firebase not initialized');
      return;
    }

    this.isMonitoring = true;
    console.log('[AlertManager] Starting monitoring...');

    // Monitor system health every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('[AlertManager] Error checking system health:', error);
      }
    }, 30000);

    // Initial check
    await this.checkSystemHealth();

    console.log('[AlertManager] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[AlertManager] Stopping monitoring...');

    // Clear interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Unsubscribe from all Firestore listeners
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];

    this.isMonitoring = false;
    console.log('[AlertManager] Monitoring stopped');
  }

  /**
   * Check system health and trigger alerts if needed
   */
  private async checkSystemHealth(): Promise<void> {
    const health = await nexusAnalytics.getSystemHealth(1); // Last hour
    if (!health) return;

    // Check error rate
    if (this.shouldTriggerAlert('high_error_rate', health.errorRate)) {
      await this.triggerAlert({
        type: 'high_error_rate',
        severity: this.rules.get('high_error_rate')!.severity,
        message: this.rules.get('high_error_rate')!.messageTemplate(health.errorRate),
        metadata: {
          errorRate: health.errorRate,
          totalRequests: health.totalRequests24h,
          threshold: this.rules.get('high_error_rate')!.threshold
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Check cost
    if (this.shouldTriggerAlert('high_cost', health.totalCost24h)) {
      await this.triggerAlert({
        type: 'high_cost',
        severity: this.rules.get('high_cost')!.severity,
        message: this.rules.get('high_cost')!.messageTemplate(health.totalCost24h),
        metadata: {
          cost: health.totalCost24h,
          threshold: this.rules.get('high_cost')!.threshold
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Check response time
    if (this.shouldTriggerAlert('slow_response', health.avgResponseTime)) {
      await this.triggerAlert({
        type: 'slow_response',
        severity: this.rules.get('slow_response')!.severity,
        message: this.rules.get('slow_response')!.messageTemplate(health.avgResponseTime),
        metadata: {
          avgResponseTime: health.avgResponseTime,
          threshold: this.rules.get('slow_response')!.threshold
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Calculate success rate and check
    const successRate = 100 - health.errorRate;
    if (this.shouldTriggerAlert('low_success_rate', successRate)) {
      await this.triggerAlert({
        type: 'low_success_rate',
        severity: this.rules.get('low_success_rate')!.severity,
        message: this.rules.get('low_success_rate')!.messageTemplate(successRate),
        metadata: {
          successRate,
          errorRate: health.errorRate,
          threshold: this.rules.get('low_success_rate')!.threshold
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
  }

  /**
   * Check if alert should be triggered based on rule
   */
  private shouldTriggerAlert(type: AlertType, value: number): boolean {
    const rule = this.rules.get(type);
    if (!rule || !rule.enabled) {
      return false;
    }

    // Check cooldown
    const lastAlert = this.activeAlerts.get(type);
    if (lastAlert) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return false;
      }
    }

    // Check condition
    return rule.condition(value, rule.threshold);
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: Alert): Promise<void> {
    console.warn(`🚨 [AlertManager] ${alert.severity.toUpperCase()}: ${alert.message}`);

    // Save to Firestore
    const { db } = getFirebase();
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'nexus_alerts'), {
          ...alert,
          timestamp: Timestamp.fromDate(alert.timestamp)
        });
        alert.id = docRef.id;
      } catch (error) {
        console.error('[AlertManager] Failed to save alert:', error);
      }
    }

    // Update cooldown
    this.activeAlerts.set(alert.type, alert.timestamp);

    // Trigger callbacks
    for (const callback of this.callbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error('[AlertManager] Callback error:', error);
      }
    }
  }

  /**
   * Register alert callback
   */
  onAlert(callback: AlertCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update alert rule
   */
  updateRule(type: AlertType, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(type);
    if (rule) {
      this.rules.set(type, { ...rule, ...updates });
      console.log(`[AlertManager] Updated rule: ${type}`);
    }
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(type: AlertType, enabled: boolean): void {
    const rule = this.rules.get(type);
    if (rule) {
      rule.enabled = enabled;
      console.log(`[AlertManager] ${enabled ? 'Enabled' : 'Disabled'} rule: ${type}`);
    }
  }

  /**
   * Get all rules
   */
  getRules(): Map<AlertType, AlertRule> {
    return new Map(this.rules);
  }

  /**
   * Get active alerts (within cooldown period)
   */
  getActiveAlerts(): { type: AlertType; lastTriggered: Date }[] {
    return Array.from(this.activeAlerts.entries()).map(([type, date]) => ({
      type,
      lastTriggered: date
    }));
  }

  /**
   * Clear alert cooldown
   */
  clearCooldown(type: AlertType): void {
    this.activeAlerts.delete(type);
    console.log(`[AlertManager] Cleared cooldown for: ${type}`);
  }

  /**
   * Get monitoring status
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
let alertManager: AlertManager | null = null;

/**
 * Get or create alert manager instance
 */
export function getAlertManager(): AlertManager {
  if (!alertManager) {
    alertManager = new AlertManager();
  }
  return alertManager;
}

export default AlertManager;
