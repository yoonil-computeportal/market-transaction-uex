/**
 * Enhanced Exchange Rate Service with UEX Integration
 * Provides real-time cryptocurrency exchange rates from UEX API
 * Falls back to mock rates for fiat currencies
 */

import { DatabaseService } from './DatabaseService';
import { uexService, UEXService } from './UEXService';
import { CurrencyPair } from '../types';
import { UEXAPIError } from '../types/uex';

export class ExchangeRateService {
  private dbService: DatabaseService;
  private uexService: UEXService;

  // Mock exchange rates for fiat currencies (fallback)
  private mockFiatRates: Record<string, number> = {
    'USD_EUR': 0.85,
    'EUR_USD': 1.18,
    'USD_GBP': 0.73,
    'GBP_USD': 1.37,
    'EUR_GBP': 0.86,
    'GBP_EUR': 1.16
  };

  // Common crypto-fiat rates (fallback if UEX unavailable)
  private mockCryptoRates: Record<string, number> = {
    'USD_BTC': 0.000025,
    'BTC_USD': 40000,
    'USD_ETH': 0.0004,
    'ETH_USD': 2500,
    'USD_USDT': 1.0,
    'USDT_USD': 1.0,
    'EUR_BTC': 0.000029,
    'BTC_EUR': 34000,
    'GBP_BTC': 0.000034,
    'BTC_GBP': 29200
  };

  // List of known cryptocurrencies (will be updated from UEX)
  private cryptoCurrencies = new Set([
    'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'SOL', 'XRP',
    'DOGE', 'DOT', 'MATIC', 'TRX', 'LTC', 'AVAX', 'LINK'
  ]);

  constructor(dbService: DatabaseService, uexServiceInstance?: UEXService) {
    this.dbService = dbService;
    this.uexService = uexServiceInstance || uexService;
    this.loadCryptoCurrenciesFromUEX();
  }

  /**
   * Load supported cryptocurrencies from UEX
   * Updates the cryptoCurrencies set
   */
  private async loadCryptoCurrenciesFromUEX(): Promise<void> {
    try {
      const currencies = await this.uexService.getCurrencies();
      currencies.forEach(c => this.cryptoCurrencies.add(c.code));
      console.log(`[ExchangeRate] Loaded ${currencies.length} cryptocurrencies from UEX`);
    } catch (error) {
      console.warn('[ExchangeRate] Failed to load currencies from UEX, using defaults');
    }
  }

  /**
   * Check if currency is a cryptocurrency
   */
  private isCrypto(currency: string): boolean {
    return this.cryptoCurrencies.has(currency.toUpperCase());
  }

  /**
   * Get exchange rate between two currencies
   * Prioritizes UEX API for crypto pairs, falls back to mock rates
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Same currency
    if (from === to) {
      return 1.0;
    }

    // Check if either is crypto
    const fromIsCrypto = this.isCrypto(from);
    const toIsCrypto = this.isCrypto(to);

    // If both are crypto, use UEX
    if (fromIsCrypto && toIsCrypto) {
      return await this.getUEXRate(from, to);
    }

    // If one is crypto, use UEX (if available) or fallback
    if (fromIsCrypto || toIsCrypto) {
      return await this.getCryptoFiatRate(from, to);
    }

    // Both are fiat, use database or mock rates
    return await this.getFiatRate(from, to);
  }

  /**
   * Get crypto-to-crypto rate from UEX
   */
  private async getUEXRate(from: string, to: string): Promise<number> {
    try {
      // Check database first (cached rates)
      const dbRate = await this.dbService.getLatestExchangeRate(from, to);
      if (dbRate && this.isRateValid(dbRate.valid_until)) {
        console.log(`[ExchangeRate] Using cached UEX rate: ${from}/${to}`);
        return dbRate.rate;
      }

      // Get currency details to determine network
      const fromCurrency = await this.uexService.getCurrency(from);
      const toCurrency = await this.uexService.getCurrency(to);

      if (!fromCurrency || !toCurrency) {
        throw new Error(`Currency not supported: ${from} or ${to}`);
      }

      // Get rate from UEX
      const rate = await this.uexService.getExchangeRate(
        from,
        fromCurrency.network,
        to,
        toCurrency.network
      );

      // Store in database (valid for 5 minutes)
      await this.dbService.createExchangeRate({
        from_currency: from,
        to_currency: to,
        rate,
        source: 'uex_api',
        valid_until: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      console.log(`[ExchangeRate] UEX rate: 1 ${from} = ${rate} ${to}`);
      return rate;

    } catch (error) {
      if (error instanceof UEXAPIError) {
        console.warn(`[ExchangeRate] UEX API error for ${from}/${to}:`, error.message);
      } else {
        console.warn(`[ExchangeRate] Error getting UEX rate for ${from}/${to}:`, error);
      }

      // Fallback to mock rate or throw
      return await this.getFallbackRate(from, to);
    }
  }

  /**
   * Get crypto-fiat rate
   * Tries UEX first, then mock rates
   */
  private async getCryptoFiatRate(from: string, to: string): Promise<number> {
    try {
      // For crypto-fiat, we need to convert through USDT/USD
      const fromIsCrypto = this.isCrypto(from);

      if (fromIsCrypto) {
        // Crypto to Fiat: Convert to USDT first, then to target fiat
        const cryptoToUSDT = await this.getUEXRate(from, 'USDT');
        const usdtToFiat = await this.getFiatRate('USD', to); // USDT ≈ USD
        return cryptoToUSDT * usdtToFiat;
      } else {
        // Fiat to Crypto: Convert to USD first, then to target crypto
        const fiatToUSD = await this.getFiatRate(from, 'USD');
        const usdToUSDT = 1.0; // USD ≈ USDT
        const usdtToCrypto = await this.getUEXRate('USDT', to);
        return fiatToUSD * usdToUSDT * usdtToCrypto;
      }
    } catch (error) {
      console.warn(`[ExchangeRate] Error getting crypto-fiat rate for ${from}/${to}:`, error);
      return await this.getFallbackRate(from, to);
    }
  }

  /**
   * Get fiat-to-fiat rate from mock data or database
   */
  private async getFiatRate(from: string, to: string): Promise<number> {
    // Check database first
    const dbRate = await this.dbService.getLatestExchangeRate(from, to);
    if (dbRate && this.isRateValid(dbRate.valid_until)) {
      return dbRate.rate;
    }

    // Check mock rates
    const rateKey = `${from}_${to}`;
    const mockRate = this.mockFiatRates[rateKey];

    if (mockRate) {
      // Store in database
      await this.dbService.createExchangeRate({
        from_currency: from,
        to_currency: to,
        rate: mockRate,
        source: 'mock_api',
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      return mockRate;
    }

    // Try cross-rate
    const crossRate = await this.calculateCrossRate(from, to);
    if (crossRate) {
      return crossRate;
    }

    throw new Error(`Exchange rate not available for ${from} to ${to}`);
  }

  /**
   * Fallback to mock rates or throw error
   */
  private async getFallbackRate(from: string, to: string): Promise<number> {
    const rateKey = `${from}_${to}`;
    const mockRate = this.mockCryptoRates[rateKey] || this.mockFiatRates[rateKey];

    if (mockRate) {
      console.log(`[ExchangeRate] Using fallback mock rate for ${from}/${to}`);
      return mockRate;
    }

    // Try reverse rate
    const reverseKey = `${to}_${from}`;
    const reverseRate = this.mockCryptoRates[reverseKey] || this.mockFiatRates[reverseKey];

    if (reverseRate) {
      console.log(`[ExchangeRate] Using inverted fallback rate for ${from}/${to}`);
      return 1 / reverseRate;
    }

    throw new Error(`Exchange rate not available for ${from} to ${to}`);
  }

  /**
   * Check if rate is still valid
   */
  private isRateValid(validUntil: Date): boolean {
    return new Date(validUntil) > new Date();
  }

  /**
   * Calculate cross-rate through USD
   */
  private async calculateCrossRate(from: string, to: string): Promise<number | null> {
    try {
      // Try through USD
      const fromToUSD = this.mockFiatRates[`${from}_USD`];
      const usdToTo = this.mockFiatRates[`USD_${to}`];

      if (fromToUSD && usdToTo) {
        return fromToUSD * usdToTo;
      }

      const usdToFrom = this.mockFiatRates[`USD_${from}`];
      const toToUSD = this.mockFiatRates[`${to}_USD`];

      if (usdToFrom && toToUSD) {
        return toToUSD / usdToFrom;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update exchange rates from UEX
   * Called periodically to refresh crypto rates
   */
  async updateExchangeRates(): Promise<void> {
    try {
      console.log('[ExchangeRate] Updating rates from UEX...');

      // Get all supported currencies
      const currencies = await this.uexService.getCurrencies();

      // Update rates for major pairs (to avoid too many API calls)
      const majorCryptos = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB'];
      const majorFiats = ['USD', 'EUR', 'GBP'];

      let updated = 0;

      // Update crypto-to-USDT rates
      for (const crypto of majorCryptos) {
        try {
          if (crypto === 'USDT') continue; // Skip USDT to USDT

          const currency = currencies.find(c => c.code === crypto);
          if (!currency) continue;

          const rate = await this.uexService.getExchangeRate(
            crypto,
            currency.network,
            'USDT',
            'TRX' // Use Tron network for USDT
          );

          await this.dbService.createExchangeRate({
            from_currency: crypto,
            to_currency: 'USDT',
            rate,
            source: 'uex_api_update',
            valid_until: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
          });

          updated++;

          // Rate limit: Wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`[ExchangeRate] Failed to update ${crypto}/USDT rate:`, error);
        }
      }

      console.log(`[ExchangeRate] Updated ${updated} rates from UEX`);

    } catch (error) {
      console.error('[ExchangeRate] Failed to update rates from UEX:', error);
    }
  }

  /**
   * Get supported currencies (fiat + crypto)
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const currencies = new Set<string>();

    // Add fiat currencies
    for (const key of Object.keys(this.mockFiatRates)) {
      const [from, to] = key.split('_');
      if (from) currencies.add(from);
      if (to) currencies.add(to);
    }

    // Add crypto currencies from UEX
    try {
      const uexCurrencies = await this.uexService.getCurrencies();
      uexCurrencies.forEach(c => currencies.add(c.code));
    } catch (error) {
      console.warn('[ExchangeRate] Failed to get UEX currencies, using cached list');
      this.cryptoCurrencies.forEach(c => currencies.add(c));
    }

    return Array.from(currencies).sort();
  }

  /**
   * Get all currency pairs (for API listing)
   */
  async getCurrencyPairs(): Promise<CurrencyPair[]> {
    const pairs: CurrencyPair[] = [];

    // Get pairs from database (recent rates)
    try {
      const recentRates = await this.dbService.getRecentExchangeRates(100);
      recentRates.forEach(rate => {
        pairs.push({
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
          rate: rate.rate,
          last_updated: rate.created_at
        });
      });
    } catch (error) {
      console.warn('[ExchangeRate] Failed to get recent rates from database');
    }

    return pairs;
  }

  /**
   * Validate if currency pair is supported
   */
  async validateCurrencyPair(from: string, to: string): Promise<boolean> {
    if (from === to) {
      return true;
    }

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Check if both are supported currencies
    const supported = await this.getSupportedCurrencies();
    const fromSupported = supported.includes(fromUpper);
    const toSupported = supported.includes(toUpper);

    if (!fromSupported || !toSupported) {
      return false;
    }

    // If both are crypto, check UEX
    if (this.isCrypto(fromUpper) && this.isCrypto(toUpper)) {
      try {
        const fromCurrency = await this.uexService.getCurrency(fromUpper);
        const toCurrency = await this.uexService.getCurrency(toUpper);
        return !!(fromCurrency && toCurrency);
      } catch (error) {
        return false;
      }
    }

    // For fiat or crypto-fiat pairs, assume supported if both currencies exist
    return true;
  }

  /**
   * Get detailed currency information (if crypto)
   */
  async getCurrencyInfo(code: string): Promise<any> {
    if (this.isCrypto(code.toUpperCase())) {
      try {
        return await this.uexService.getCurrency(code.toUpperCase());
      } catch (error) {
        return null;
      }
    }

    // Return basic info for fiat
    return {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      type: 'fiat'
    };
  }
}
