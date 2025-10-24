# UEX API Integration - Complete Guide Summary

## 📋 Overview

This integration guide explains how to connect the **UEX cryptocurrency exchange and payment APIs** with your existing **multi-currency payment processing system**.

---

## 🎯 What This Integration Achieves

✅ **Real-time cryptocurrency exchange rates** from UEX  
✅ **Automated crypto-to-crypto swaps** via UEX  
✅ **Crypto-to-fiat and fiat-to-crypto conversions**  
✅ **Payment link generation** for merchant checkouts  
✅ **Automated order status tracking** via webhooks or polling  
✅ **Multi-currency support** (BTC, ETH, USDT, ADA, etc.)  
✅ **Fee calculation** with transparent breakdown  
✅ **Seller payout management** with automated notifications  

---

## 📁 Document Structure

### **Part 1: Core Integration**
- UEXService implementation
- ExchangeRateService enhancement
- PaymentProcessingService updates
- Database schema changes

### **Part 2: Webhooks & Routes**
- Webhook handler for status updates
- UEX-specific API routes
- Payment link generation
- Application setup

### **Part 3: Monitoring & Polling**
- Automated polling service
- Error handling
- Logging and monitoring
- Health checks

### **Part 4: Production Deployment**
- Security best practices
- Performance optimization
- Docker & Kubernetes configs
- Troubleshooting guide

---

## 🚀 Quick Start Guide

### Prerequisites

1. **UEX Account Setup**
   ```
   1. Register at https://uex.us/
   2. Complete KYC verification at https://uex.us/profile/personal-id
   3. Generate referral code at https://uex.us/referrals
   4. (Optional) Get merchant credentials for payment links
   ```

2. **Environment Configuration**
   ```bash
   # Required
   UEX_REFERRAL_CODE=your_referral_code
   UEX_SWAP_BASE_URL=https://uexswap.com
   UEX_MERCHANT_BASE_URL=https://uex.us
   DATABASE_URL=postgresql://...
   
   # Optional
   UEX_CLIENT_ID=your_client_id
   UEX_SECRET_KEY=your_secret_key
   UEX_POLLING_ENABLED=true
   UEX_POLLING_INTERVAL=300000
   ```

3. **Install Dependencies**
   ```bash
   npm install axios uuid node-cache express-rate-limit
   ```

---

## 🔧 Key Components

### 1. UEXService
**Purpose**: Interface with UEX APIs  
**Location**: `services/UEXService.ts`  
**Methods**:
- `getSupportedCurrencies()` - Get available currencies
- `estimateConversion()` - Get exchange rates
- `initiateCryptoToCryptoSwap()` - Start swap orders
- `initiateCardanoToCardanoSwap()` - Cardano swaps
- `getOrderStatus()` - Check order progress
- `generatePaymentLink()` - Create payment URLs

### 2. Enhanced ExchangeRateService
**Purpose**: Fetch live rates from UEX  
**Location**: `services/ExchangeRateService.ts`  
**Integration**: Falls back to UEX if database cache expired

### 3. Enhanced PaymentProcessingService
**Purpose**: Process payments with UEX integration  
**Location**: `services/PaymentProcessingService.ts`  
**Features**:
- Detects crypto payments automatically
- Initiates UEX swaps for crypto transactions
- Returns deposit addresses to customers
- Calculates fees with UEX rates

### 4. UEXWebhookController
**Purpose**: Handle real-time status updates  
**Location**: `controllers/UEXWebhookController.ts`  
**Endpoints**:
- `POST /api/uex/webhook/order-status` - Receive updates
- `GET /api/uex/poll/:transaction_id` - Manual polling

### 5. UEXPollingService
**Purpose**: Background status synchronization  
**Location**: `services/UEXPollingService.ts`  
**Features**:
- Automatic polling every 5 minutes
- Updates pending transactions
- Graceful shutdown support

---

## 🔄 Payment Flow Examples

### Example 1: Crypto Payment (BTC → USDT)

```typescript
// Customer Request
POST /api/payments/process
{
  "client_id": "client-001",
  "seller_id": "seller-001",
  "amount": 0.5,
  "currency": "BTC",
  "target_currency": "USDT",
  "payment_method": "crypto",
  "settlement_method": "blockchain"
}

// System Response
{
  "transaction_id": "txn-abc123",
  "status": "processing",
  "uex_data": {
    "order_id": "xaAkVZUkI0pE",
    "deposit_address": "1FkccfHWhUwdwUAtY7AVEypnM53K17H51t",
    "qr_code": "https://quickchart.io/qr?..."
  }
}

// Flow:
// 1. Customer sends 0.5 BTC to deposit address
// 2. UEX receives and confirms
// 3. UEX swaps BTC → USDT at current rate
// 4. UEX sends USDT to seller's wallet
// 5. Webhook/polling updates transaction to "completed"
// 6. Seller receives payout notification
```

### Example 2: Get Exchange Rate

```typescript
POST /api/uex/estimate
{
  "from_currency": "BTC",
  "to_currency": "USDT",
  "amount": 1.0
}

// Response
{
  "rate": "40000.00",
  "convert": "40000.00",
  "data": {
    "min": "0.001",
    "max": "10",
    "fee": "0.0001"
  }
}
```

---

## 📊 API Endpoints Summary

### Your Payment System
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/process` | POST | Process payment (with UEX for crypto) |
| `/api/payments/transaction/:id/status` | GET | Get transaction status |
| `/api/payments/transactions` | GET | List all transactions |

### UEX Integration Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/uex/currencies` | GET | Get supported currencies |
| `/api/uex/estimate` | POST | Estimate conversion rate |
| `/api/uex/poll/:transaction_id` | GET | Poll order status |
| `/api/uex/webhook/order-status` | POST | Receive status updates |
| `/api/uex/payment-link` | POST | Generate payment URL |
| `/api/uex/health/detailed` | GET | Health check |
| `/api/uex/monitoring/stats` | GET | System statistics |

---

## 🗄️ Database Changes

### New Fields in `payment_transactions`

```sql
ALTER TABLE payment_transactions ADD COLUMN uex_order_id VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN deposit_address VARCHAR(255);
ALTER TABLE payment_transactions ADD COLUMN deposit_tag VARCHAR(100);
ALTER TABLE payment_transactions ADD COLUMN qr_code_url VARCHAR(500);
CREATE INDEX idx_uex_order_id ON payment_transactions(uex_order_id);
```

---

## 🔐 Security Features

✅ Rate limiting (100 requests/15min general, 10/min for payments)  
✅ Input sanitization  
✅ Webhook signature validation  
✅ Sensitive data masking in logs  
✅ HTTPS enforcement in production  
✅ Environment variable security  

---

## 📈 Monitoring & Observability

### Health Check
```bash
GET /api/uex/health/detailed

# Returns
{
  "status": "healthy",
  "dependencies": {
    "database": "healthy",
    "uex_api": "healthy"
  }
}
```

### Statistics
```bash
GET /api/uex/monitoring/stats

# Returns
{
  "total_transactions": 1250,
  "pending_uex_orders": 15,
  "completed_today": 45,
  "failed_today": 2,
  "average_completion_time": 1800,
  "total_volume_24h": 50000
}
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Invalid referral code | Complete KYC + verify code at https://uex.us/referrals |
| Currency not supported | Check `/api/uex/currencies` for available pairs |
| Webhook not working | Enable polling with `UEX_POLLING_ENABLED=true` |
| Transaction stuck | Manual poll: `GET /api/uex/poll/:transaction_id` |
| Rate limit exceeded | Implement exponential backoff, increase interval |

---

## 🚢 Deployment Options

### Option 1: Docker
```bash
docker-compose up -d
```

### Option 2: Kubernetes
```bash
kubectl apply -f k8s/
```

### Option 3: Traditional Node
```bash
npm run build
npm start
```

---

## 📝 Testing Checklist

- [ ] Test UEX API connectivity: `GET /api/uex/currencies`
- [ ] Test exchange rate estimation: `POST /api/uex/estimate`
- [ ] Process test crypto payment (small amount)
- [ ] Verify webhook/polling updates status
- [ ] Check transaction appears in dashboard
- [ ] Confirm seller receives notification
- [ ] Test payment link generation (if using merchant API)
- [ ] Verify error handling (invalid inputs)
- [ ] Load test with concurrent requests
- [ ] Test graceful shutdown (polling stops)

---

## 📚 Additional Resources

### UEX Documentation
- API Docs: https://uex-us.stoplight.io/docs/uex
- Account Setup: https://uex.us/
- KYC Verification: https://uex.us/profile/personal-id
- Referral Program: https://uex.us/referrals

### Your System
- Health Check: `http://localhost:3000/health`
- API Docs: `http://localhost:3000/`
- Monitoring: `http://localhost:3000/api/uex/monitoring/stats`

---

## 🎓 Integration Benefits

### For Your Business
✅ **Expand payment options** - Accept 50+ cryptocurrencies  
✅ **Reduce transaction fees** - Lower than traditional processors  
✅ **Faster settlements** - 10-30 minutes vs 1-3 days  
✅ **Global reach** - No geographic restrictions  
✅ **Referral rewards** - 0.19% commission + 0.5 ADA per Cardano swap  

### For Your Customers
✅ **Pay with crypto** - Use their preferred cryptocurrency  
✅ **Better rates** - Real-time market prices from UEX  
✅ **Transparent fees** - Clear breakdown of all charges  
✅ **Fast processing** - Near-instant blockchain settlements  

---

## 📞 Support Contacts

- **UEX Support**: support@uex.us
- **Technical Issues**: Check logs in `/api/uex/monitoring/stats`
- **API Status**: Monitor `/api/uex/health/detailed`

---

## 🎉 Success Criteria

Your integration is complete when:

✅ All test transactions process successfully  
✅ Status updates are received (webhook or polling)  
✅ Exchange rates match UEX estimates  
✅ Sellers receive payout notifications  
✅ Monitoring dashboard shows healthy status  
✅ Error handling works correctly  
✅ KYC is approved and referral rewards accumulate  

---

## 📦 File Structure

```
your-project/
├── services/
│   ├── UEXService.ts                    # UEX API client
│   ├── ExchangeRateService.ts          # Enhanced with UEX
│   ├── PaymentProcessingService.ts     # Enhanced with UEX
│   ├── UEXPollingService.ts            # Background polling
│   ├── DatabaseService.ts               # Enhanced DB methods
│   ├── CacheService.ts                  # Performance caching
│   └── LoggingService.ts                # Centralized logging
├── controllers/
│   ├── PaymentController.ts             # Payment endpoints
│   └── UEXWebhookController.ts         # Webhook handler
├── routes/
│   ├── paymentRoutes.ts                 # Payment routes
│   └── uexRoutes.ts                     # UEX-specific routes
├── middleware/
│   ├── rateLimiter.ts                   # Rate limiting
│   └── errorHandler.ts                  # Error handling
├── migrations/
│   └── 009_add_uex_fields.js           # Database updates
├── utils/
│   └── security.ts                      # Security helpers
├── types/
│   └── index.ts                         # TypeScript definitions
├── .env                                 # Environment variables
├── docker-compose.yml                   # Docker config
└── index.ts                             # Main application
```

---

**Version**: 2.0.0  
**Last Updated**: 2025-10-22  
**Status**: Production Ready ✅
