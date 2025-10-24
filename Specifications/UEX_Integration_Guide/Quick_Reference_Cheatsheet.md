# UEX Integration - Quick Reference Cheatsheet

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install axios uuid node-cache express-rate-limit

# 2. Set environment variables
export UEX_REFERRAL_CODE="your_code_here"
export UEX_SWAP_BASE_URL="https://uexswap.com"
export DATABASE_URL="postgresql://..."

# 3. Run migrations
npm run migrate

# 4. Start server
npm start

# 5. Test connection
curl http://localhost:3000/api/uex/currencies
```

---

## 🔑 Essential Environment Variables

```env
# REQUIRED
UEX_REFERRAL_CODE=5drfo01pgq88
UEX_SWAP_BASE_URL=https://uexswap.com
UEX_MERCHANT_BASE_URL=https://uex.us
DATABASE_URL=postgresql://user:pass@host:5432/db

# OPTIONAL
UEX_CLIENT_ID=merchant_client_id
UEX_SECRET_KEY=merchant_secret_key
UEX_POLLING_ENABLED=true
UEX_POLLING_INTERVAL=300000
```

---

## 📡 API Endpoints Quick Reference

### UEX Integration Endpoints

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/api/uex/currencies` | GET | List currencies | `curl http://localhost:3000/api/uex/currencies` |
| `/api/uex/estimate` | POST | Get exchange rate | `curl -X POST -d '{"from_currency":"BTC","to_currency":"USDT","amount":1}'` |
| `/api/uex/poll/:txn_id` | GET | Poll order status | `curl http://localhost:3000/api/uex/poll/txn-123` |
| `/api/uex/webhook/order-status` | POST | Receive webhooks | UEX calls this |
| `/api/uex/payment-link` | POST | Generate payment URL | Merchant API |
| `/api/uex/health/detailed` | GET | Health check | `curl http://localhost:3000/api/uex/health/detailed` |

### Payment Processing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/process` | POST | Process payment |
| `/api/payments/transaction/:id/status` | GET | Get status |
| `/api/payments/transactions` | GET | List all |

---

## 💻 Code Snippets

### Initialize UEX Service

```typescript
import { UEXService } from './services/UEXService';

const uexService = new UEXService({
  swapBaseUrl: process.env.UEX_SWAP_BASE_URL || 'https://uexswap.com',
  merchantBaseUrl: process.env.UEX_MERCHANT_BASE_URL || 'https://uex.us',
  referralCode: process.env.UEX_REFERRAL_CODE || '',
  clientId: process.env.UEX_CLIENT_ID,
  secretKey: process.env.UEX_SECRET_KEY
});
```

### Process Crypto Payment

```typescript
const paymentRequest = {
  client_id: "client-001",
  seller_id: "seller-001",
  amount: 0.5,
  currency: "BTC",
  target_currency: "USDT",
  payment_method: "crypto",
  settlement_method: "blockchain"
};

const response = await paymentService.processPayment(paymentRequest);
console.log("Deposit address:", response.uex_data.deposit_address);
```

### Get Exchange Rate

```typescript
const rate = await uexService.estimateConversion(
  "BTC",      // from currency
  "BTC",      // from network
  "USDT",     // to currency
  "TRX",      // to network
  1.0         // amount
);
console.log("Rate:", rate.rate);
```

### Poll Order Status

```typescript
const status = await uexService.getOrderStatus("xaAkVZUkI0pE");
console.log("Status:", status.data.external_status);
```

---

## 🔄 UEX API Calls

### Get Supported Currencies

```bash
curl -X GET https://uexswap.com/api/partners/get-currencies \
  -H "Accept: application/json"
```

### Estimate Conversion

```bash
curl -X POST https://uexswap.com/api/partners/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "send": "BTC",
    "network": "BTC",
    "receive": "USDT",
    "receive_network": "TRX",
    "amount": 0.1
  }'
```

### Initiate Crypto Swap

```bash
curl -X POST https://uexswap.com/api/partners/swap/initiate-crypto-to-crypto \
  -H "Content-Type: application/json" \
  -d '{
    "send_amount": 0.1,
    "from_currency": "BTC",
    "base_currency_chain_id": "BTC",
    "to_currency": "USDT",
    "quote_currency_chain_id": "TRX",
    "userWallet": "TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE",
    "receive_tag": null,
    "extend": {
      "ref_code": "5drfo01pgq88"
    }
  }'
```

### Check Order Status

```bash
curl -X POST https://uexswap.com/api/partners/order-show \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "xaAkVZUkI0pE"
  }'
```

### Get OAuth2 Token (Merchant API)

```bash
curl -X POST https://uex.us/api/merchant/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your_client_id",
    "secret_key": "your_secret_key"
  }'
```

### Generate Payment Link

```bash
curl -X POST https://uex.us/api/merchant/generate-payment-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "order": "order-123",
    "item_name": "Product Name",
    "amount": "100",
    "success_url": "https://yoursite.com/success",
    "failure_url": "https://yoursite.com/failed"
  }'
```

---

## 🗄️ Database Queries

### Get Pending UEX Orders

```sql
SELECT * FROM payment_transactions
WHERE uex_order_id IS NOT NULL
  AND status IN ('pending', 'processing')
ORDER BY created_at DESC;
```

### Get Transaction by UEX Order ID

```sql
SELECT * FROM payment_transactions
WHERE uex_order_id = 'xaAkVZUkI0pE';
```

### Get Completed Transactions Today

```sql
SELECT * FROM payment_transactions
WHERE status = 'completed'
  AND completed_at >= CURRENT_DATE
ORDER BY completed_at DESC;
```

### Get Average Completion Time

```sql
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as avg_minutes
FROM payment_transactions
WHERE completed_at IS NOT NULL;
```

---

## 🐛 Troubleshooting Commands

### Test UEX Connection

```bash
curl -X GET http://localhost:3000/api/uex/health/detailed
```

### Check System Stats

```bash
curl -X GET http://localhost:3000/api/uex/monitoring/stats
```

### Test Webhook

```bash
curl -X POST http://localhost:3000/api/uex/webhook/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-123",
    "status": "Complete",
    "transaction_hash": "0xabc123..."
  }'
```

### Check Logs

```bash
# Docker
docker logs -f uex-payment-service

# PM2
pm2 logs

# Direct
tail -f logs/app.log
```

---

## 📊 Status Mappings

| UEX Status | Your System | Description |
|------------|-------------|-------------|
| `Awaiting Deposit` | `pending` | Waiting for customer deposit |
| `Confirming Deposit` | `processing` | Blockchain confirmations |
| `Exchanging` | `processing` | Swap in progress |
| `Sending` | `processing` | Sending to recipient |
| `Complete` | `completed` | ✅ Success |
| `Failed` | `failed` | ❌ Error occurred |
| `Refund` | `cancelled` | Funds returned |

---

## ⚡ Common Operations

### Start Polling Service

```typescript
// In index.ts
const pollingService = new UEXPollingService(dbService, uexService, paymentService);
pollingService.startPolling(300000); // 5 minutes
```

### Manual Poll Single Transaction

```typescript
await pollingService.pollTransaction("txn-abc123");
```

### Update Transaction Status

```typescript
await paymentService.updateTransactionStatus(
  "txn-abc123",
  "completed",
  { transaction_hash: "0xabc..." }
);
```

### Get Transaction with UEX Data

```typescript
const transaction = await dbService.getPaymentTransaction("txn-abc123");
console.log("UEX Order:", transaction.uex_order_id);
console.log("Deposit Address:", transaction.deposit_address);
```

---

## 🔐 Security Checklist

- [ ] ✅ HTTPS enabled in production
- [ ] ✅ Rate limiting configured
- [ ] ✅ Input sanitization implemented
- [ ] ✅ Environment variables secured
- [ ] ✅ Sensitive data masked in logs
- [ ] ✅ Database connections encrypted
- [ ] ✅ Webhook signatures validated (if available)
- [ ] ✅ API keys rotated regularly
- [ ] ✅ Error messages don't expose internals
- [ ] ✅ CORS properly configured

---

## 📈 Performance Tips

1. **Enable Caching**
   ```typescript
   const cacheService = new CacheService();
   // Cache currencies for 1 hour
   // Cache rates for 1 minute
   ```

2. **Database Connection Pooling**
   ```typescript
   pool: { min: 2, max: 10 }
   ```

3. **Use Polling Instead of Frequent API Calls**
   ```env
   UEX_POLLING_INTERVAL=300000  # 5 minutes
   ```

4. **Implement Request Retries**
   ```typescript
   const retries = 3;
   const backoff = 1000; // 1 second
   ```

---

## 🎯 Testing Checklist

- [ ] ✅ Get currencies from UEX
- [ ] ✅ Estimate exchange rate
- [ ] ✅ Process test payment (small amount)
- [ ] ✅ Check deposit address generated
- [ ] ✅ Poll order status manually
- [ ] ✅ Test webhook receiver
- [ ] ✅ Verify status updates in DB
- [ ] ✅ Confirm seller notification sent
- [ ] ✅ Test error handling (invalid inputs)
- [ ] ✅ Load test with 100+ concurrent requests
- [ ] ✅ Monitor memory and CPU usage
- [ ] ✅ Test graceful shutdown

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| UEX API Docs | https://uex-us.stoplight.io/docs/uex |
| UEX Dashboard | https://uex.us/ |
| KYC Verification | https://uex.us/profile/personal-id |
| Referral Program | https://uex.us/referrals |
| Support Email | support@uex.us |

---

## 🆘 Emergency Commands

### Stop Polling Service

```typescript
pollingService.stopPolling();
```

### Clear Cache

```typescript
cacheService.flush();
```

### Database Rollback

```bash
npm run migrate:rollback
```

### Force Update All Pending Orders

```bash
curl -X POST http://localhost:3000/api/uex/force-update-all
```

---

## 📝 Configuration Templates

### .env Template

```env
# Copy this to .env and fill in your values
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/payment_db
UEX_SWAP_BASE_URL=https://uexswap.com
UEX_MERCHANT_BASE_URL=https://uex.us
UEX_REFERRAL_CODE=
UEX_CLIENT_ID=
UEX_SECRET_KEY=
UEX_POLLING_ENABLED=true
UEX_POLLING_INTERVAL=300000
WEBHOOK_BASE_URL=
LOG_LEVEL=info
```

### docker-compose.yml Template

```yaml
version: '3.8'
services:
  app:
    image: your-app:latest
    ports:
      - "3000:3000"
    environment:
      - UEX_REFERRAL_CODE=${UEX_REFERRAL_CODE}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=payment_db
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

---

## 🎓 Key Concepts

### Referral Code
- Get from: https://uex.us/referrals
- Required for all swap operations
- Format: alphanumeric string (e.g., `5drfo01pgq88`)
- Earns you: 0.19% commission + 0.5 ADA per Cardano swap

### Exchange Rate
- Fetched from UEX in real-time
- Cached for 1-5 minutes
- Includes provider fees
- Auto-updated via polling/webhooks

### Order ID
- Generated by UEX on swap initiation
- Format: alphanumeric (e.g., `xaAkVZUkI0pE`)
- Used to track order status
- Stored in your database as `uex_order_id`

### Deposit Address
- Generated by UEX for each order
- Customer sends crypto here
- One-time use address
- Monitored by UEX for incoming transactions

---

**Print this cheatsheet for quick reference during development and troubleshooting!**
