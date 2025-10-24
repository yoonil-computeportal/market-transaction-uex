# UEX API Integration - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                                   │
│                    (Web App / Mobile App / API Client)                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ HTTP/HTTPS
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      YOUR PAYMENT PROCESSING SYSTEM                          │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API LAYER                                     │   │
│  │  ┌──────────────────┐         ┌───────────────────┐                 │   │
│  │  │ PaymentController│         │ UEXWebhookController│                │   │
│  │  │                  │         │                   │                  │   │
│  │  │ - processPayment │         │ - handleWebhook   │                  │   │
│  │  │ - getStatus      │         │ - pollStatus      │                  │   │
│  │  └────────┬─────────┘         └─────────┬─────────┘                 │   │
│  └───────────┼─────────────────────────────┼───────────────────────────┘   │
│              │                             │                                │
│  ┌───────────┼─────────────────────────────┼───────────────────────────┐   │
│  │           │    SERVICE LAYER            │                           │   │
│  │           ▼                             ▼                           │   │
│  │  ┌────────────────────┐      ┌─────────────────────┐               │   │
│  │  │ PaymentProcessing  │      │  UEXPollingService  │               │   │
│  │  │     Service        │◄────►│  (Background)       │               │   │
│  │  │                    │      └─────────────────────┘               │   │
│  │  │ - Detect crypto    │                                            │   │
│  │  │ - Calculate fees   │      ┌─────────────────────┐               │   │
│  │  │ - Process payment  │      │  ExchangeRateService│               │   │
│  │  └─────────┬──────────┘      │                     │               │   │
│  │            │                  │ - Get live rates   │               │   │
│  │            │                  │ - Cache rates      │               │   │
│  │            │                  └──────────┬──────────┘               │   │
│  │            │                             │                          │   │
│  │            └──────────┬──────────────────┘                          │   │
│  │                       │                                             │   │
│  │                       ▼                                             │   │
│  │            ┌──────────────────────┐                                │   │
│  │            │    UEXService        │                                │   │
│  │            │                      │                                │   │
│  │            │ - getSupportedCurr() │                                │   │
│  │            │ - estimateConversion()│                               │   │
│  │            │ - initiateCryptoSwap()│                               │   │
│  │            │ - getOrderStatus()   │                                │   │
│  │            │ - generatePaymentLink()│                              │   │
│  │            └──────────┬───────────┘                                │   │
│  └───────────────────────┼───────────────────────────────────────────┘   │
│                          │                                                │
│  ┌───────────────────────┼───────────────────────────────────────────┐   │
│  │  DATA LAYER           │                                           │   │
│  │                       ▼                                           │   │
│  │            ┌──────────────────────┐                              │   │
│  │            │  DatabaseService     │                              │   │
│  │            │                      │                              │   │
│  │            │ - Transactions       │                              │   │
│  │            │ - Exchange Rates     │                              │   │
│  │            │ - Conversions        │                              │   │
│  │            │ - Fees               │                              │   │
│  │            └──────────┬───────────┘                              │   │
│  │                       │                                           │   │
│  │                       ▼                                           │   │
│  │            ┌──────────────────────┐                              │   │
│  │            │   PostgreSQL DB      │                              │   │
│  │            │                      │                              │   │
│  │            │ - payment_transactions│                             │   │
│  │            │ - currency_conversions│                             │   │
│  │            │ - exchange_rates     │                              │   │
│  │            └──────────────────────┘                              │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ HTTPS (API Calls)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UEX PLATFORM                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    UEX SWAP API                                      │   │
│  │                  (uexswap.com)                                       │   │
│  │                                                                       │   │
│  │  GET  /api/partners/get-currencies                                  │   │
│  │  POST /api/partners/estimate                                        │   │
│  │  POST /api/partners/swap/initiate-crypto-to-crypto                 │   │
│  │  POST /api/partners/swap/initiate-cardano-to-cardano               │   │
│  │  POST /api/partners/order-show                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  UEX MERCHANT API                                    │   │
│  │                    (uex.us)                                          │   │
│  │                                                                       │   │
│  │  POST /api/merchant/oauth2/token                                    │   │
│  │  POST /api/merchant/generate-payment-url                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              UEX EXCHANGE ENGINE                                     │   │
│  │         (Crypto swaps, rate calculations)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────── ┘
                               │
                               │ Blockchain Networks
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN NETWORKS                                     │
│                                                                               │
│    Bitcoin (BTC)  │  Ethereum (ETH)  │  Tron (TRX)  │  Cardano (ADA)       │
│                   │                   │              │                       │
│    Binance Smart  │  Polygon (MATIC) │  Solana (SOL)│  And 50+ more...     │
│       Chain       │                   │              │                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow Sequence Diagram

### Crypto-to-Crypto Payment Flow

```
Customer          Your API          UEXService       UEX Platform      Blockchain
   │                 │                  │                 │                │
   │  1. POST        │                  │                 │                │
   │  /payments/     │                  │                 │                │
   │  process        │                  │                 │                │
   ├────────────────►│                  │                 │                │
   │                 │                  │                 │                │
   │                 │  2. Get rate     │                 │                │
   │                 ├─────────────────►│                 │                │
   │                 │                  │  3. POST        │                │
   │                 │                  │  /estimate      │                │
   │                 │                  ├────────────────►│                │
   │                 │                  │                 │                │
   │                 │                  │  4. Rate data   │                │
   │                 │                  │◄────────────────┤                │
   │                 │  5. Rate         │                 │                │
   │                 │◄─────────────────┤                 │                │
   │                 │                  │                 │                │
   │                 │  6. Calculate    │                 │                │
   │                 │     fees         │                 │                │
   │                 │                  │                 │                │
   │                 │  7. Initiate     │                 │                │
   │                 │     swap         │                 │                │
   │                 ├─────────────────►│                 │                │
   │                 │                  │  8. POST        │                │
   │                 │                  │  /initiate-swap │                │
   │                 │                  ├────────────────►│                │
   │                 │                  │                 │                │
   │                 │                  │  9. Order data  │                │
   │                 │                  │  + deposit addr │                │
   │                 │                  │◄────────────────┤                │
   │                 │  10. Order info  │                 │                │
   │                 │◄─────────────────┤                 │                │
   │                 │                  │                 │                │
   │  11. Response   │                  │                 │                │
   │  with deposit   │                  │                 │                │
   │  address        │                  │                 │                │
   │◄────────────────┤                  │                 │                │
   │                 │                  │                 │                │
   │  12. Send crypto                   │                 │                │
   │  to deposit     │                  │                 │                │
   │  address        │                  │                 │                │
   ├────────────────────────────────────────────────────────────────────►│
   │                 │                  │                 │                │
   │                 │                  │                 │  13. Detect    │
   │                 │                  │                 │  deposit       │
   │                 │                  │                 │◄───────────────┤
   │                 │                  │                 │                │
   │                 │                  │                 │  14. Confirm   │
   │                 │                  │                 │  transaction   │
   │                 │                  │                 │◄───────────────┤
   │                 │                  │                 │                │
   │                 │                  │                 │  15. Execute   │
   │                 │                  │                 │  swap          │
   │                 │                  │                 │                │
   │                 │                  │                 │  16. Send to   │
   │                 │                  │                 │  recipient     │
   │                 │                  │                 ├───────────────►│
   │                 │                  │                 │                │
   │                 │  17. Webhook/Poll│  18. Order     │                │
   │                 │  status update   │  status change │                │
   │                 │◄─────────────────┤◄────────────────┤                │
   │                 │                  │                 │                │
   │                 │  19. Update DB   │                 │                │
   │                 │  status:         │                 │                │
   │                 │  "completed"     │                 │                │
   │                 │                  │                 │                │
   │                 │  20. Notify      │                 │                │
   │                 │  seller          │                 │                │
   │                 │                  │                 │                │
   │  21. Email/     │                  │                 │                │
   │  notification   │                  │                 │                │
   │◄────────────────┤                  │                 │                │
```

---

## Status Update Flow (Webhook vs Polling)

### Option 1: Webhook (Real-time)

```
UEX Platform                Your System
     │                           │
     │  Order status changes     │
     │  (e.g., completed)        │
     │                           │
     │  POST /api/uex/webhook    │
     ├──────────────────────────►│
     │  {                        │
     │    order_id: "xxx",       │
     │    status: "Complete"     │
     │  }                        │
     │                           │
     │          200 OK           │
     │◄──────────────────────────┤
                                 │
                                 │ Find transaction
                                 │ by order_id
                                 │
                                 │ Map status
                                 │
                                 │ Update DB
                                 │
                                 │ Notify seller
```

### Option 2: Polling (Scheduled)

```
  Cron Job                  Your System              UEX Platform
     │                           │                        │
     │  Every 5 minutes          │                        │
     ├──────────────────────────►│                        │
     │                           │                        │
     │                           │  Get pending orders    │
     │                           │  with UEX IDs          │
     │                           │                        │
     │                           │  For each order:       │
     │                           │  POST /order-show      │
     │                           ├───────────────────────►│
     │                           │                        │
     │                           │  Order status          │
     │                           │◄───────────────────────┤
     │                           │                        │
     │                           │  If status changed:    │
     │                           │  - Update DB           │
     │                           │  - Notify seller       │
     │                           │                        │
     │  Poll complete            │                        │
     │◄──────────────────────────┤                        │
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ UEX Exchange │    │ Your Database│    │ Blockchain   │         │
│  │ Rates API    │    │              │    │ Networks     │         │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│         │                   │                   │                   │
└─────────┼───────────────────┼───────────────────┼───────────────────┘
          │                   │                   │
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Exchange Rates ───► Fee Calculator ───► Transaction Creator        │
│       │                    │                      │                  │
│       │                    │                      │                  │
│       ▼                    ▼                      ▼                  │
│  Cache Service      Swap Initiator        Database Writer           │
│                           │                      │                  │
│                           │                      │                  │
│                           ▼                      ▼                  │
│                    Status Monitor         Notification Service      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
          │                   │                   │
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA OUTPUTS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ API Response │    │ Database     │    │ Notifications│         │
│  │ to Client    │    │ Records      │    │ (Email/SMS)  │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Integration Timeline

```
Week 1: Setup & Configuration
├── Day 1-2: UEX account setup, KYC verification
├── Day 3-4: Environment configuration, dependencies
└── Day 5: Database schema updates

Week 2: Core Integration
├── Day 1-2: Implement UEXService
├── Day 3: Enhance ExchangeRateService
├── Day 4: Update PaymentProcessingService
└── Day 5: Add webhook handler

Week 3: Testing & Monitoring
├── Day 1-2: Unit tests
├── Day 3: Integration tests with UEX sandbox
├── Day 4: Implement monitoring & logging
└── Day 5: Performance testing

Week 4: Deployment & Launch
├── Day 1-2: Staging deployment
├── Day 3: Production deployment
├── Day 4: Monitor & optimize
└── Day 5: Launch announcement
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT REQUEST                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: HTTPS/TLS                                               │
│ - Encrypted transport                                            │
│ - Certificate validation                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Rate Limiting                                           │
│ - General API: 100 req/15min                                     │
│ - Payments: 10 req/min                                           │
│ - Webhooks: 60 req/min                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Input Validation                                        │
│ - Sanitize inputs                                                │
│ - Validate types                                                 │
│ - Check required fields                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Authentication (Merchant API)                           │
│ - OAuth2 tokens                                                  │
│ - Token expiration                                               │
│ - Refresh mechanism                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Business Logic Validation                               │
│ - Currency support check                                         │
│ - Amount limits                                                  │
│ - Balance verification                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 6: Data Encryption                                         │
│ - Sensitive fields masked in logs                                │
│ - Secrets in env variables                                       │
│ - Encrypted database connections                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROCESS REQUEST                              │
└─────────────────────────────────────────────────────────────────┘
```

---

This visual guide provides a comprehensive overview of how all components work together!
