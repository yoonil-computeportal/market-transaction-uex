# UEXService - Complete API Integration

**Status**: ✅ **IMPLEMENTED** - Ready for Testing
**Created**: 2025-10-23
**API Documentation**: https://uex-us.stoplight.io/docs/uex

---

## 🎉 What Was Implemented

Complete integration with UEX cryptocurrency exchange and payment APIs, including:

### Core Features
- ✅ **Currency Operations**: Fetch 50+ supported cryptocurrencies
- ✅ **Exchange Rate Estimation**: Real-time conversion rates with caching
- ✅ **Crypto Swap Initiation**: Create crypto-to-crypto swaps
- ✅ **Order Status Tracking**: Poll transaction status
- ✅ **Merchant Payment Links**: OAuth2 + payment URL generation (optional)
- ✅ **Intelligent Caching**: Reduce API calls with TTL-based caching
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Health Checks**: API availability monitoring

---

## 📁 Files Created

```
uex/src/
├── types/
│   └── uex.ts                    # All UEX API types and interfaces
├── config/
│   └── uex-config.ts            # Configuration management
├── services/
│   ├── UEXService.ts            # Main UEX API integration (NEW)
│   └── CacheService.ts          # Caching layer (NEW)
└── .env.example                  # Environment variables template (NEW)
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd uex
npm install node-cache
```

### 2. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your UEX referral code
nano .env
```

**Required**:
```env
UEX_REFERRAL_CODE=5drfo01pgq88  # Get from: https://uex.us/referrals
```

**Optional** (for payment links):
```env
UEX_CLIENT_ID=your_client_id
UEX_SECRET_KEY=your_secret_key
```

### 3. Basic Usage

```typescript
import { uexService } from './services/UEXService';

// Get supported currencies
const currencies = await uexService.getCurrencies();
console.log(`Supported: ${currencies.length} cryptocurrencies`);

// Get exchange rate
const rate = await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
console.log(`1 BTC = ${rate} USDT`);

// Estimate conversion
const estimate = await uexService.estimateConversion(
  'BTC',    // from currency
  'BTC',    // from network
  'USDT',   // to currency
  'TRX',    // to network
  0.5       // amount
);
console.log(`0.5 BTC = ${estimate.receive_amount} USDT`);

// Initiate crypto swap
const swap = await uexService.initiateCryptoSwap(
  0.5,                                    // send amount
  'BTC',                                  // from currency
  'BTC',                                  // from network
  'USDT',                                 // to currency
  'TRX',                                  // to network
  'TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE', // user wallet
  null,                                   // receive tag (optional)
  { order_id: 'order-123' }              // metadata (optional)
);

console.log(`Order ID: ${swap.orderId}`);
console.log(`Deposit to: ${swap.deposit_address}`);
console.log(`Expected: ${swap.expected_amount} BTC`);
console.log(`Will receive: ${swap.receive_amount} USDT`);

// Check order status
const status = await uexService.getOrderStatus(swap.orderId);
console.log(`Status: ${status.external_status}`);
console.log(`Confirmations: ${status.confirmations}`);
```

---

## 📚 API Reference

### Currency Operations

#### `getCurrencies(): Promise<UEXCurrency[]>`
Get list of all supported cryptocurrencies.

**Returns**: Array of currency objects with code, name, network, limits, etc.

**Caching**: 1 hour TTL

**Example**:
```typescript
const currencies = await uexService.getCurrencies();
// Returns: [{ code: 'BTC', name: 'Bitcoin', network: 'BTC', ... }, ...]
```

#### `getCurrency(code: string): Promise<UEXCurrency | null>`
Get specific currency by code.

**Parameters**:
- `code` - Currency code (e.g., "BTC", "ETH", "USDT")

**Example**:
```typescript
const btc = await uexService.getCurrency('BTC');
if (btc) {
  console.log(`Min amount: ${btc.min_amount}, Max: ${btc.max_amount}`);
}
```

#### `isCurrencySupported(code: string): Promise<boolean>`
Check if currency is supported.

**Example**:
```typescript
const supported = await uexService.isCurrencySupported('DOGE');
// Returns: true or false
```

---

### Exchange Rate Operations

#### `estimateConversion(fromCurrency, fromNetwork, toCurrency, toNetwork, amount): Promise<EstimateData>`
Get detailed conversion estimate including fees.

**Parameters**:
- `fromCurrency` - Source currency code
- `fromNetwork` - Source blockchain network
- `toCurrency` - Target currency code
- `toNetwork` - Target blockchain network
- `amount` - Amount to convert

**Returns**: Estimate object with rate, fees, limits, and estimated time

**Caching**: 5 minutes TTL

**Example**:
```typescript
const estimate = await uexService.estimateConversion(
  'BTC', 'BTC', 'USDT', 'TRX', 1.0
);

console.log(`Rate: ${estimate.rate}`);
console.log(`You send: ${estimate.send_amount} BTC`);
console.log(`You receive: ${estimate.receive_amount} USDT`);
console.log(`Provider fee: ${estimate.provider_fee}`);
console.log(`Network fee: ${estimate.network_fee}`);
console.log(`Time: ${estimate.estimated_time}`);
```

#### `getExchangeRate(fromCurrency, fromNetwork, toCurrency, toNetwork): Promise<number>`
Get just the exchange rate (convenience method).

**Returns**: Number representing the exchange rate

**Example**:
```typescript
const rate = await uexService.getExchangeRate('ETH', 'ETH', 'BTC', 'BTC');
console.log(`1 ETH = ${rate} BTC`);
```

---

### Swap Operations

#### `initiateCryptoSwap(sendAmount, fromCurrency, fromNetwork, toCurrency, toNetwork, userWallet, receiveTag?, metadata?): Promise<SwapData>`
Create a new crypto-to-crypto swap order.

**Parameters**:
- `sendAmount` - Amount user will send
- `fromCurrency` - Currency user will send
- `fromNetwork` - Blockchain network for sending
- `toCurrency` - Currency user will receive
- `toNetwork` - Blockchain network for receiving
- `userWallet` - User's receiving wallet address
- `receiveTag` (optional) - Memo/tag for currencies that require it (XRP, XLM, etc.)
- `metadata` (optional) - Additional data to store with order

**Returns**: Swap data including orderId, deposit_address, and amounts

**Example**:
```typescript
const swap = await uexService.initiateCryptoSwap(
  100,      // send 100 USDT
  'USDT',
  'TRX',    // on Tron network
  'BTC',
  'BTC',    // receive BTC on Bitcoin network
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  // Bitcoin address
  null,     // no memo needed
  { customer_id: 'cust_123', order_id: 'ord_456' }
);

// Customer should send to:
console.log(`Deposit Address: ${swap.deposit_address}`);
console.log(`Network: ${swap.deposit_network}`);
console.log(`Amount: ${swap.expected_amount} USDT`);
console.log(`Order ID: ${swap.orderId}`); // Save this!
```

---

### Order Status Operations

#### `getOrderStatus(orderId: string): Promise<OrderStatusData>`
Get current status of a swap order.

**Parameters**:
- `orderId` - UEX order ID from swap initiation

**Returns**: Order status with detailed transaction information

**Caching**: 1 minute TTL

**Example**:
```typescript
const status = await uexService.getOrderStatus('xaAkVZUkI0pE');

console.log(`Status: ${status.external_status}`);
// Possible values:
// - "Awaiting Deposit" - Waiting for customer to send funds
// - "Confirming Deposit" - Transaction received, confirming
// - "Exchanging" - Converting currencies
// - "Sending" - Sending to recipient
// - "Complete" - Transaction completed
// - "Failed" - Transaction failed
// - "Refund" - Funds being refunded

if (status.transaction_hash) {
  console.log(`TX Hash: ${status.transaction_hash}`);
  console.log(`Confirmations: ${status.confirmations}`);
}

if (status.error_message) {
  console.error(`Error: ${status.error_message}`);
}
```

---

### Merchant API Operations

#### `getOAuth2Token(): Promise<string>`
Get OAuth2 access token for merchant API.

**Requires**: `UEX_CLIENT_ID` and `UEX_SECRET_KEY` in environment

**Returns**: Access token string

**Caching**: Cached until expiration

**Example**:
```typescript
const token = await uexService.getOAuth2Token();
// Token is automatically used by generatePaymentLink()
```

#### `generatePaymentLink(request: GeneratePaymentLinkRequest): Promise<PaymentLinkData>`
Generate a payment URL for merchant checkout.

**Requires**: Merchant API credentials

**Parameters**:
- `order` - Your order ID
- `item_name` - Product/service name
- `amount` - Amount in fiat currency (string)
- `currency` (optional) - Default: "USD"
- `success_url` - Where to redirect on success
- `failure_url` - Where to redirect on failure
- `cancel_url` (optional) - Where to redirect on cancel
- `webhook_url` (optional) - Webhook for status updates
- `metadata` (optional) - Additional data

**Returns**: Payment URL and payment details

**Example**:
```typescript
const paymentLink = await uexService.generatePaymentLink({
  order: 'order-123',
  item_name: 'NVIDIA RTX 4090 GPU',
  amount: '1599.99',
  currency: 'USD',
  success_url: 'https://yoursite.com/payment/success',
  failure_url: 'https://yoursite.com/payment/failed',
  webhook_url: 'https://yoursite.com/api/webhooks/uex'
});

// Redirect customer to:
console.log(paymentLink.payment_url);
// They can pay with any supported cryptocurrency
```

---

### Utility Methods

#### `checkHealth(): Promise<boolean>`
Check if UEX API is accessible.

**Example**:
```typescript
const healthy = await uexService.checkHealth();
if (!healthy) {
  console.error('UEX API is unavailable');
}
```

#### `clearCache(): void`
Clear all cached data.

**Example**:
```typescript
uexService.clearCache();
```

#### `getCacheStats(): any`
Get cache statistics.

**Example**:
```typescript
const stats = uexService.getCacheStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);
```

---

## 🔍 Status Mapping

UEX order statuses map to internal transaction statuses:

| UEX Status | Internal Status | Description |
|------------|-----------------|-------------|
| Awaiting Deposit | `pending` | Waiting for customer to send crypto |
| Confirming Deposit | `processing` | Received, waiting for confirmations |
| Exchanging | `processing` | Converting between currencies |
| Sending | `processing` | Sending to recipient wallet |
| Complete | `completed` | ✅ Transaction successful |
| Failed | `failed` | ❌ Transaction failed |
| Refund | `cancelled` | Funds being returned |
| Expired | `failed` | Order expired before payment |

---

## 💾 Caching Strategy

The service implements intelligent caching to reduce API calls:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Currencies | 1 hour | Rarely changes |
| Exchange Rates | 5 minutes | Balance between accuracy and performance |
| Order Status | 1 minute | Frequent updates during processing |
| OAuth2 Token | Until expiration - 60s | Avoid token requests |

**Cache Keys**:
- Currencies: `uex:currencies`
- Rates: `uex:rate:{from}:{to}`
- Orders: `uex:order:{orderId}`
- Token: `uex:oauth2:token`

**Manual Cache Control**:
```typescript
// Clear all cache
uexService.clearCache();

// Clear specific order status cache
cacheService.delete('uex:order:xaAkVZUkI0pE');

// Get cache statistics
const stats = uexService.getCacheStats();
```

---

## ⚠️ Error Handling

All methods throw `UEXAPIError` on failure:

```typescript
import { UEXAPIError } from './types/uex';

try {
  const swap = await uexService.initiateCryptoSwap(...);
} catch (error) {
  if (error instanceof UEXAPIError) {
    console.error(`UEX API Error [${error.code}]: ${error.message}`);
    console.error('Details:', error.details);

    // Handle specific errors
    if (error.code === 'MISSING_REFERRAL_CODE') {
      console.error('Please configure UEX_REFERRAL_CODE in .env');
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

**Common Error Codes**:
- `MISSING_REFERRAL_CODE` - Referral code not configured
- `MISSING_MERCHANT_CREDENTIALS` - Merchant API credentials not set
- `CURRENCY_FETCH_ERROR` - Failed to get currencies
- `ESTIMATE_ERROR` - Failed to estimate conversion
- `SWAP_INITIATE_ERROR` - Failed to initiate swap
- `ORDER_STATUS_ERROR` - Failed to get order status
- `HTTP_4xx` / `HTTP_5xx` - HTTP errors from UEX API
- `NO_RESPONSE` - Network error, no response from UEX
- `REQUEST_ERROR` - Error setting up request

---

## 🧪 Testing

### Manual Testing

```bash
# Test UEX API connection
curl http://localhost:3903/api/uex/currencies

# Test exchange rate
curl -X POST http://localhost:3903/api/uex/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "from_currency": "BTC",
    "from_network": "BTC",
    "to_currency": "USDT",
    "to_network": "TRX",
    "amount": 1.0
  }'
```

### Integration Test Script

Create `uex/test-uex-service.ts`:

```typescript
import { uexService } from './src/services/UEXService';

async function testUEXService() {
  console.log('🧪 Testing UEX Service...\n');

  // Test 1: Get Currencies
  console.log('1. Fetching currencies...');
  const currencies = await uexService.getCurrencies();
  console.log(`✅ Found ${currencies.length} currencies\n`);

  // Test 2: Check if BTC is supported
  console.log('2. Checking if BTC is supported...');
  const btcSupported = await uexService.isCurrencySupported('BTC');
  console.log(`✅ BTC supported: ${btcSupported}\n`);

  // Test 3: Get exchange rate
  console.log('3. Getting BTC to USDT exchange rate...');
  const rate = await uexService.getExchangeRate('BTC', 'BTC', 'USDT', 'TRX');
  console.log(`✅ 1 BTC = ${rate} USDT\n`);

  // Test 4: Estimate conversion
  console.log('4. Estimating 0.5 BTC to USDT...');
  const estimate = await uexService.estimateConversion(
    'BTC', 'BTC', 'USDT', 'TRX', 0.5
  );
  console.log(`✅ 0.5 BTC = ${estimate.receive_amount} USDT`);
  console.log(`   Provider fee: ${estimate.provider_fee}`);
  console.log(`   Time: ${estimate.estimated_time}\n`);

  // Test 5: Check health
  console.log('5. Checking UEX API health...');
  const healthy = await uexService.checkHealth();
  console.log(`✅ API healthy: ${healthy}\n`);

  console.log('🎉 All tests passed!');
}

testUEXService().catch(console.error);
```

Run tests:
```bash
npx ts-node test-uex-service.ts
```

---

## 📝 Next Steps

Now that UEXService is implemented, you can:

1. **Enhance ExchangeRateService** - Integrate UEXService for real-time rates
2. **Update PaymentProcessingService** - Add crypto payment support
3. **Create Webhook Handler** - Receive status updates from UEX
4. **Implement Polling Service** - Auto-update order statuses
5. **Add Database Fields** - Store UEX order data
6. **Create API Routes** - Expose UEX operations via REST API
7. **Build Frontend UI** - Crypto payment interface

See `UEX_INTEGRATION_PLAN.md` for the complete roadmap!

---

## 🔗 References

- **UEX API Docs**: https://uex-us.stoplight.io/docs/uex
- **UEX Dashboard**: https://uex.us/
- **Get Referral Code**: https://uex.us/referrals
- **Specification**: `./Specifications/UEX_Integration_Guide/`
- **Implementation Plan**: `./UEX_INTEGRATION_PLAN.md`

---

**Status**: ✅ **Phase 1 Complete** - UEXService is ready for integration!

Next: Phase 2 - Enhance ExchangeRateService & PaymentProcessingService 🚀
