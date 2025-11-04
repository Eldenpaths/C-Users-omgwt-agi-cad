'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Plus,
  Play,
  Pause,
  DollarSign,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';
import {
  marketSimulator,
  Asset,
  OrderBook,
} from '@/lib/crypto/market-simulation';
import {
  createBot,
  BaseBot,
  TradingBot,
  calculatePortfolioValue,
} from '@/lib/crypto/trading-bots';

export default function CryptoLab() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [bots, setBots] = useState<BaseBot[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [portfolio, setPortfolio] = useState({ cash: 10000, holdings: {} as Record<string, number> });

  // Start market simulation on mount
  useEffect(() => {
    marketSimulator.start(1000);
    startUpdates();

    return () => {
      marketSimulator.stop();
    };
  }, []);

  const startUpdates = () => {
    const interval = setInterval(() => {
      setAssets(marketSimulator.getAllAssets());
      if (selectedAsset) {
        setOrderBook(marketSimulator.generateOrderBook(selectedAsset, 10));
      }

      // Update bots
      bots.forEach((bot) => {
        if (bot.getBot().active) {
          const asset = marketSimulator.getAsset(selectedAsset);
          if (asset) {
            const signal = bot.analyze({
              price: asset.currentPrice,
              volume: asset.priceHistory[asset.priceHistory.length - 1]?.volume || 0,
              timestamp: Date.now(),
              high24h: asset.currentPrice * 1.05,
              low24h: asset.currentPrice * 0.95,
              change24h: 0,
            });

            // Execute bot trades (simplified)
            if (signal === 'buy' && bot.getBot().portfolio.cash > asset.currentPrice) {
              try {
                const quantity = 0.01; // Buy small amount
                bot.executeTrade('buy', selectedAsset, quantity, asset.currentPrice);
              } catch (e) {
                // Insufficient funds
              }
            } else if (signal === 'sell' && (bot.getBot().portfolio.holdings[selectedAsset] || 0) > 0) {
              try {
                const quantity = Math.min(0.01, bot.getBot().portfolio.holdings[selectedAsset] || 0);
                bot.executeTrade('sell', selectedAsset, quantity, asset.currentPrice);
              } catch (e) {
                // Insufficient holdings
              }
            }
          }
        }
      });

      setBots([...bots]); // Force update
    }, 1000);

    return () => clearInterval(interval);
  };

  const createNewBot = (strategy: TradingBot['strategy']) => {
    const bot = createBot(strategy, `${strategy} Bot`, 10000);
    setBots([...bots, bot]);
  };

  const toggleBot = (botId: string) => {
    const bot = bots.find((b) => b.getBot().id === botId);
    if (bot) {
      bot.getBot().active = !bot.getBot().active;
      setBots([...bots]);
    }
  };

  const currentAsset = assets.find((a) => a.symbol === selectedAsset);
  const stats24h = currentAsset ? marketSimulator.get24hStats(selectedAsset) : null;

  return (
    <div className="h-full flex gap-4">
      {/* Left Panel - Assets & Portfolio */}
      <div className="w-80 space-y-4">
        {/* Assets */}
        <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Assets
          </h3>
          <div className="space-y-2">
            {assets.map((asset) => {
              const stats = marketSimulator.get24hStats(asset.symbol);
              const isPositive = (stats?.changePercent || 0) >= 0;

              return (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedAsset === asset.symbol
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold text-gray-200">{asset.symbol}</div>
                      <div className="text-xs text-gray-500">{asset.name}</div>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">
                      ${asset.currentPrice.toFixed(2)}
                    </span>
                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                      {isPositive ? '+' : ''}
                      {stats?.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Portfolio
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Cash:</span>
              <span className="text-gray-200 font-mono">${portfolio.cash.toFixed(2)}</span>
            </div>
            {Object.entries(portfolio.holdings).map(([symbol, qty]) => (
              <div key={symbol} className="flex justify-between">
                <span className="text-gray-400">{symbol}:</span>
                <span className="text-gray-200 font-mono">{qty.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bots */}
        <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Bots ({bots.length})
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => createNewBot('trend')}
                className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                title="Add Trend Bot"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {bots.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                <p>No bots active</p>
                <p className="mt-1">Click + to create one</p>
              </div>
            ) : (
              bots.map((bot) => {
                const botData = bot.getBot();
                const currentPrices = marketSimulator.getCurrentPrices();
                const totalValue = calculatePortfolioValue(botData.portfolio, currentPrices);
                const pnlPercent = ((totalValue - 10000) / 10000) * 100;

                return (
                  <div
                    key={botData.id}
                    className="p-2 bg-gray-800/60 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-200">{botData.name}</div>
                      <button
                        onClick={() => toggleBot(botData.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        {botData.active ? (
                          <Pause className="w-3 h-3 text-green-400" />
                        ) : (
                          <Play className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {botData.performance.trades} trades
                      </span>
                      <span
                        className={
                          pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }
                      >
                        {pnlPercent >= 0 ? '+' : ''}
                        {pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {(['trend', 'mean-reversion'] as const).map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => createNewBot(strategy)}
                  className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs text-blue-300 transition-all"
                >
                  {strategy === 'trend' ? 'Trend' : 'Mean Rev'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Chart & Stats */}
      <div className="flex-1 space-y-4">
        {/* Stats Bar */}
        {stats24h && currentAsset && (
          <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-200">
                  ${currentAsset.currentPrice.toFixed(2)}
                </h2>
                <p className="text-sm text-gray-500">{currentAsset.name}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-gray-500">24h High</div>
                  <div className="text-gray-200 font-mono">${stats24h.high.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">24h Low</div>
                  <div className="text-gray-200 font-mono">${stats24h.low.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">24h Change</div>
                  <div className={stats24h.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {stats24h.changePercent >= 0 ? '+' : ''}
                    {stats24h.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Chart */}
        <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4 h-64">
          <SimpleChart asset={currentAsset} />
        </div>

        {/* Order Book */}
        {orderBook && (
          <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">Order Book</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Bids */}
              <div>
                <div className="flex justify-between text-gray-500 mb-2 font-medium">
                  <span>Price</span>
                  <span>Volume</span>
                </div>
                {orderBook.bids.slice(0, 5).map((bid, i) => (
                  <div key={i} className="flex justify-between text-green-400 mb-1">
                    <span className="font-mono">${bid.price.toFixed(2)}</span>
                    <span className="font-mono">{bid.volume.toFixed(4)}</span>
                  </div>
                ))}
              </div>

              {/* Asks */}
              <div>
                <div className="flex justify-between text-gray-500 mb-2 font-medium">
                  <span>Price</span>
                  <span>Volume</span>
                </div>
                {orderBook.asks.slice(0, 5).map((ask, i) => (
                  <div key={i} className="flex justify-between text-red-400 mb-1">
                    <span className="font-mono">${ask.price.toFixed(2)}</span>
                    <span className="font-mono">{ask.volume.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 text-center text-xs text-gray-400">
              Spread: ${orderBook.spread.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple price chart component
interface SimpleChartProps {
  asset: Asset | undefined;
}

function SimpleChart({ asset }: SimpleChartProps) {
  if (!asset || asset.priceHistory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Activity className="w-8 h-8 opacity-30" />
      </div>
    );
  }

  const prices = asset.priceHistory.slice(-60).map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  return (
    <div className="h-full relative">
      <svg className="w-full h-full">
        <polyline
          points={prices
            .map((price, i) => {
              const x = (i / (prices.length - 1)) * 100;
              const y = 100 - ((price - min) / range) * 90;
              return `${x},${y}`;
            })
            .join(' ')}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
