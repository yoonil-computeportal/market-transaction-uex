import { DatabaseService } from './DatabaseService';
import { CurrencyPair } from '../types';

export class ExchangeRateService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  // Mock exchange rates for demonstration
  private mockExchangeRates: Record<string, number> = {
    'USD_EUR': 0.85,
    'EUR_USD': 1.18,
    'USD_GBP': 0.73,
    'GBP_USD': 1.37,
    'USD_BTC': 0.000025,
    'BTC_USD': 40000,
    'USD_ETH': 0.0004,
    'ETH_USD': 2500,
    'EUR_BTC': 0.000029,
    'BTC_EUR': 34000,
    'GBP_BTC': 0.000034,
    'BTC_GBP': 29200,
    'EUR_ETH': 0.00047,
    'ETH_EUR': 2125,
    'GBP_ETH': 0.00055,
    'ETH_GBP': 1825
  };

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Check if it's the same currency
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    // First try to get from database
    const dbRate = await this.dbService.getLatestExchangeRate(fromCurrency, toCurrency);
    if (dbRate) {
      return dbRate.rate;
    }

    // Fallback to mock rates
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const mockRate = this.mockExchangeRates[rateKey];
    
    if (mockRate) {
      // Store the rate in database for future use
      await this.dbService.createExchangeRate({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: mockRate,
        source: 'mock_api',
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      return mockRate;
    }

    // If no rate found, calculate cross-rate if possible
    const crossRate = await this.calculateCrossRate(fromCurrency, toCurrency);
    if (crossRate) {
      return crossRate;
    }

    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }

  private async calculateCrossRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    // Try to find a common base currency (USD)
    const usdToFrom = this.mockExchangeRates[`USD_${fromCurrency}`];
    const usdToTo = this.mockExchangeRates[`USD_${toCurrency}`];
    
    if (usdToFrom && usdToTo) {
      return usdToTo / usdToFrom;
    }

    const fromToUsd = this.mockExchangeRates[`${fromCurrency}_USD`];
    const toToUsd = this.mockExchangeRates[`${toCurrency}_USD`];
    
    if (fromToUsd && toToUsd) {
      return fromToUsd / toToUsd;
    }

    return null;
  }

  async updateExchangeRates(): Promise<void> {
    // In a real implementation, this would fetch rates from external APIs
    // For now, we'll just update our mock rates with some variation
    const variation = 0.02; // 2% variation
    
    for (const [key, rate] of Object.entries(this.mockExchangeRates)) {
      const [fromCurrency, toCurrency] = key.split('_');
      if (fromCurrency && toCurrency) {
        const newRate = rate * (1 + (Math.random() - 0.5) * variation);
        
        await this.dbService.createExchangeRate({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: newRate,
          source: 'mock_api_update',
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    }
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const currencies = new Set<string>();
    
    for (const key of Object.keys(this.mockExchangeRates)) {
      const [from, to] = key.split('_');
      if (from) currencies.add(from);
      if (to) currencies.add(to);
    }
    
    return Array.from(currencies).sort();
  }

  async getCurrencyPairs(): Promise<CurrencyPair[]> {
    const pairs: CurrencyPair[] = [];
    
    for (const [key, rate] of Object.entries(this.mockExchangeRates)) {
      const [fromCurrency, toCurrency] = key.split('_');
      if (fromCurrency && toCurrency) {
        pairs.push({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: rate,
          last_updated: new Date()
        });
      }
    }
    
    return pairs;
  }

  async validateCurrencyPair(fromCurrency: string, toCurrency: string): Promise<boolean> {
    if (fromCurrency === toCurrency) {
      return true;
    }
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const reverseRateKey = `${toCurrency}_${fromCurrency}`;
    
    return !!(this.mockExchangeRates[rateKey] || this.mockExchangeRates[reverseRateKey]);
  }
} 