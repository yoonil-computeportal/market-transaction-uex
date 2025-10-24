# UEX API Integration Guide - Part 4 (Final)

## Step 15: Security Best Practices

### API Key Management

```typescript
// utils/security.ts

import crypto from 'crypto';

export class SecurityUtils {
  /**
   * Validate webhook signature (if UEX provides signature)
   */
  static validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  /**
   * Generate secure transaction ID
   */
  static generateTransactionId(): string {
    return `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: any): any {
    const masked = { ...data };
    const sensitiveFields = ['secret_key', 'password', 'api_key', 'token'];
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***REDACTED***';
      }
    }
    
    return masked;
  }
}
```

### Rate Limiting

```typescript
// middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for payment processing
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 payment requests per minute
  message: 'Too many payment requests, please try again later.'
});

// Webhook rate limiter
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Allow up to 60 webhooks per minute
  message: 'Webhook rate limit exceeded'
});
```

Apply in routes:

```typescript
// routes/paymentRoutes.ts (Enhanced)

import { apiLimiter, paymentLimiter } from '../middleware/rateLimiter';

// Apply rate limiting
router.use(apiLimiter);
router.post('/process', paymentLimiter, (req, res) => 
  paymentController.processPayment(req, res)
);
```

---

## Step 16: Deployment Checklist

### Pre-Deployment Steps

1. **Environment Variables**
   ```bash
   # Verify all required variables are set
   - UEX_REFERRAL_CODE (Required)
   - UEX_SWAP_BASE_URL
   - UEX_MERCHANT_BASE_URL
   - DATABASE_URL
   - WEBHOOK_BASE_URL (if using webhooks)
   ```

2. **Database Migrations**
   ```bash
   # Run all migrations
   npm run migrate
   
   # Verify tables exist
   - payment_transactions (with UEX fields)
   - currency_conversions
   - exchange_rates
   - management_tier_fees
   ```

3. **KYC Verification**
   - Complete KYC at https://uex.us/profile/personal-id
   - Verify referral code is active
   - Test with small amounts first

4. **API Testing**
   ```bash
   # Test UEX connectivity
   curl http://your-api/api/uex/health/detailed
   
   # Test currency listing
   curl http://your-api/api/uex/currencies
   
   # Test estimation
   curl -X POST http://your-api/api/uex/estimate \
     -H "Content-Type: application/json" \
     -d '{"from_currency":"BTC","to_currency":"USDT","amount":0.001}'
   ```

5. **Security Review**
   - [ ] Rate limiting enabled
   - [ ] Input sanitization implemented
   - [ ] Webhook signatures validated (if applicable)
   - [ ] Sensitive data masked in logs
   - [ ] HTTPS enabled for production

---

## Step 17: Complete API Reference

### Your System Endpoints

#### POST `/api/payments/process`
**Process a new payment**

Request:
```json
{
  "client_id": "string",
  "seller_id": "string",
  "amount": number,
  "currency": "string",
  "target_currency": "string",
  "payment_method": "fiat" | "crypto",
  "settlement_method": "bank" | "blockchain",
  "metadata": {
    "recipient_wallet": "string (optional)",
    "order_id": "string (optional)",
    "item_name": "string (optional)"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transaction_id": "string",
    "status": "pending" | "processing",
    "amount": number,
    "currency": "string",
    "target_currency": "string",
    "conversion_rate": number,
    "fees": {
      "uex_buyer_fee": number,
      "uex_seller_fee": number,
      "conversion_fee": number,
      "management_fee": number,
      "total_fee": number
    },
    "total_amount": number,
    "estimated_settlement_time": "ISO 8601 string",
    "created_at": "ISO 8601 string",
    "uex_data": {
      "order_id": "string",
      "deposit_address": "string",
      "deposit_tag": "string | null",
      "qr_code": "string"
    }
  }
}
```

#### GET `/api/payments/transaction/:id/status`
**Get transaction status**

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "pending" | "processing" | "completed" | "failed" | "cancelled",
    "amount": number,
    "currency": "string",
    "target_currency": "string",
    "uex_order_id": "string",
    "created_at": "ISO 8601 string",
    "completed_at": "ISO 8601 string | null"
  }
}
```

#### GET `/api/uex/currencies`
**Get supported currencies from UEX**

Response:
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "id": number,
        "name": "string",
        "code": "string",
        "icon": "string",
        "network": [
          {
            "id": number,
            "name": "string",
            "network": "string",
            "has_tag": 0 | 1,
            "default": 0 | 1
          }
        ]
      }
    ],
    "cardano_tokens": [...]
  }
}
```

#### POST `/api/uex/estimate`
**Estimate conversion rate**

Request:
```json
{
  "from_currency": "string",
  "to_currency": "string",
  "amount": number
}
```

Response:
```json
{
  "success": true,
  "data": {
    "rate": "string",
    "convert": "string",
    "data": {
      "provider": "string",
      "min": "string",
      "max": "string",
      "fee": "string"
    }
  }
}
```

#### GET `/api/uex/poll/:transaction_id`
**Poll UEX order status**

Response:
```json
{
  "success": true,
  "data": {
    "transaction_id": "string",
    "uex_order_id": "string",
    "current_status": "string",
    "uex_status": "string",
    "order_details": {
      "orderId": "string",
      "depositAddress": "string",
      "baseCurrencyAmount": "string",
      "quoteCurrencyAmount": "string"
    }
  }
}
```

#### POST `/api/uex/webhook/order-status`
**Webhook for UEX status updates**

Request:
```json
{
  "order_id": "string",
  "status": "string",
  "transaction_hash": "string (optional)"
}
```

Response:
```json
{
  "success": true,
  "message": "Status updated successfully",
  "transaction_id": "string",
  "new_status": "string"
}
```

---

## Step 18: Common Integration Patterns

### Pattern 1: Crypto-to-Fiat Payment Flow

```typescript
// Example: Customer pays in BTC, seller receives USD

async function processCryptoToFiatPayment(
  clientId: string,
  sellerId: string,
  amountBTC: number
): Promise<PaymentResponse> {
  
  const paymentRequest: PaymentRequest = {
    client_id: clientId,
    seller_id: sellerId,
    amount: amountBTC,
    currency: 'BTC',
    target_currency: 'USD',
    payment_method: 'crypto',
    settlement_method: 'bank', // Seller receives via bank
    metadata: {
      order_id: `order-${Date.now()}`,
      item_name: 'Product Purchase'
    }
  };

  // This will:
  // 1. Get BTC/USD rate from UEX
  // 2. Calculate fees
  // 3. Initiate UEX swap
  // 4. Return deposit address for customer
  const response = await paymentService.processPayment(paymentRequest);

  // Customer needs to send BTC to: response.uex_data.deposit_address
  // System will monitor status and notify when complete

  return response;
}
```

### Pattern 2: Fiat-to-Crypto Payment Flow

```typescript
// Example: Customer pays in USD, seller receives BTC

async function processFiatToCryptoPayment(
  clientId: string,
  sellerId: string,
  amountUSD: number,
  sellerBTCWallet: string
): Promise<PaymentResponse> {
  
  const paymentRequest: PaymentRequest = {
    client_id: clientId,
    seller_id: sellerId,
    amount: amountUSD,
    currency: 'USD',
    target_currency: 'BTC',
    payment_method: 'fiat',
    settlement_method: 'blockchain', // Seller receives BTC on-chain
    metadata: {
      recipient_wallet: sellerBTCWallet,
      order_id: `order-${Date.now()}`
    }
  };

  const response = await paymentService.processPayment(paymentRequest);

  // Customer pays USD via bank transfer
  // UEX converts to BTC and sends to seller's wallet

  return response;
}
```

### Pattern 3: Crypto-to-Crypto Swap

```typescript
// Example: Customer swaps BTC for USDT

async function processCryptoSwap(
  clientId: string,
  amountBTC: number,
  recipientUSDTWallet: string
): Promise<PaymentResponse> {
  
  const paymentRequest: PaymentRequest = {
    client_id: clientId,
    seller_id: clientId, // Same as client for swaps
    amount: amountBTC,
    currency: 'BTC',
    target_currency: 'USDT',
    payment_method: 'crypto',
    settlement_method: 'blockchain',
    metadata: {
      recipient_wallet: recipientUSDTWallet
    }
  };

  const response = await paymentService.processPayment(paymentRequest);

  // Customer sends BTC to deposit address
  // Receives USDT to their wallet

  return response;
}
```

---

## Step 19: Troubleshooting Guide

### Issue 1: Invalid Referral Code Error

**Error:**
```json
{
  "success": false,
  "message": "Referral code is wrong or empty. Your api is blocked"
}
```

**Solutions:**
1. Verify referral code at https://uex.us/referrals
2. Complete KYC verification at https://uex.us/profile/personal-id
3. Ensure code is correctly set in `.env`: `UEX_REFERRAL_CODE=your_code`
4. Wait for KYC approval (usually 24-48 hours)

### Issue 2: Currency Pair Not Supported

**Error:**
```
Currency conversion not supported: XXX to YYY
```

**Solutions:**
1. Check supported currencies: `GET /api/uex/currencies`
2. Verify both currencies are in the list
3. Use correct currency codes (e.g., 'BTC' not 'Bitcoin')
4. Check if specific network is available for the currency

### Issue 3: Exchange Rate Not Available

**Error:**
```
Exchange rate not available for BTC to XYZ
```

**Solutions:**
1. Use estimation endpoint first: `POST /api/uex/estimate`
2. Check if currency pair is valid
3. Ensure UEX API is accessible
4. Fall back to mock rates if needed (development only)

### Issue 4: Webhook Not Receiving Updates

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check firewall/security group settings
3. Use polling as alternative: `GET /api/uex/poll/:transaction_id`
4. Enable polling service: `UEX_POLLING_ENABLED=true`
5. Check webhook logs on UEX dashboard (if available)

### Issue 5: Transaction Stuck in "Processing"

**Solutions:**
1. Manually poll status: `GET /api/uex/poll/:transaction_id`
2. Check UEX order status directly: `POST /api/partners/order-show`
3. Verify customer sent funds to deposit address
4. Check blockchain confirmations
5. Contact UEX support if issue persists

---

## Step 20: Performance Optimization

### Caching Strategy

```typescript
// services/CacheService.ts

import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60 // Check for expired keys every 60 seconds
    });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }

  /**
   * Delete cached value
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}
```

Apply caching to UEXService:

```typescript
// Update UEXService.ts

import { CacheService } from './CacheService';

export class UEXService {
  private cacheService: CacheService;

  constructor(config: UEXConfig, cacheService?: CacheService) {
    this.config = config;
    this.cacheService = cacheService || new CacheService();
    // ... rest of constructor
  }

  async getSupportedCurrencies() {
    const cacheKey = 'uex_currencies';
    const cached = this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.swapClient.get('/api/partners/get-currencies');
    const data = response.data.data;
    
    // Cache for 1 hour
    this.cacheService.set(cacheKey, data, 3600);
    
    return data;
  }

  async estimateConversion(...params) {
    const cacheKey = `estimate_${params.join('_')}`;
    const cached = this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.swapClient.post('/api/partners/estimate', {
      // ... params
    });

    // Cache for 1 minute (rates change frequently)
    this.cacheService.set(cacheKey, response.data, 60);
    
    return response.data;
  }
}
```

### Database Connection Pooling

```typescript
// Update database.ts

import knex from 'knex';

export const db = knex({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  },
  acquireConnectionTimeout: 10000
});
```

---

## Step 21: Production Deployment

### Docker Configuration

```dockerfile
# Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - UEX_REFERRAL_CODE=${UEX_REFERRAL_CODE}
      - UEX_SWAP_BASE_URL=https://uexswap.com
      - UEX_MERCHANT_BASE_URL=https://uex.us
      - UEX_POLLING_ENABLED=true
      - UEX_POLLING_INTERVAL=300000
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=payment_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Kubernetes Deployment (Optional)

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: uex-payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: uex-payment-service
  template:
    metadata:
      labels:
        app: uex-payment-service
    spec:
      containers:
      - name: app
        image: your-registry/uex-payment-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: UEX_REFERRAL_CODE
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: uex-referral-code
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Summary: Integration Mapping

### UEX API → Your System Mapping

| Your System Component | UEX API Endpoint | Purpose |
|----------------------|------------------|---------|
| `ExchangeRateService.getExchangeRate()` | `POST /api/partners/estimate` | Get real-time exchange rates |
| `PaymentProcessingService.processPayment()` (crypto) | `POST /api/partners/swap/initiate-crypto-to-crypto` | Initiate crypto swaps |
| `PaymentProcessingService.getTransactionStatus()` | `POST /api/partners/order-show` | Check order status |
| `UEXWebhookController.handleOrderStatusUpdate()` | Webhook receiver | Receive status updates |
| `ExchangeRateService.getSupportedCurrencies()` | `GET /api/partners/get-currencies` | List available currencies |
| Merchant payment links | `POST /api/merchant/oauth2/token` + `POST /api/merchant/generate-payment-url` | Generate payment URLs |

### Status Mapping

| UEX Status | Your System Status |
|------------|-------------------|
| Awaiting Deposit | `pending` |
| Confirming Deposit | `processing` |
| Exchanging | `processing` |
| Sending | `processing` |
| Complete | `completed` |
| Failed | `failed` |
| Refund | `cancelled` |

---

## Next Steps

1. **Set up UEX account**
   - Register at https://uex.us/
   - Complete KYC verification
   - Generate referral code

2. **Test integration**
   - Start with small test amounts
   - Verify end-to-end flow
   - Monitor transaction statuses

3. **Go live**
   - Enable production mode
   - Monitor metrics and logs
   - Set up alerts for failures

4. **Optimize**
   - Fine-tune polling intervals
   - Implement caching strategies
   - Scale based on volume

---

## Support Resources

- **UEX API Documentation**: https://uex-us.stoplight.io/docs/uex
- **Your System Health Check**: `GET /api/uex/health/detailed`
- **Monitoring Dashboard**: `GET /api/uex/monitoring/stats`
- **UEX Support**: support@uex.us

---

**Congratulations! Your payment system is now fully integrated with UEX APIs.**
