# UEX API Integration Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-10-23
**Estimated Time**: 2-3 weeks (60-80 development hours)

---

## 📊 Current Status Analysis

### ✅ What Already Exists

#### Backend Services
1. **UEX Backend** (`/uex/src/`)
   - Basic Express server structure
   - Payment processing service (internal logic only)
   - Exchange rate service (basic implementation)
   - Database service with Knex ORM
   - **Status**: 40% complete - needs UEX API integration

2. **Processing-Tier** (`/processing-tier/src/`)
   - UEXIntegrationService (basic wrapper)
   - Routes for UEX operations
   - Transaction management
   - **Status**: 30% complete - needs real UEX API calls

3. **Management Backend** (`/management-tier/backend/src/`)
   - UEX integration routes stub
   - Payment controller
   - **Status**: 20% complete - needs implementation

#### Frontend Services
1. **Client-Tier** (`/client-tier/src/`)
   - UEX API service stub
   - Payment UI components
   - **Status**: 30% complete - needs UEX-specific features

2. **Management Frontend** (`/management-tier/frontend/src/`)
   - Dashboard components
   - **Status**: 20% complete - needs UEX monitoring

### ❌ What's Missing (According to Specifications)

Based on `./Specifications/UEX_Integration_Guide/`:

1. **UEXService Class** - Complete implementation with real API calls
2. **Exchange Rate Integration** - Real-time rates from UEX
3. **Crypto Payment Flow** - Deposit address generation and monitoring
4. **Webhook Handler** - Receive UEX status updates
5. **Polling Service** - Alternative to webhooks for status updates
6. **Merchant Payment Links** - OAuth2 integration for payment URLs
7. **Database Schema Updates** - UEX-specific fields
8. **Frontend Components** - Crypto payment UI
9. **Monitoring & Logging** - UEX-specific metrics
10. **Testing Suite** - Integration tests with UEX API

---

## 🎯 Implementation Phases

### Phase 1: Core UEX Service Implementation (Week 1)

#### 1.1 Create UEXService Class (`uex/src/services/UEXService.ts`)

```typescript
/**
 * Complete UEX API integration service
 * Implements all API calls from UEX specifications
 */
export class UEXService {
  // API Configuration
  private swapBaseUrl: string;
  private merchantBaseUrl: string;
  private referralCode: string;
  private clientId?: string;
  private secretKey?: string;

  // Methods to implement:
  - getCurrencies() // GET /api/partners/get-currencies
  - estimateConversion() // POST /api/partners/estimate
  - initiateCryptoToCrypto() // POST /api/partners/swap/initiate-crypto-to-crypto
  - getOrderStatus() // POST /api/partners/order-show
  - getOAuth2Token() // POST /api/merchant/oauth2/token
  - generatePaymentLink() // POST /api/merchant/generate-payment-url
}
```

**Files to create/modify**:
- `uex/src/services/UEXService.ts` (NEW)
- `uex/src/types/uex.ts` (NEW - UEX-specific types)
- `uex/src/config/uex-config.ts` (NEW - UEX configuration)

#### 1.2 Enhance ExchangeRateService

**File**: `uex/src/services/ExchangeRateService.ts`

Add:
- Integration with UEXService for real-time rates
- Caching mechanism (1-5 minutes)
- Fallback to existing rates if UEX unavailable
- Support for 50+ cryptocurrencies

#### 1.3 Update PaymentProcessingService

**File**: `uex/src/services/PaymentProcessingService.ts`

Add:
- Detect crypto payments
- Call UEXService for swap initiation
- Store UEX order ID and deposit address
- Calculate UEX fees (0.1% buyer + 0.1% seller)

---

### Phase 2: Transaction Flow & Status Updates (Week 2)

#### 2.1 Webhook Implementation

**Files to create**:
- `uex/src/controllers/WebhookController.ts` (NEW)
- `uex/src/routes/webhookRoutes.ts` (NEW)

```typescript
/**
 * Handle webhook callbacks from UEX
 * POST /api/uex/webhook/order-status
 */
router.post('/webhook/order-status', async (req, res) => {
  // Validate webhook signature (if available)
  // Extract order_id, status, transaction_hash
  // Update transaction in database
  // Notify seller if completed
});
```

#### 2.2 Polling Service

**File**: `uex/src/services/UEXPollingService.ts` (NEW)

```typescript
/**
 * Poll UEX API for transaction status updates
 * Run as background service every 5 minutes
 */
export class UEXPollingService {
  - getPendingTransactions()
  - pollTransaction(transactionId)
  - updateTransactionStatus()
  - startPolling(interval)
  - stopPolling()
}
```

#### 2.3 Database Schema Updates

**File**: `uex/src/database/migrations/xxx_add_uex_fields.ts` (NEW)

Add fields to `payment_transactions` table:
```sql
ALTER TABLE payment_transactions ADD COLUMN:
- uex_order_id VARCHAR(255)
- uex_status VARCHAR(50)
- deposit_address VARCHAR(255)
- deposit_network VARCHAR(50)
- uex_transaction_hash VARCHAR(255)
- uex_buyer_fee DECIMAL(20, 8)
- uex_seller_fee DECIMAL(20, 8)
- uex_data JSONB
```

---

### Phase 3: Routes & Controllers (Week 2)

#### 3.1 UEX-Specific Routes

**File**: `uex/src/routes/uexRoutes.ts` (NEW)

```typescript
router.get('/currencies', getCurrencies);
router.post('/estimate', estimateConversion);
router.post('/poll/:txn_id', pollOrderStatus);
router.post('/payment-link', generatePaymentLink);
router.get('/health/detailed', getDetailedHealth);
router.get('/monitoring/stats', getMonitoringStats);
```

#### 3.2 Update Existing Routes

**File**: `uex/src/routes/paymentRoutes.ts`

Enhance:
- `POST /api/payments/process` - Add crypto payment support
- `GET /api/payments/transaction/:id/status` - Include UEX data

---

### Phase 4: Frontend Integration (Week 3)

#### 4.1 Client-Tier Frontend

**Files to create/modify**:
- `client-tier/src/services/uexApi.ts` - Complete implementation
- `client-tier/src/components/CryptoPayment.tsx` (NEW)
- `client-tier/src/components/DepositAddress.tsx` (NEW)
- `client-tier/src/components/CurrencySelector.tsx` (NEW)

Features:
- List all supported cryptocurrencies
- Display real-time exchange rates
- Show deposit address with QR code
- Transaction status tracking
- Fee breakdown display

#### 4.2 Management Frontend

**Files to create**:
- `management-tier/frontend/src/components/UEXDashboard.tsx` (NEW)
- `management-tier/frontend/src/components/UEXTransactionList.tsx` (NEW)
- `management-tier/frontend/src/services/uexApi.ts` (NEW)

Features:
- UEX transaction monitoring
- Status filtering and search
- Export to CSV
- Referral earnings tracking

---

### Phase 5: Monitoring & Testing (Week 3)

#### 5.1 Logging & Monitoring

**File**: `uex/src/services/MonitoringService.ts` (NEW)

Track:
- Total UEX transactions
- Success/failure rates
- Average completion time
- Total fees collected
- Referral earnings

#### 5.2 Integration Tests

**Files to create**:
- `uex/tests/integration/uex-service.test.ts`
- `uex/tests/integration/payment-flow.test.ts`
- `uex/tests/integration/webhook.test.ts`

---

## 📋 Detailed Task List

### Backend Tasks

**UEX Backend Service** (`/uex/`)
- [ ] Create UEXService class with all API methods
- [ ] Add UEX configuration management
- [ ] Implement currency fetching
- [ ] Implement exchange rate estimation
- [ ] Implement swap initiation
- [ ] Implement order status polling
- [ ] Implement OAuth2 token generation
- [ ] Implement payment link generation
- [ ] Add caching for currencies and rates
- [ ] Add retry logic for API calls
- [ ] Enhance ExchangeRateService with UEX integration
- [ ] Update PaymentProcessingService for crypto payments
- [ ] Create WebhookController
- [ ] Create UEXPollingService
- [ ] Add database migration for UEX fields
- [ ] Create UEX routes
- [ ] Add error handling middleware
- [ ] Add request validation
- [ ] Implement health checks
- [ ] Add monitoring service

**Processing-Tier**
- [ ] Update UEXIntegrationService to call real UEX backend
- [ ] Add UEX transaction status synchronization
- [ ] Implement settlement processing with UEX

**Management Backend**
- [ ] Implement UEX analytics endpoints
- [ ] Add UEX transaction reporting
- [ ] Create referral earnings tracking

### Frontend Tasks

**Client-Tier Frontend**
- [ ] Complete uexApi service implementation
- [ ] Create CryptoPayment component
- [ ] Create DepositAddress component with QR code
- [ ] Create CurrencySelector component
- [ ] Add real-time exchange rate display
- [ ] Add transaction status tracking UI
- [ ] Add fee breakdown display
- [ ] Integrate with payment flow

**Management Frontend**
- [ ] Create UEX dashboard page
- [ ] Create UEX transaction list component
- [ ] Add filtering and search
- [ ] Add export functionality
- [ ] Create referral earnings display
- [ ] Add UEX health monitoring

### Database Tasks
- [ ] Create migration for UEX fields
- [ ] Add indexes for UEX queries
- [ ] Update seed data with UEX examples

### DevOps Tasks
- [ ] Update environment variables
- [ ] Add UEX API credentials to secrets
- [ ] Configure webhook URLs
- [ ] Update Docker configurations
- [ ] Update Kubernetes manifests with UEX env vars
- [ ] Add UEX health checks to monitoring

### Documentation Tasks
- [ ] API documentation for UEX endpoints
- [ ] Frontend component documentation
- [ ] Deployment guide updates
- [ ] User guide for crypto payments
- [ ] Developer guide for UEX integration

### Testing Tasks
- [ ] Unit tests for UEXService
- [ ] Integration tests for payment flow
- [ ] Webhook handler tests
- [ ] Polling service tests
- [ ] Frontend component tests
- [ ] End-to-end tests with testnet

---

## 🔑 Environment Variables Required

Add to all services:

```env
# UEX API Configuration
UEX_SWAP_BASE_URL=https://uexswap.com
UEX_MERCHANT_BASE_URL=https://uex.us
UEX_REFERRAL_CODE=5drfo01pgq88

# Optional: Merchant API credentials
UEX_CLIENT_ID=
UEX_SECRET_KEY=

# Polling configuration
UEX_POLLING_ENABLED=true
UEX_POLLING_INTERVAL=300000

# Webhook configuration
UEX_WEBHOOK_URL=https://yourdomain.com/api/uex/webhook/order-status
```

---

## 📊 Success Criteria

### Technical
- [ ] All UEX API endpoints implemented and tested
- [ ] 99.9% API uptime
- [ ] <2 seconds response time for estimates
- [ ] <5 minutes status update latency
- [ ] >95% transaction success rate

### Functional
- [ ] Support for 50+ cryptocurrencies
- [ ] Real-time exchange rates
- [ ] Automated crypto-to-fiat conversion
- [ ] Webhook or polling for status updates
- [ ] Payment link generation (with merchant API)
- [ ] Referral commission tracking

### User Experience
- [ ] Clear crypto payment flow
- [ ] QR code for deposit address
- [ ] Real-time transaction status
- [ ] Transparent fee breakdown
- [ ] Mobile-responsive UI

---

## 🚀 Getting Started

### Prerequisites
1. **UEX Account Setup**
   - Register at https://uex.us/
   - Complete KYC verification
   - Generate referral code: https://uex.us/referrals
   - (Optional) Apply for merchant API credentials

2. **Development Environment**
   - Node.js 18+
   - PostgreSQL 15+ (or SQLite for dev)
   - Redis (optional, for caching)

3. **Install Dependencies**
   ```bash
   cd uex
   npm install axios node-cache express-rate-limit

   cd ../processing-tier
   npm install axios

   cd ../client-tier
   npm install axios qrcode.react
   ```

### Quick Start Commands

```bash
# 1. Set environment variables
export UEX_REFERRAL_CODE="5drfo01pgq88"
export UEX_SWAP_BASE_URL="https://uexswap.com"
export UEX_MERCHANT_BASE_URL="https://uex.us"

# 2. Run database migrations
cd uex
npm run migrate

# 3. Start development server
npm run dev

# 4. Test UEX connection
curl http://localhost:3903/api/uex/health/detailed
```

---

## 📞 References

- **UEX API Docs**: https://uex-us.stoplight.io/docs/uex
- **UEX Dashboard**: https://uex.us/
- **Specifications**: `./Specifications/UEX_Integration_Guide/`
- **Quick Reference**: `./Specifications/UEX_Integration_Guide/Quick_Reference_Cheatsheet.md`
- **Requirements**: `./Specifications/UEX_Integration_Guide/Requirements_and_Specifications.md`

---

## 📝 Next Steps

1. **Read this document** - Understand the scope
2. **Review specifications** - Read `./Specifications/UEX_Integration_Guide/00_START_HERE.md`
3. **Set up UEX account** - Complete KYC and get referral code
4. **Start Phase 1** - Implement UEXService class
5. **Test incrementally** - Test each component as you build
6. **Deploy to staging** - Test with small amounts
7. **Production launch** - Roll out to users

**Estimated Timeline**: 2-3 weeks for complete implementation

**Ready to begin? Let's start with Phase 1: UEXService Implementation!** 🚀
