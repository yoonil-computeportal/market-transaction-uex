/**
 * UEX Service Integration Tests
 * Tests the complete UEX API integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { uexService } from '../services/UEXService';
import { UEXAPIError } from '../types/uex';

describe('UEXService Integration Tests', () => {
  beforeAll(() => {
    console.log('Starting UEX Service Integration Tests...');
  });

  afterAll(() => {
    console.log('UEX Service Integration Tests completed.');
  });

  describe('Health Check', () => {
    it('should return health status for all UEX APIs', async () => {
      const health = await uexService.checkHealth();

      expect(health).toHaveProperty('swap_api');
      expect(health).toHaveProperty('merchant_api');
      expect(health).toHaveProperty('cache');

      expect(health.swap_api).toHaveProperty('status');
      expect(health.merchant_api).toHaveProperty('status');

      console.log('Health Check:', health);
    });
  });

  describe('Currency Operations', () => {
    it('should fetch list of supported cryptocurrencies', async () => {
      const currencies = await uexService.getCurrencies();

      expect(currencies).toBeInstanceOf(Array);
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies[0]).toHaveProperty('code');
      expect(currencies[0]).toHaveProperty('name');
      expect(currencies[0]).toHaveProperty('network');

      console.log(`Found ${currencies.length} currencies`);
    }, 15000); // 15 second timeout

    it('should get specific currency details for BTC', async () => {
      const btc = await uexService.getCurrency('BTC');

      expect(btc).toBeDefined();
      expect(btc?.code).toBe('BTC');
      expect(btc?.name).toContain('Bitcoin');
      expect(btc).toHaveProperty('network');

      console.log('BTC Details:', btc);
    });

    it('should get specific currency details for ETH', async () => {
      const eth = await uexService.getCurrency('ETH');

      expect(eth).toBeDefined();
      expect(eth?.code).toBe('ETH');
      expect(eth?.name).toContain('Ethereum');

      console.log('ETH Details:', eth);
    });

    it('should return null for unsupported currency', async () => {
      const unsupported = await uexService.getCurrency('FAKECOIN');

      expect(unsupported).toBeNull();
    });

    it('should use cache on second request', async () => {
      // First request
      const start1 = Date.now();
      await uexService.getCurrencies();
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await uexService.getCurrencies();
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1);
      console.log(`Cache performance: ${time1}ms -> ${time2}ms`);
    });
  });

  describe('Exchange Rate Operations', () => {
    it('should get BTC to USDT exchange rate', async () => {
      const rate = await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');

      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);

      console.log(`BTC/USDT Rate: ${rate.toFixed(2)}`);
    }, 10000);

    it('should get ETH to USDT exchange rate', async () => {
      const rate = await uexService.getExchangeRate('ETH', 'ETH', 'USDT', 'TRX');

      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);

      console.log(`ETH/USDT Rate: ${rate.toFixed(2)}`);
    }, 10000);

    it('should estimate conversion with valid parameters', async () => {
      const estimate = await uexService.estimateConversion({
        from_currency: 'BTC',
        from_network: 'BTC',
        to_currency: 'USDT',
        to_network: 'TRX',
        amount: 0.5
      });

      expect(estimate).toHaveProperty('from_amount');
      expect(estimate).toHaveProperty('to_amount');
      expect(estimate).toHaveProperty('exchange_rate');
      expect(estimate).toHaveProperty('fee');

      expect(estimate.from_amount).toBe(0.5);
      expect(estimate.to_amount).toBeGreaterThan(0);
      expect(estimate.exchange_rate).toBeGreaterThan(0);

      console.log('Estimate:', estimate);
    }, 10000);

    it('should throw error for invalid amount', async () => {
      await expect(
        uexService.estimateConversion({
          from_currency: 'BTC',
          from_network: 'BTC',
          to_currency: 'USDT',
          to_network: 'TRX',
          amount: 0
        })
      ).rejects.toThrow();
    });

    it('should cache exchange rates', async () => {
      // First request
      const start1 = Date.now();
      await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1);
      console.log(`Rate cache: ${time1}ms -> ${time2}ms`);
    });
  });

  describe('Swap Operations', () => {
    it.skip('should initiate crypto swap (SKIPPED - requires real BTC)', async () => {
      // This test is skipped to avoid accidental real transactions
      // To enable: remove .skip and provide real recipient address

      const swap = await uexService.initiateCryptoSwap(
        0.001, // Small test amount
        'BTC',
        'BTC',
        'USDT',
        'TRX',
        'YOUR_USDT_TRX_ADDRESS_HERE'
      );

      expect(swap).toHaveProperty('orderId');
      expect(swap).toHaveProperty('deposit_address');
      expect(swap).toHaveProperty('from_amount');
      expect(swap).toHaveProperty('to_amount');
      expect(swap).toHaveProperty('status');

      console.log('Swap Initiated:', swap);
    });

    it('should throw error for initiate swap with invalid amount', async () => {
      await expect(
        uexService.initiateCryptoSwap(
          0,
          'BTC',
          'BTC',
          'USDT',
          'TRX',
          'TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE'
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid recipient address', async () => {
      await expect(
        uexService.initiateCryptoSwap(
          0.001,
          'BTC',
          'BTC',
          'USDT',
          'TRX',
          'invalid-address'
        )
      ).rejects.toThrow();
    });
  });

  describe('Order Status Operations', () => {
    it('should throw error for non-existent order ID', async () => {
      await expect(
        uexService.getOrderStatus('invalid-order-id-12345')
      ).rejects.toThrow(UEXAPIError);
    });

    it.skip('should get order status for valid order (SKIPPED - needs real order)', async () => {
      // Replace with a real order ID from a previous transaction
      const orderId = 'YOUR_REAL_ORDER_ID_HERE';

      const status = await uexService.getOrderStatus(orderId);

      expect(status).toHaveProperty('order_id');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('external_status');

      console.log('Order Status:', status);
    });
  });

  describe('Merchant API Operations', () => {
    it.skip('should get OAuth2 token (SKIPPED - requires merchant credentials)', async () => {
      // Requires UEX_CLIENT_ID and UEX_SECRET_KEY in environment
      // To enable: configure merchant credentials and remove .skip

      const token = await uexService.getOAuth2Token();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      console.log('OAuth2 Token acquired:', token.substring(0, 20) + '...');
    });

    it.skip('should generate payment link (SKIPPED - requires merchant credentials)', async () => {
      // Requires UEX merchant credentials
      // To enable: configure credentials and remove .skip

      const paymentLink = await uexService.generatePaymentLink({
        order_id: 'TEST-ORDER-' + Date.now(),
        item_name: 'Test Product',
        amount: '100',
        success_url: 'https://example.com/success',
        failure_url: 'https://example.com/failed'
      });

      expect(paymentLink).toHaveProperty('payment_url');
      expect(paymentLink.payment_url).toContain('https://');

      console.log('Payment Link:', paymentLink.payment_url);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Temporarily override base URL to simulate network error
      const originalUrl = process.env.UEX_SWAP_BASE_URL;
      process.env.UEX_SWAP_BASE_URL = 'https://invalid-url-that-does-not-exist.com';

      await expect(
        uexService.getCurrencies()
      ).rejects.toThrow();

      // Restore original URL
      process.env.UEX_SWAP_BASE_URL = originalUrl;
    });

    it('should provide detailed error messages', async () => {
      try {
        await uexService.getOrderStatus('invalid-order');
      } catch (error) {
        expect(error).toBeInstanceOf(UEXAPIError);
        if (error instanceof UEXAPIError) {
          expect(error.message).toBeTruthy();
          expect(error.statusCode).toBeDefined();
          console.log('Error Details:', { message: error.message, code: error.statusCode });
        }
      }
    });
  });

  describe('Cache Operations', () => {
    it('should track cache statistics', async () => {
      // Make some requests to populate cache
      await uexService.getCurrencies();
      await uexService.getCurrencies(); // Cached
      await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
      await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX'); // Cached

      const health = await uexService.checkHealth();
      const cacheStats = health.cache;

      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(cacheStats.hit_rate).toBeGreaterThan(0);

      console.log('Cache Stats:', cacheStats);
    });
  });
});
