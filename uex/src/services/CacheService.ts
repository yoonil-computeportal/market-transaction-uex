/**
 * Cache Service for UEX Data
 * Caches currencies and exchange rates to reduce API calls
 */

import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,           // Default TTL: 5 minutes
      checkperiod: 60,       // Check for expired keys every 60 seconds
      useClones: false       // Don't clone data for better performance
    });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete cached value
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Flush all cached data
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Cache currencies (1 hour TTL)
   */
  setCurrencies(currencies: any[]): void {
    this.set('uex:currencies', currencies, 3600); // 1 hour
  }

  /**
   * Get cached currencies
   */
  getCurrencies(): any[] | undefined {
    return this.get<any[]>('uex:currencies');
  }

  /**
   * Cache exchange rate (5 minutes TTL)
   */
  setExchangeRate(from: string, to: string, rate: number): void {
    const key = `uex:rate:${from}:${to}`;
    this.set(key, rate, 300); // 5 minutes
  }

  /**
   * Get cached exchange rate
   */
  getExchangeRate(from: string, to: string): number | undefined {
    const key = `uex:rate:${from}:${to}`;
    return this.get<number>(key);
  }

  /**
   * Cache OAuth2 token (with expiration)
   */
  setOAuth2Token(token: string, expiresIn: number): void {
    // Set expiration slightly earlier to account for request time
    const ttl = Math.max(expiresIn - 60, 60);
    this.set('uex:oauth2:token', token, ttl);
  }

  /**
   * Get cached OAuth2 token
   */
  getOAuth2Token(): string | undefined {
    return this.get<string>('uex:oauth2:token');
  }

  /**
   * Cache order status (1 minute TTL)
   */
  setOrderStatus(orderId: string, status: any): void {
    const key = `uex:order:${orderId}`;
    this.set(key, status, 60); // 1 minute
  }

  /**
   * Get cached order status
   */
  getOrderStatus(orderId: string): any | undefined {
    const key = `uex:order:${orderId}`;
    return this.get<any>(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
