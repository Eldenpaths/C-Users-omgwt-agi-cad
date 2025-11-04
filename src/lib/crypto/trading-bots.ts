/**
 * AI Trading Bots System
 * Implements various trading strategies with performance tracking
 */

export interface Portfolio {
  cash: number;
  holdings: Record<string, number>; // asset -> quantity
  totalValue: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  asset: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  profit?: number;
}

export interface TradingBot {
  id: string;
  name: string;
  strategy: 'trend' | 'mean-reversion' | 'arbitrage' | 'sentiment';
  portfolio: Portfolio;
  performance: {
    trades: number;
    winRate: number;
    totalPnL: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  active: boolean;
  trades: Trade[];
  parameters: Record<string, any>;
}

export interface MarketData {
  price: number;
  volume: number;
  timestamp: number;
  high24h: number;
  low24h: number;
  change24h: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
  volume: number;
}

/**
 * Base Trading Bot Class
 */
export abstract class BaseBot {
  protected bot: TradingBot;
  protected priceHistory: PriceHistory[] = [];

  constructor(bot: TradingBot) {
    this.bot = bot;
  }

  /**
   * Analyze market and decide whether to trade
   */
  abstract analyze(marketData: MarketData): 'buy' | 'sell' | 'hold';

  /**
   * Execute a trade
   */
  executeTrade(
    side: 'buy' | 'sell',
    asset: string,
    quantity: number,
    price: number
  ): Trade {
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      asset,
      side,
      quantity,
      price,
    };

    // Update portfolio
    if (side === 'buy') {
      const cost = quantity * price;
      if (this.bot.portfolio.cash >= cost) {
        this.bot.portfolio.cash -= cost;
        this.bot.portfolio.holdings[asset] =
          (this.bot.portfolio.holdings[asset] || 0) + quantity;
      } else {
        throw new Error('Insufficient funds');
      }
    } else {
      // sell
      if ((this.bot.portfolio.holdings[asset] || 0) >= quantity) {
        this.bot.portfolio.cash += quantity * price;
        this.bot.portfolio.holdings[asset] -= quantity;
      } else {
        throw new Error('Insufficient holdings');
      }
    }

    // Record trade
    this.bot.trades.push(trade);
    this.bot.performance.trades++;

    // Calculate profit if it's a sell
    if (side === 'sell') {
      // Find corresponding buy
      const buyTrades = this.bot.trades.filter(
        (t) => t.asset === asset && t.side === 'buy'
      );
      if (buyTrades.length > 0) {
        const avgBuyPrice =
          buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length;
        trade.profit = (price - avgBuyPrice) * quantity;
        this.bot.performance.totalPnL += trade.profit;

        // Update win rate
        if (trade.profit > 0) {
          const wins = this.bot.trades.filter((t) => (t.profit || 0) > 0).length;
          this.bot.performance.winRate = wins / this.bot.performance.trades;
        }
      }
    }

    return trade;
  }

  /**
   * Update price history for technical indicators
   */
  updateHistory(data: PriceHistory) {
    this.priceHistory.push(data);
    // Keep last 200 data points
    if (this.priceHistory.length > 200) {
      this.priceHistory.shift();
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  protected calculateSMA(period: number): number {
    if (this.priceHistory.length < period) return 0;

    const recent = this.priceHistory.slice(-period);
    const sum = recent.reduce((acc, p) => acc + p.price, 0);
    return sum / period;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  protected calculateRSI(period: number = 14): number {
    if (this.priceHistory.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      changes.push(this.priceHistory[i].price - this.priceHistory[i - 1].price);
    }

    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter((c) => c > 0);
    const losses = recentChanges.filter((c) => c < 0).map(Math.abs);

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * Calculate Bollinger Bands
   */
  protected calculateBollingerBands(period: number = 20, stdDev: number = 2) {
    if (this.priceHistory.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }

    const sma = this.calculateSMA(period);
    const recent = this.priceHistory.slice(-period);

    // Calculate standard deviation
    const squaredDiffs = recent.map((p) => Math.pow(p.price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std,
    };
  }

  getBot(): TradingBot {
    return this.bot;
  }
}

/**
 * Trend Following Bot
 * Buys on upward momentum, sells on downward momentum
 */
export class TrendFollowingBot extends BaseBot {
  analyze(marketData: MarketData): 'buy' | 'sell' | 'hold' {
    this.updateHistory({
      timestamp: marketData.timestamp,
      price: marketData.price,
      volume: marketData.volume,
    });

    const shortSMA = this.calculateSMA(10);
    const longSMA = this.calculateSMA(50);

    if (shortSMA === 0 || longSMA === 0) return 'hold';

    // Golden cross - buy signal
    if (shortSMA > longSMA * 1.02) {
      return 'buy';
    }

    // Death cross - sell signal
    if (shortSMA < longSMA * 0.98) {
      return 'sell';
    }

    return 'hold';
  }
}

/**
 * Mean Reversion Bot
 * Buys when oversold, sells when overbought
 */
export class MeanReversionBot extends BaseBot {
  analyze(marketData: MarketData): 'buy' | 'sell' | 'hold' {
    this.updateHistory({
      timestamp: marketData.timestamp,
      price: marketData.price,
      volume: marketData.volume,
    });

    const rsi = this.calculateRSI(14);

    if (rsi === 0) return 'hold';

    // Oversold - buy signal
    if (rsi < 30) {
      return 'buy';
    }

    // Overbought - sell signal
    if (rsi > 70) {
      return 'sell';
    }

    return 'hold';
  }
}

/**
 * Arbitrage Bot
 * Exploits price differences (simplified)
 */
export class ArbitrageBot extends BaseBot {
  private targetPrice: number = 0;

  analyze(marketData: MarketData): 'buy' | 'sell' | 'hold' {
    this.updateHistory({
      timestamp: marketData.timestamp,
      price: marketData.price,
      volume: marketData.volume,
    });

    if (this.priceHistory.length < 20) return 'hold';

    // Calculate average price over last 20 periods
    const avgPrice = this.calculateSMA(20);

    // If price is 2% below average, buy
    if (marketData.price < avgPrice * 0.98) {
      this.targetPrice = avgPrice;
      return 'buy';
    }

    // If we have a target and price reached it, sell
    if (this.targetPrice > 0 && marketData.price >= this.targetPrice) {
      this.targetPrice = 0;
      return 'sell';
    }

    return 'hold';
  }
}

/**
 * Sentiment Bot
 * Trades based on volatility and volume
 */
export class SentimentBot extends BaseBot {
  analyze(marketData: MarketData): 'buy' | 'sell' | 'hold' {
    this.updateHistory({
      timestamp: marketData.timestamp,
      price: marketData.price,
      volume: marketData.volume,
    });

    const bands = this.calculateBollingerBands(20, 2);

    if (bands.middle === 0) return 'hold';

    // Price below lower band + volume spike = buy
    if (marketData.price < bands.lower && marketData.volume > this.getAvgVolume() * 1.5) {
      return 'buy';
    }

    // Price above upper band = sell
    if (marketData.price > bands.upper) {
      return 'sell';
    }

    return 'hold';
  }

  private getAvgVolume(): number {
    if (this.priceHistory.length === 0) return 0;
    const sum = this.priceHistory.reduce((acc, p) => acc + p.volume, 0);
    return sum / this.priceHistory.length;
  }
}

/**
 * Create a bot instance
 */
export function createBot(
  strategy: TradingBot['strategy'],
  name: string,
  initialCash: number = 10000
): BaseBot {
  const bot: TradingBot = {
    id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    strategy,
    portfolio: {
      cash: initialCash,
      holdings: {},
      totalValue: initialCash,
    },
    performance: {
      trades: 0,
      winRate: 0,
      totalPnL: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
    },
    active: true,
    trades: [],
    parameters: {},
  };

  switch (strategy) {
    case 'trend':
      return new TrendFollowingBot(bot);
    case 'mean-reversion':
      return new MeanReversionBot(bot);
    case 'arbitrage':
      return new ArbitrageBot(bot);
    case 'sentiment':
      return new SentimentBot(bot);
    default:
      return new TrendFollowingBot(bot);
  }
}

/**
 * Calculate portfolio total value
 */
export function calculatePortfolioValue(
  portfolio: Portfolio,
  currentPrices: Record<string, number>
): number {
  let total = portfolio.cash;

  for (const [asset, quantity] of Object.entries(portfolio.holdings)) {
    const price = currentPrices[asset] || 0;
    total += quantity * price;
  }

  return total;
}
