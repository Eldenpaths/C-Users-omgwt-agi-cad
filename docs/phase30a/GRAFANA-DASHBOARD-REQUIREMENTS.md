# Grafana Dashboard Requirements - Phase 30A

**Date:** 2025-11-09
**Phase:** 30A - Governor Integration & Multi-Agent Monitoring
**Version:** 1.0

## Overview

This document outlines the requirements for Grafana dashboards to monitor the AGI-CAD multi-agent system, including GPU performance, task routing, agent health, and system telemetry.

---

## Data Sources

### 1. Redis Data Source
- **Type:** Redis
- **Connection:** `localhost:6379` (or configured Redis endpoint)
- **Channels to Monitor:**
  - `telemetry:metrics` - System-wide telemetry snapshots
  - `task:routing` - Task routing decisions
  - `agent:status` - Agent status updates
  - `GOSSIP` - Gossip protocol messages
  - `task:assignment` - Task assignments via gRPC
  - `task:result` - Task completion results

### 2. Time Series Database (Optional)
- **Type:** InfluxDB or Prometheus
- **Purpose:** Historical metric storage
- **Retention:** 30 days
- **Aggregation:** 1-minute intervals

---

## Dashboard Layout

### Dashboard 1: System Overview
**Refresh Rate:** 5 seconds

#### Row 1: System Health
1. **Panel: System Status**
   - Type: Stat
   - Metrics: Redis/WebSocket connection, Active agents, Total tasks
   - Thresholds: Green (all up), Yellow (1 down), Red (multiple down)

2. **Panel: CPU & Memory Usage**
   - Type: Gauge
   - Metrics: CPU (0-100%), Memory (0-100%)
   - Thresholds: Green (<70%), Yellow (70-90%), Red (>90%)

3. **Panel: Network Latency**
   - Type: Stat
   - Metric: Average latency (ms)
   - Thresholds: Green (<100ms), Yellow (100-500ms), Red (>500ms)

#### Row 2: GPU Performance
1. **Panel: GPU FPS**
   - Type: Time series (line)
   - Metric: `telemetry.gpu.fps`
   - Target Line: 60 FPS (PID setpoint)
   - Time Range: Last 5 minutes

2. **Panel: Workgroup Size**
   - Type: Time series (line)
   - Metric: `telemetry.gpu.workgroupSize`
   - Values: 4, 8, 16, 32
   - Annotations: PID controller adjustments

3. **Panel: Workgroup Density Heatmap**
   - Type: Heatmap
   - Metrics: `workgroupDensity`, `workgroupGradient`
   - Time Range: Last 10 minutes

---

### Dashboard 2: Task Routing & Agent Performance
**Refresh Rate:** 10 seconds

#### Row 1: Task Routing
1. **Panel: Tasks Routed Rate**
   - Type: Time series
   - Metric: Tasks per minute
   - Time Range: Last 30 minutes

2. **Panel: Routing Latency**
   - Type: Time series
   - Metrics: Average, P95, P99 latency (ms)

3. **Panel: Success Rate**
   - Type: Gauge
   - Formula: `(successful / total) * 100`
   - Thresholds: Green (>95%), Yellow (90-95%), Red (<90%)

#### Row 2: Agent Performance
1. **Panel: Task Distribution**
   - Type: Pie chart
   - Metric: Tasks per agent (last hour)

2. **Panel: Agent Success Rates**
   - Type: Bar chart
   - X-axis: Agent names
   - Y-axis: Success rate (0-100%)
   - Target Line: 95%

3. **Panel: Agent Execution Time**
   - Type: Bar chart
   - Metric: Average execution time per agent (ms)
   - Sort: Ascending (fastest first)

#### Row 3: Agent Status
1. **Panel: Agent Load Heatmap**
   - Type: Heatmap
   - Rows: Agents, Columns: Time buckets
   - Color: Load (0-100%)

2. **Panel: Active Agents Table**
   - Columns: ID, Name, Status, Load, Tasks, Success Rate, Last Seen
   - Highlighting: Red (offline), Yellow (busy)

---

### Dashboard 3: PID Controller & Dynamic Scaling
**Refresh Rate:** 5 seconds

#### Row 1: PID Controller
1. **Panel: FPS vs Target**
   - Type: Time series
   - Metrics: Current FPS (blue), Target (green dashed at 60)

2. **Panel: PID Error**
   - Type: Time series
   - Formula: `target - current`
   - Zero Line: Dashed

3. **Panel: PID Output**
   - Type: Time series
   - Range: -1.0 to +1.0
   - Thresholds: >0.2 (scale up), <-0.2 (scale down)

#### Row 2: Scaling Events
1. **Panel: Scaling Events**
   - Type: Bar chart
   - Metrics: Scale up (green), Scale down (red)

2. **Panel: Workgroup Size Distribution**
   - Type: Pie chart
   - Metric: Time at each size (4, 8, 16, 32)

3. **Panel: Scaling Efficiency**
   - Type: Stat
   - Metrics: Avg stabilization time, Total events, Oscillation count

---

### Dashboard 4: Gossip Protocol & gRPC
**Refresh Rate:** 10 seconds

#### Row 1: Gossip Protocol
1. **Panel: Message Rate**
   - Type: Time series
   - Expected: N/5 messages/sec (N agents, 5s interval)

2. **Panel: Agent Discovery**
   - Type: Step graph
   - Metric: Known agents count

3. **Panel: Agent Timeouts**
   - Type: Bar chart
   - Alert: >0 timeouts/minute

#### Row 2: gRPC Communication
1. **Panel: Request Rate**
   - Type: Time series
   - Metrics: AssignTask, ReportStatus, ReportTaskResult (req/sec)

2. **Panel: Error Rate**
   - Type: Time series
   - Breakdown: INVALID_ARGUMENT, NOT_FOUND, INTERNAL
   - Alert: >5 errors/minute

3. **Panel: Latency**
   - Type: Time series
   - Metrics: P50, P95, P99 (ms)
   - Target: P95 <100ms

---

## Alerts

### Critical Alerts
1. **Redis Connection Lost**
   - Condition: `redis_connected == 0` for >30s
   - Action: Notify on-call

2. **Task Success Rate Low**
   - Condition: `success_rate < 0.9` for >5min
   - Action: Investigate agents

3. **GPU FPS Critical**
   - Condition: `fps < 10` for >30s
   - Action: Check WebGPU

### Warning Alerts
1. **High Agent Load**
   - Condition: `load > 0.9` for >2min
   - Action: Scale agents

2. **Gossip Timeout**
   - Condition: Agent timeout detected
   - Action: Check health

3. **PID Oscillation**
   - Condition: >10 events in 5min
   - Action: Tune PID params

---

## Query Examples

### Redis (RedisTimeSeries)
```
TS.MRANGE - + FILTER telemetry_type=gpu
TS.GET telemetry:gpu:fps
```

### Prometheus
```
# Task success rate
sum(rate(tasks_completed_total{status="success"}[5m])) / sum(rate(tasks_completed_total[5m]))

# P95 routing latency
histogram_quantile(0.95, rate(routing_latency_bucket[5m]))
```

---

## Implementation Steps

1. Install Grafana Redis Data Source plugin
2. Configure Redis connection
3. Create dashboards from templates
4. Set up alerting channels (Slack, Email)
5. Run multi-agent tests to validate
6. Tune alert thresholds

---

## Maintenance

- **Dashboard Updates:** Monthly review
- **Alert Tuning:** Adjust based on production data
- **Query Optimization:** <2s query time
- **Version Control:** Git track dashboard JSONs

---

## References

- [Grafana Redis Plugin](https://grafana.com/grafana/plugins/redis-datasource/)
- [InfluxDB Integration](https://docs.influxdata.com/influxdb/v2.0/tools/grafana/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
