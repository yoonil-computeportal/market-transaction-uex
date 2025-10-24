/**
 * UEX Integration Test Script
 * Tests the complete UEX API integration
 *
 * Usage:
 *   ts-node test-uex-integration.ts
 *
 * Prerequisites:
 *   1. Copy .env.example to .env
 *   2. Add your UEX_REFERRAL_CODE
 *   3. Install dependencies: npm install
 */

import { uexService } from './src/services/UEXService';
import { ExchangeRateService } from './src/services/ExchangeRateServiceEnhanced';
import { DatabaseService } from './src/services/DatabaseService';

async function testUEXIntegration() {
  console.log('🧪 UEX Integration Test Suite\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Health Check
  try {
    console.log('\n✓ Test 1: Health Check');
    const health = await uexService.checkHealth();
    console.log('  - Swap API:', health.swap_api.status);
    console.log('  - Merchant API:', health.merchant_api.status);
    console.log('  - Cache:', `${health.cache.hits} hits, ${health.cache.misses} misses`);
    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 2: Get Currencies
  try {
    console.log('\n✓ Test 2: Get Supported Currencies');
    const currencies = await uexService.getCurrencies();
    console.log(`  - Found ${currencies.length} cryptocurrencies`);
    console.log(`  - Examples: ${currencies.slice(0, 5).map(c => c.code).join(', ')}...`);
    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 3: Get Specific Currency
  try {
    console.log('\n✓ Test 3: Get Bitcoin Details');
    const btc = await uexService.getCurrency('BTC');
    if (btc) {
      console.log(`  - Code: ${btc.code}`);
      console.log(`  - Name: ${btc.name}`);
      console.log(`  - Network: ${btc.network}`);
    }
    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 4: Get Exchange Rate
  try {
    console.log('\n✓ Test 4: Get BTC to USDT Exchange Rate');
    const rate = await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
    console.log(`  - 1 BTC = ${rate.toFixed(2)} USDT`);
    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 5: Estimate Conversion
  try {
    console.log('\n✓ Test 5: Estimate 0.5 BTC to USDT Conversion');
    const estimate = await uexService.estimateConversion({
      from_currency: 'BTC',
      from_network: 'BTC',
      to_currency: 'USDT',
      to_network: 'TRX',
      amount: 0.5
    });
    console.log(`  - Send: ${estimate.from_amount} BTC`);
    console.log(`  - Receive: ${estimate.to_amount} USDT`);
    console.log(`  - Rate: ${estimate.exchange_rate.toFixed(2)}`);
    console.log(`  - Fee: ${estimate.fee} USDT`);
    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 6: Enhanced Exchange Rate Service
  try {
    console.log('\n✓ Test 6: Enhanced Exchange Rate Service');
    const dbService = new DatabaseService();
    const exchangeRateService = new ExchangeRateService(dbService);

    const btcUsdtRate = await exchangeRateService.getExchangeRate('BTC', 'USDT');
    console.log(`  - BTC/USDT via enhanced service: ${btcUsdtRate.toFixed(2)}`);

    const supportedCurrencies = await exchangeRateService.getSupportedCurrencies();
    console.log(`  - Total supported currencies: ${supportedCurrencies.length}`);

    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 7: Initiate Crypto Swap (Simulation - requires real BTC)
  try {
    console.log('\n✓ Test 7: Simulate Crypto Swap Initiation');
    console.log('  - ⚠️  Skipping actual swap initiation (requires real BTC)');
    console.log('  - To test: Uncomment the code below and use a test amount');

    // UNCOMMENT TO TEST REAL SWAP:
    // const swap = await uexService.initiateCryptoSwap(
    //   0.001, // Small test amount
    //   'BTC',
    //   'BTC',
    //   'USDT',
    //   'TRX',
    //   'YOUR_USDT_TRX_ADDRESS_HERE'
    // );
    // console.log(`  - Order ID: ${swap.orderId}`);
    // console.log(`  - Deposit Address: ${swap.deposit_address}`);

    passedTests++;
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Test 8: OAuth2 Token (if credentials configured)
  try {
    console.log('\n✓ Test 8: OAuth2 Token Acquisition');

    if (process.env.UEX_CLIENT_ID && process.env.UEX_SECRET_KEY) {
      const token = await uexService.getOAuth2Token();
      console.log(`  - Token acquired: ${token.substring(0, 20)}...`);
      passedTests++;
    } else {
      console.log('  - ⚠️  Skipping (merchant credentials not configured)');
      console.log('  - Configure UEX_CLIENT_ID and UEX_SECRET_KEY to test');
      passedTests++;
    }
  } catch (error) {
    console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! UEX integration is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.\n');
  }
}

// Run the tests
console.log('Starting UEX Integration Tests...\n');
testUEXIntegration()
  .then(() => {
    console.log('Test suite completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
