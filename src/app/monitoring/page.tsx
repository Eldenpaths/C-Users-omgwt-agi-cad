'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useSystemHealth, useTopAgents } from '@/lib/monitoring/telemetry-hook';
import Layout from '../../components/Layout';
import { Activity, TrendingUp, DollarSign, AlertTriangle, Clock, Zap } from 'lucide-react';

export default function MonitoringPage() {
  const { health, isLoading: healthLoading, error: healthError } = useSystemHealth(15000);
  const { agents, isLoading: agentsLoading, error: agentsError } = useTopAgents(10, 30000);

  return (
    <Layout>
      <div className="forge-theme min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif mb-2 text-amber-200">
              Nexus Monitoring
            </h1>
            <p className="text-amber-400/80">
              Phase 12: Real-time analytics and performance tracking
            </p>
          </div>

          {/* System Health Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-serif mb-4 text-amber-300 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              System Health
            </h2>

            {healthLoading && !health && (
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-lg p-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-amber-900/30 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-amber-900/30 rounded"></div>
                      <div className="h-4 bg-amber-900/30 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {healthError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                Error loading health metrics: {healthError}
              </div>
            )}

            {health && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Active Agents */}
                <HealthCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Active Agents"
                  value={health.activeAgents.toString()}
                  subtitle="Last 24 hours"
                  color="text-green-400"
                />

                {/* Total Requests */}
                <HealthCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  title="Total Requests"
                  value={health.totalRequests24h.toLocaleString()}
                  subtitle="Last 24 hours"
                  color="text-blue-400"
                />

                {/* Avg Response Time */}
                <HealthCard
                  icon={<Clock className="w-6 h-6" />}
                  title="Avg Response Time"
                  value={`${health.avgResponseTime}ms`}
                  subtitle="Last 24 hours"
                  color="text-purple-400"
                />

                {/* Error Rate */}
                <HealthCard
                  icon={<AlertTriangle className="w-6 h-6" />}
                  title="Error Rate"
                  value={`${health.errorRate.toFixed(1)}%`}
                  subtitle="Last 24 hours"
                  color={health.errorRate > 5 ? "text-red-400" : "text-green-400"}
                />

                {/* Total Cost */}
                <HealthCard
                  icon={<DollarSign className="w-6 h-6" />}
                  title="Total Cost"
                  value={`$${health.totalCost24h.toFixed(2)}`}
                  subtitle="Last 24 hours"
                  color="text-amber-400"
                />

                {/* Peak Usage Time */}
                <HealthCard
                  icon={<Activity className="w-6 h-6" />}
                  title="Peak Usage"
                  value={health.peakUsageTime}
                  subtitle="Busiest hour"
                  color="text-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Top Agents Performance */}
          <div>
            <h2 className="text-2xl font-serif mb-4 text-amber-300 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Top Performing Agents
            </h2>

            {agentsLoading && agents.length === 0 && (
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-amber-900/30 rounded"></div>
                  ))}
                </div>
              </div>
            )}

            {agentsError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                Error loading agents: {agentsError}
              </div>
            )}

            {agents.length === 0 && !agentsLoading && (
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-lg p-8 text-center text-amber-400/60">
                No agent data available yet. Agents will appear here once they start processing requests.
              </div>
            )}

            {agents.length > 0 && (
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-900/30 bg-slate-900/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Avg Response
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Context Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/20">
                    {agents.map((agent, index) => (
                      <tr
                        key={agent.agentId}
                        className="hover:bg-amber-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-amber-900/30 text-amber-400 font-mono font-bold">
                              #{index + 1}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-amber-200">
                                {agent.agentName}
                              </div>
                              <div className="text-xs text-amber-400/60 font-mono">
                                {agent.agentId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-200">
                          {agent.totalRequests.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-200">
                          {Math.round(agent.avgResponseTime)}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-amber-400">
                                  {(agent.avgContextScore * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full transition-all"
                                  style={{ width: `${agent.avgContextScore * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.successRate >= 95
                                ? 'bg-green-900/30 text-green-400'
                                : agent.successRate >= 80
                                ? 'bg-amber-900/30 text-amber-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {agent.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-200">
                          ${agent.totalCost.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-amber-400/50 text-sm">
            <p>Metrics update every 15-30 seconds</p>
            <p className="mt-1">Data retained for 24 hours</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface HealthCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function HealthCard({ icon, title, value, subtitle, color }: HealthCardProps) {
  return (
    <div className="bg-slate-800/50 border border-amber-900/30 rounded-lg p-6 hover:border-amber-700/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`${color}`}>{icon}</div>
      </div>
      <div>
        <div className="text-sm text-amber-400/80 mb-1">{title}</div>
        <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
        <div className="text-xs text-amber-400/60">{subtitle}</div>
      </div>
    </div>
  );
}
