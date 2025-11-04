/**
 * Crypto Market Simulation Engine
 * Generates realistic price movements and order book data
 */

export interface Asset {
  symbol: string;
  name: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  volatility: number;
  trend: 'bullish' | 'bearish' | 'sideways';
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  volume: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
}

export interface MarketEvent {
  type: 'news' | 'whale' | 'crash' | 'pump';
  impact: number; // -1 to 1
  duration: number; // milliseconds
  timestamp: number;
}

/**
 * Market Simulator
 * Uses Geometric Brownian Motion for price generation
 */
export class MarketSimulator {
  private assets: Map<string, Asset> = new Map();
  private events: MarketEvent[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    // Initialize default assets
    this.initializeAssets();
  }

  private initializeAssets() {
    const defaultAssets: Omit<Asset, 'priceHistory'>[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: 43250,
        volatility: 0.05,
        trend: 'bullish',
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        currentPrice: 2280,
        volatility: 0.07,
        trend: 'bullish',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        currentPrice: 98.5,
        volatility: 0.1,
        trend: 'sideways',
      },
    ];

    for (const asset of defaultAssets) {
      this.assets.set(asset.symbol, {
        ...asset,
        priceHistory: [
          {
            timestamp: Date.now(),
            price: asset.currentPrice,
            volume: Math.random() * 1000000,
          },
        ],
      });
    }
  }

  /**
   * Generate next price using Geometric Brownian Motion
   */
  private generateNextPrice(
    currentPrice: number,
    volatility: number,
    trend: Asset['trend'],
    dt: number = 1 / 24 / 60 // 1 minute in days
  ): number {
    // Drift based on trend
    let mu = 0;
    if (trend === 'bullish') mu = 0.1; // 10% annual drift
    if (trend === 'bearish') mu = -0.1;

    // Random component
    const randomShock = this.randomNormal();

    // Apply active events
    const eventImpact = this.calculateEventImpact();
    mu += eventImpact;

    // GBM formula: S(t+dt) = S(t) * exp((mu - 0.5*σ²)*dt + σ*sqrt(dt)*Z)
    const exponent =
      (mu - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock;

    return currentPrice * Math.exp(exponent);
  }

  /**
   * Box-Muller transform for normal distribution
   */
  private randomNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Calculate impact from active market events
   */
  private calculateEventImpact(): number {
    const now = Date.now();
    let totalImpact = 0;

    // Remove expired events
    this.events = this.events.filter((event) => {
      return now < event.timestamp + event.duration;
    });

    // Sum active event impacts
    for (const event of this.events) {
      const timeElapsed = now - event.timestamp;
      const decayFactor = 1 - timeElapsed / event.duration;
      totalImpact += event.impact * decayFactor;
    }

    return totalImpact;
  }

  /**
   * Generate market event randomly
   */
  private maybeGenerateEvent() {
    // 5% chance of event per update
    if (Math.random() > 0.95) {
      const eventTypes: MarketEvent['type'][] = ['news', 'whale', 'crash', 'pump'];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      let impact = 0;
      let duration = 0;

      switch (type) {
        case 'news':
          impact = (Math.random() - 0.5) * 0.1; // ±5% impact
          duration = 60000; // 1 minute
          break;
        case 'whale':
          impact = (Math.random() - 0.5) * 0.2; // ±10% impact
          duration = 30000; // 30 seconds
          break;
        case 'crash':
          impact = -0.15; // -15% impact
          duration = 120000; // 2 minutes
          break;
        case 'pump':
          impact = 0.15; // +15% impact
          duration = 90000; // 1.5 minutes
          break;
      }

      this.events.push({
        type,
        impact,
        duration,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Update all asset prices
   */
  tick() {
    for (const [symbol, asset] of this.assets) {
      // Maybe generate event
      this.maybeGenerateEvent();

      // Generate next price
      const nextPrice = this.generateNextPrice(
        asset.currentPrice,
        asset.volatility,
        asset.trend
      );

      // Generate volume (random with some correlation to price change)
      const priceChange = Math.abs(nextPrice - asset.currentPrice) / asset.currentPrice;
      const baseVolume = 100000 + Math.random() * 900000;
      const volume = baseVolume * (1 + priceChange * 10);

      // Update asset
      asset.currentPrice = nextPrice;
      asset.priceHistory.push({
        timestamp: Date.now(),
        price: nextPrice,
        volume,
      });

      // Keep last 1000 points
      if (asset.priceHistory.length > 1000) {
        asset.priceHistory.shift();
      }

      this.assets.set(symbol, asset);
    }
  }

  /**
   * Generate order book around current price
   */
  generateOrderBook(symbol: string, levels: number = 10): OrderBook {
    const asset = this.assets.get(symbol);
    if (!asset) {
      return { bids: [], asks: [], spread: 0 };
    }

    const currentPrice = asset.currentPrice;
    const spread = currentPrice * 0.001; // 0.1% spread

    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    // Generate bids (buy orders below current price)
    for (let i = 0; i < levels; i++) {
      const priceOffset = ((i + 1) * spread) / levels;
      const price = currentPrice - priceOffset;
      const volume = (Math.random() * 10 + 1) * (levels - i); // More volume closer to mid
      const total = price * volume;

      bids.push({ price, volume, total });
    }

    // Generate asks (sell orders above current price)
    for (let i = 0; i < levels; i++) {
      const priceOffset = ((i + 1) * spread) / levels;
      const price = currentPrice + priceOffset;
      const volume = (Math.random() * 10 + 1) * (levels - i);
      const total = price * volume;

      asks.push({ price, volume, total });
    }

    return {
      bids: bids.sort((a, b) => b.price - a.price), // Highest bid first
      asks: asks.sort((a, b) => a.price - b.price), // Lowest ask first
      spread: asks[0].price - bids[0].price,
    };
  }

  /**
   * Start market simulation
   */
  start(intervalMs: number = 1000) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  /**
   * Stop market simulation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
  }

  /**
   * Get asset by symbol
   */
  getAsset(symbol: string): Asset | undefined {
    return this.assets.get(symbol);
  }

  /**
   * Get all assets
   */
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get current prices
   */
  getCurrentPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    for (const [symbol, asset] of this.assets) {
      prices[symbol] = asset.currentPrice;
    }
    return prices;
  }

  /**
   * Get active events
   */
  getActiveEvents(): MarketEvent[] {
    const now = Date.now();
    return this.events.filter((event) => now < event.timestamp + event.duration);
  }

  /**
   * Get 24h stats
   */
  get24hStats(symbol: string) {
    const asset = this.assets.get(symbol);
    if (!asset) return null;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const last24h = asset.priceHistory.filter((p) => p.timestamp >= oneDayAgo);

    if (last24h.length === 0) return null;

    const prices = last24h.map((p) => p.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const open = last24h[0].price;
    const close = asset.currentPrice;
    const change = close - open;
    const changePercent = (change / open) * 100;
    const volume = last24h.reduce((sum, p) => sum + p.volume, 0);

    return {
      high,
      low,
      open,
      close,
      change,
      changePercent,
      volume,
    };
  }

  /**
   * Manual price adjustment (for testing)
   */
  setPrice(symbol: string, price: number) {
    const asset = this.assets.get(symbol);
    if (asset) {
      asset.currentPrice = price;
      asset.priceHistory.push({
        timestamp: Date.now(),
        price,
        volume: 0,
      });
    }
  }

  /**
   * Change asset trend
   */
  setTrend(symbol: string, trend: Asset['trend']) {
    const asset = this.assets.get(symbol);
    if (asset) {
      asset.trend = trend;
    }
  }
}

// Singleton instance
export const marketSimulator = new MarketSimulator();
