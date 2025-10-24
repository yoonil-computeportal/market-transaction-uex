# UEX API Integration - Requirements & Specifications Document

**Document Version**: 1.0.0  
**Date**: 2025-10-22  
**Project**: UEX Cryptocurrency Payment Integration  
**Status**: Final Specification  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [Functional Requirements](#functional-requirements)
4. [Technical Specifications](#technical-specifications)
5. [System Architecture](#system-architecture)
6. [API Specifications](#api-specifications)
7. [Database Requirements](#database-requirements)
8. [Security Requirements](#security-requirements)
9. [Performance Requirements](#performance-requirements)
10. [Integration Requirements](#integration-requirements)
11. [Testing Requirements](#testing-requirements)
12. [Deployment Requirements](#deployment-requirements)
13. [Acceptance Criteria](#acceptance-criteria)

---

## 1. Executive Summary

### 1.1 Project Overview

**Objective**: Integrate UEX cryptocurrency exchange and payment APIs into the existing multi-currency payment processing system to enable cryptocurrency payment capabilities.

**Scope**: Full-stack integration including exchange rate services, payment processing, order tracking, and merchant payment link generation.

**Timeline**: 2-3 weeks (60-80 development hours)

**Stakeholders**:
- Development Team
- Product Management
- Finance/Accounting
- Customer Support
- End Users (Buyers and Sellers)

### 1.2 Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Enable crypto payments | 50+ cryptocurrencies | Currency list endpoint |
| Reduce transaction fees | <1% total fees | Fee calculation accuracy |
| Faster settlements | <30 minutes for crypto | Average completion time |
| Increase revenue | +0.19% referral commission | Referral earnings tracking |
| Improve user experience | 95%+ success rate | Transaction completion rate |

### 1.3 Success Metrics

- **Technical**: 99.9% API uptime, <2s response time
- **Business**: 100+ crypto transactions/day within 3 months
- **User**: NPS score >8 for crypto payment feature
- **Financial**: Referral earnings >$1000/month

---

## 2. Business Requirements

### 2.1 Core Business Needs

**BR-001: Multi-Currency Support**
- **Priority**: CRITICAL
- **Description**: System must support 50+ cryptocurrencies including BTC, ETH, USDT, USDC, ADA, BNB, SOL
- **Business Value**: Attract crypto-native users, expand market reach
- **Success Criteria**: All UEX-supported currencies accessible via API

**BR-002: Real-Time Exchange Rates**
- **Priority**: CRITICAL
- **Description**: Display accurate, real-time exchange rates for all currency pairs
- **Business Value**: Competitive pricing, user trust, reduced slippage
- **Success Criteria**: Rates updated within 5 minutes, accuracy >99.5%

**BR-003: Automated Payment Processing**
- **Priority**: CRITICAL
- **Description**: Automatically process crypto-to-crypto, crypto-to-fiat, and fiat-to-crypto conversions
- **Business Value**: Reduce manual intervention, scale operations
- **Success Criteria**: >95% transactions complete without manual intervention

**BR-004: Transaction Tracking**
- **Priority**: HIGH
- **Description**: Real-time tracking of payment status from initiation to completion
- **Business Value**: Transparency, customer satisfaction, dispute resolution
- **Success Criteria**: Status updates within 5 minutes of change

**BR-005: Referral Revenue Generation**
- **Priority**: MEDIUM
- **Description**: Earn commissions on all swaps processed through the platform
- **Business Value**: Additional revenue stream, offset integration costs
- **Success Criteria**: 0.19% commission + 0.5 ADA per Cardano swap

**BR-006: Merchant Payment Links**
- **Priority**: MEDIUM
- **Description**: Generate payment URLs for merchant checkout flows
- **Business Value**: Easy integration for merchants, increase transaction volume
- **Success Criteria**: Payment links generated in <2 seconds

### 2.2 User Stories

**US-001: Customer Pays with Crypto**
```
As a customer,
I want to pay for products using cryptocurrency,
So that I can use my preferred payment method.

Acceptance Criteria:
- Customer can select from 50+ cryptocurrencies
- Real-time exchange rate is displayed
- Clear fee breakdown is shown
- Deposit address is provided with QR code
- Payment confirmation is sent within 30 minutes
```

**US-002: Seller Receives Fiat Payment**
```
As a seller,
I want to receive fiat currency when customers pay with crypto,
So that I don't have to manage cryptocurrency volatility.

Acceptance Criteria:
- Customer pays in crypto
- System automatically converts to fiat
- Seller receives fiat via bank transfer
- Fees are transparent and reasonable
- Settlement occurs within 2 business days
```

**US-003: Admin Monitors Transactions**
```
As an administrator,
I want to monitor all cryptocurrency transactions in real-time,
So that I can ensure system health and resolve issues quickly.

Acceptance Criteria:
- Dashboard shows pending/processing/completed transactions
- Filtering by status, currency, date range
- Transaction details include UEX order ID
- Alerts for failed or stuck transactions
- Export capability for reporting
```

**US-004: Developer Integrates Payment API**
```
As a developer,
I want clear API documentation and endpoints,
So that I can integrate crypto payments into my application.

Acceptance Criteria:
- RESTful API with JSON responses
- Complete API documentation
- Code examples in multiple languages
- Sandbox environment for testing
- Error messages are clear and actionable
```

### 2.3 Business Rules

**BR-RULE-001: Fee Structure**
- UEX Buyer Fee: 0.1% of transaction amount
- UEX Seller Fee: 0.1% of transaction amount
- Conversion Fee: 0.2% when currencies differ
- Management Fee: 1.0% (0.5% buyer + 0.5% seller)
- Minimum Fee: $0.001
- Maximum Fee: $100

**BR-RULE-002: Transaction Limits**
- Minimum Transaction: Defined by UEX per currency
- Maximum Transaction: Defined by UEX per currency
- Daily Volume Limit: No limit (subject to UEX availability)

**BR-RULE-003: Settlement Times**
- Crypto-to-Crypto: 10-30 minutes
- Crypto-to-Fiat: 1-2 business days
- Fiat-to-Crypto: 1-2 hours
- Fiat-to-Fiat: 1-3 business days

**BR-RULE-004: Refund Policy**
- Automatic refunds for failed transactions
- Manual review for disputed transactions
- Refunds processed within 24 hours of approval
- Refund fees deducted from refund amount

**BR-RULE-005: KYC Requirements**
- Platform operator must complete KYC with UEX
- Referral code required for all transactions
- Blocked if KYC not approved
- Users do not require separate KYC (handled by platform)

---

## 3. Functional Requirements

### 3.1 Exchange Rate Management

**FR-001: Fetch Supported Currencies**
- **ID**: FR-001
- **Priority**: CRITICAL
- **Description**: Retrieve list of all supported cryptocurrencies and networks from UEX
- **Input**: None
- **Output**: JSON array of currencies with networks
- **Processing**:
  1. Call UEX `/api/partners/get-currencies` endpoint
  2. Parse response for currencies and Cardano tokens
  3. Cache results for 1 hour
  4. Return structured currency data
- **Error Handling**: Fallback to cached data if API fails
- **Performance**: <1 second response time

**FR-002: Get Exchange Rate Estimate**
- **ID**: FR-002
- **Priority**: CRITICAL
- **Description**: Calculate estimated exchange rate for currency pair
- **Input**: 
  - Source currency (e.g., "BTC")
  - Target currency (e.g., "USDT")
  - Amount (e.g., 0.5)
- **Output**: Exchange rate, conversion amount, fees, min/max limits
- **Processing**:
  1. Validate currency pair is supported
  2. Call UEX `/api/partners/estimate` endpoint
  3. Calculate platform fees
  4. Cache rate for 1 minute
  5. Return comprehensive rate data
- **Error Handling**: Return error if pair not supported
- **Performance**: <2 seconds response time

**FR-003: Cache Exchange Rates**
- **ID**: FR-003
- **Priority**: HIGH
- **Description**: Cache exchange rates to reduce API calls and improve performance
- **Input**: Currency pair, rate, timestamp
- **Output**: Cached rate data
- **Processing**:
  1. Store rate in database with expiration
  2. Check cache before API call
  3. Invalidate cache after 5 minutes
  4. Clear cache on manual refresh
- **Error Handling**: Continue without cache if storage fails
- **Performance**: Cache hit should be <100ms

### 3.2 Payment Processing

**FR-004: Process Crypto Payment**
- **ID**: FR-004
- **Priority**: CRITICAL
- **Description**: Initiate cryptocurrency swap via UEX
- **Input**:
  - Client ID
  - Seller ID
  - Amount
  - Source currency
  - Target currency
  - Payment method ("crypto")
  - Settlement method ("blockchain" or "bank")
  - Recipient wallet address (optional)
- **Output**: 
  - Transaction ID
  - UEX Order ID
  - Deposit address
  - QR code URL
  - Fee breakdown
  - Estimated completion time
- **Processing**:
  1. Validate all input parameters
  2. Check currency pair is supported
  3. Get exchange rate from UEX
  4. Calculate all fees
  5. Create transaction record in database
  6. Call UEX swap initiation endpoint
  7. Store deposit address and order ID
  8. Generate QR code for deposit address
  9. Return response to client
- **Error Handling**: 
  - Rollback database transaction on failure
  - Set transaction status to "failed"
  - Return detailed error message
- **Performance**: <5 seconds total processing time

**FR-005: Process Fiat Payment**
- **ID**: FR-005
- **Priority**: HIGH
- **Description**: Process traditional fiat payment without UEX
- **Input**: Standard payment request with fiat currencies
- **Output**: Transaction record, payment instructions
- **Processing**: Use existing payment processing logic
- **Error Handling**: Standard error handling
- **Performance**: <3 seconds response time

**FR-006: Calculate Transaction Fees**
- **ID**: FR-006
- **Priority**: CRITICAL
- **Description**: Calculate all applicable fees for a transaction
- **Input**: Amount, currency pair, payment method
- **Output**: 
  - UEX buyer fee
  - UEX seller fee
  - Conversion fee
  - Management fee
  - Total fees
- **Processing**:
  1. Calculate UEX buyer fee (0.1% of amount)
  2. Calculate UEX seller fee (0.1% of amount)
  3. Calculate conversion fee (0.2% if currencies differ)
  4. Calculate management fee (1.0% total)
  5. Apply minimum/maximum fee limits
  6. Return itemized fee breakdown
- **Error Handling**: Return error if amount is invalid
- **Performance**: <100ms calculation time

### 3.3 Order Tracking

**FR-007: Track Order Status**
- **ID**: FR-007
- **Priority**: CRITICAL
- **Description**: Monitor and update transaction status from UEX
- **Input**: Transaction ID or UEX Order ID
- **Output**: Current status, order details
- **Processing**:
  1. Retrieve transaction from database
  2. If UEX order ID exists, poll UEX API
  3. Map UEX status to system status
  4. Update database record
  5. Trigger notifications if status changed
  6. Return current status
- **Status Mapping**:
  - "Awaiting Deposit" → "pending"
  - "Confirming Deposit" → "processing"
  - "Exchanging" → "processing"
  - "Sending" → "processing"
  - "Complete" → "completed"
  - "Failed" → "failed"
  - "Refund" → "cancelled"
- **Error Handling**: Return last known status if API fails
- **Performance**: <3 seconds response time

**FR-008: Webhook Status Updates**
- **ID**: FR-008
- **Priority**: HIGH
- **Description**: Receive real-time status updates from UEX via webhook
- **Input**: Webhook POST with order_id, status, metadata
- **Output**: 200 OK response
- **Processing**:
  1. Validate webhook signature (if available)
  2. Find transaction by UEX order ID
  3. Map status to system status
  4. Update database
  5. Trigger seller notification if completed
  6. Log webhook event
  7. Return success response
- **Error Handling**: Return 400 for invalid data, 404 if transaction not found
- **Performance**: <1 second processing time

**FR-009: Automated Polling**
- **ID**: FR-009
- **Priority**: HIGH
- **Description**: Background service to poll UEX for pending order statuses
- **Input**: None (runs automatically)
- **Output**: Updated transaction statuses
- **Processing**:
  1. Every 5 minutes, query database for pending orders
  2. For each order with UEX ID, call status endpoint
  3. Update status if changed
  4. Trigger notifications
  5. Log polling results
- **Error Handling**: Continue on individual failures, log errors
- **Performance**: Process 100 orders in <30 seconds

### 3.4 Merchant Features

**FR-010: Generate Payment Link**
- **ID**: FR-010
- **Priority**: MEDIUM
- **Description**: Create UEX-hosted payment URL for merchant checkout
- **Input**:
  - Order ID
  - Item name
  - Amount (in fiat)
  - Success URL
  - Failure URL
- **Output**: Payment redirect URL
- **Processing**:
  1. Authenticate with UEX merchant API (OAuth2)
  2. Call payment link generation endpoint
  3. Store payment link in database
  4. Return URL to merchant
- **Error Handling**: Return error if authentication fails
- **Performance**: <3 seconds response time

**FR-011: Seller Payout Management**
- **ID**: FR-011
- **Priority**: HIGH
- **Description**: Track and manage seller payouts
- **Input**: Seller ID
- **Output**: Payout history, pending amounts
- **Processing**:
  1. Query completed transactions for seller
  2. Calculate amounts after fees
  3. Track payout status
  4. Generate payout records
- **Error Handling**: Return empty list if no transactions
- **Performance**: <2 seconds query time

### 3.5 Reporting and Analytics

**FR-012: Transaction Reports**
- **ID**: FR-012
- **Priority**: MEDIUM
- **Description**: Generate transaction reports for specified periods
- **Input**: Date range, filters (status, currency, seller)
- **Output**: CSV or JSON report
- **Processing**:
  1. Query database with filters
  2. Aggregate data (volume, fees, counts)
  3. Format as requested
  4. Return report data
- **Error Handling**: Return error for invalid date range
- **Performance**: <10 seconds for 10,000 records

**FR-013: System Metrics**
- **ID**: FR-013
- **Priority**: MEDIUM
- **Description**: Track system health and performance metrics
- **Input**: None
- **Output**: Metrics dashboard data
- **Metrics**:
  - Total transactions (all time, today, this week)
  - Pending UEX orders
  - Completed transactions today
  - Failed transactions today
  - Average completion time
  - Total volume (24 hours)
  - API success rate
  - Database health
- **Processing**: Query database and calculate metrics
- **Error Handling**: Return partial data if some queries fail
- **Performance**: <2 seconds response time

---

## 4. Technical Specifications

### 4.1 Technology Stack

**Backend**:
- **Runtime**: Node.js 16.x or higher
- **Language**: TypeScript 4.5+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 13+
- **ORM**: Knex.js
- **HTTP Client**: Axios

**Dependencies**:
```json
{
  "express": "^4.18.0",
  "axios": "^1.4.0",
  "uuid": "^9.0.0",
  "knex": "^2.5.0",
  "pg": "^8.11.0",
  "node-cache": "^5.1.2",
  "express-rate-limit": "^6.10.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0"
}
```

**Development Tools**:
- **TypeScript Compiler**: tsc
- **Testing**: Jest, Supertest
- **Linting**: ESLint with TypeScript support
- **Code Formatting**: Prettier
- **Version Control**: Git

### 4.2 Development Environment

**Minimum Requirements**:
- OS: Linux, macOS, or Windows with WSL
- RAM: 8GB minimum, 16GB recommended
- Disk: 20GB free space
- Node.js: v16.0.0 or higher
- PostgreSQL: v13.0 or higher
- Git: v2.30 or higher

**Recommended IDE**:
- Visual Studio Code with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - REST Client
  - Database Client

### 4.3 System Architecture Components

**Service Layer**:
1. **UEXService**
   - Purpose: Interface with UEX APIs
   - Responsibilities:
     - HTTP client for UEX endpoints
     - Request/response transformation
     - Error handling and retries
     - Token management (merchant API)
   - Dependencies: Axios, CacheService

2. **ExchangeRateService**
   - Purpose: Manage exchange rate data
   - Responsibilities:
     - Fetch rates from UEX
     - Cache management
     - Fallback to mock rates
     - Cross-rate calculations
   - Dependencies: UEXService, DatabaseService

3. **PaymentProcessingService**
   - Purpose: Core payment processing logic
   - Responsibilities:
     - Payment validation
     - Fee calculation
     - Transaction creation
     - UEX swap initiation
     - Status management
   - Dependencies: ExchangeRateService, UEXService, DatabaseService

4. **UEXPollingService**
   - Purpose: Background order status synchronization
   - Responsibilities:
     - Periodic polling of pending orders
     - Status updates
     - Error recovery
     - Graceful shutdown
   - Dependencies: UEXService, PaymentProcessingService, DatabaseService

5. **DatabaseService**
   - Purpose: Data persistence layer
   - Responsibilities:
     - CRUD operations
     - Transaction management
     - Query optimization
     - Connection pooling
   - Dependencies: Knex.js, PostgreSQL

6. **CacheService**
   - Purpose: In-memory caching
   - Responsibilities:
     - Store/retrieve cached data
     - TTL management
     - Cache invalidation
     - Statistics tracking
   - Dependencies: node-cache

7. **LoggingService**
   - Purpose: Centralized logging
   - Responsibilities:
     - Log formatting
     - Log levels (error, warn, info, debug)
     - Log rotation
     - External service integration
   - Dependencies: None

**Controller Layer**:
1. **PaymentController**
   - Endpoints:
     - POST /api/payments/process
     - GET /api/payments/transactions
     - GET /api/payments/transaction/:id/status
     - PUT /api/payments/transaction/:id/status
     - GET /api/payments/transaction/:id/fees
     - GET /api/payments/transaction/:id/conversions
   - Validation: Request body validation
   - Error Handling: HTTP error responses

2. **UEXWebhookController**
   - Endpoints:
     - POST /api/uex/webhook/order-status
     - GET /api/uex/poll/:transaction_id
   - Validation: Webhook signature verification
   - Error Handling: Structured error responses

**Middleware**:
1. **Rate Limiter**
   - General API: 100 requests per 15 minutes per IP
   - Payment API: 10 requests per minute per IP
   - Webhook API: 60 requests per minute per IP

2. **Error Handler**
   - Catch all errors
   - Log errors with context
   - Return appropriate HTTP status
   - Mask sensitive data in responses

3. **Request Logger**
   - Log all incoming requests
   - Include method, path, IP, timestamp
   - Exclude sensitive headers

4. **CORS Handler**
   - Allow specified origins
   - Support credentials
   - Handle preflight requests

### 4.4 Code Organization

```
project-root/
├── src/
│   ├── controllers/
│   │   ├── PaymentController.ts
│   │   └── UEXWebhookController.ts
│   ├── services/
│   │   ├── UEXService.ts
│   │   ├── ExchangeRateService.ts
│   │   ├── PaymentProcessingService.ts
│   │   ├── UEXPollingService.ts
│   │   ├── DatabaseService.ts
│   │   ├── CacheService.ts
│   │   └── LoggingService.ts
│   ├── middleware/
│   │   ├── rateLimiter.ts
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── cors.ts
│   ├── routes/
│   │   ├── paymentRoutes.ts
│   │   └── uexRoutes.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── security.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── config.ts
│   └── index.ts
├── migrations/
│   ├── 001_create_seller_payout_accounts.js
│   ├── 002_create_payment_transactions.js
│   ├── ...
│   └── 009_add_uex_fields.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Client Layer                        │
│  (Web App, Mobile App, Third-party Integrations)     │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS/JSON
                    ▼
┌──────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer              │
│           (Rate Limiting, SSL Termination)            │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│              Application Server (Node.js)             │
│  ┌────────────────────────────────────────────────┐  │
│  │         Controllers & Routes                   │  │
│  │  - PaymentController                           │  │
│  │  - UEXWebhookController                        │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                   │
│  ┌────────────────┴───────────────────────────────┐  │
│  │            Service Layer                       │  │
│  │  - PaymentProcessingService                    │  │
│  │  - ExchangeRateService                         │  │
│  │  - UEXService                                  │  │
│  │  - DatabaseService                             │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                   │
│  ┌────────────────┴───────────────────────────────┐  │
│  │         Background Workers                     │  │
│  │  - UEXPollingService (cron)                    │  │
│  └────────────────────────────────────────────────┘  │
└───────────────────┬──────────────────────────────────┘
                    │
      ┌─────────────┴─────────────┬────────────────────┐
      │                           │                    │
      ▼                           ▼                    ▼
┌───────────┐            ┌────────────────┐   ┌───────────────┐
│PostgreSQL │            │   UEX APIs     │   │   Cache       │
│ Database  │            │ (uexswap.com)  │   │ (node-cache)  │
└───────────┘            └────────────────┘   └───────────────┘
```

### 5.2 Data Flow Architecture

**Payment Processing Flow**:
```
1. Client Request → API Gateway
2. API Gateway → PaymentController
3. PaymentController → PaymentProcessingService
4. PaymentProcessingService → ExchangeRateService → UEXService → UEX API
5. PaymentProcessingService → DatabaseService → PostgreSQL
6. PaymentProcessingService → UEXService → UEX Swap API
7. Response with deposit address ← Client
8. Customer sends crypto to deposit address
9. UEX detects deposit and processes swap
10. UEX → Webhook → UEXWebhookController → DatabaseService
11. DatabaseService updates status → Notification Service → Seller
```

### 5.3 Component Interaction Diagram

```
┌─────────────────┐
│ PaymentController│
└────────┬────────┘
         │
         ▼
┌────────────────────────┐
│PaymentProcessingService│
└───┬────────────────────┘
    │
    ├──► ExchangeRateService ──► UEXService ──► UEX API
    │                                ▲
    ├──► DatabaseService             │
    │         │                      │
    │         ▼                      │
    │    PostgreSQL                  │
    │                                │
    └──► UEXService ─────────────────┘
              │
              ▼
         UEX Swap API
```

### 5.4 Deployment Architecture

**Development Environment**:
- Single server instance
- Local PostgreSQL
- No load balancer
- Direct HTTP access

**Staging Environment**:
- 2 server instances
- Shared PostgreSQL (managed)
- Load balancer
- HTTPS with staging cert

**Production Environment**:
- 3+ server instances (auto-scaling)
- PostgreSQL cluster (primary + replicas)
- Load balancer with SSL termination
- CDN for static assets
- Monitoring and alerting
- Backup and disaster recovery

---

## 6. API Specifications

### 6.1 Internal REST API Endpoints

#### 6.1.1 Process Payment

**Endpoint**: `POST /api/payments/process`

**Description**: Initiates a new payment transaction with optional crypto conversion

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token}" // Optional
}
```

**Request Body**:
```json
{
  "client_id": "string (required)",
  "seller_id": "string (required)",
  "amount": "number (required, min: 0.01)",
  "client_currency": "string (required, e.g., 'USD', 'BTC')",
  "seller_currency": "string (required, e.g., 'USD', 'ETH')",
  "payment_method": "string (required, enum: ['credit_card', 'bank_transfer', 'crypto'])",
  "settlement_method": "string (optional, enum: ['blockchain', 'bank'])",
  "recipient_wallet_address": "string (optional, required if settlement_method='blockchain')",
  "description": "string (optional, max: 500 chars)"
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "status": "pending",
    "client_amount": 100.00,
    "seller_amount": 98.50,
    "exchange_rate": 0.000023,
    "fees": {
      "uex_buyer_fee": 0.10,
      "uex_seller_fee": 0.10,
      "conversion_fee": 0.20,
      "management_fee": 1.00,
      "total_fees": 1.40
    },
    "uex_order_id": "UEX-1234567890",
    "deposit_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?data=...",
    "estimated_completion": "2025-10-22T12:45:00Z",
    "created_at": "2025-10-22T12:15:00Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CURRENCY_PAIR",
    "message": "Currency pair BTC/XYZ is not supported",
    "details": {
      "supported_currencies": ["BTC", "ETH", "USDT", "..."]
    }
  }
}
```

**Error Codes**:
- `INVALID_REQUEST`: Missing or invalid parameters
- `INVALID_CURRENCY_PAIR`: Currency pair not supported
- `AMOUNT_TOO_LOW`: Amount below minimum limit
- `AMOUNT_TOO_HIGH`: Amount exceeds maximum limit
- `UEX_API_ERROR`: UEX API returned an error
- `DATABASE_ERROR`: Database operation failed

---

#### 6.1.2 Get Transaction Status

**Endpoint**: `GET /api/payments/transaction/:id/status`

**Description**: Retrieves current status of a transaction

**Path Parameters**:
- `id` (string, required): Transaction UUID

**Query Parameters**:
- `refresh` (boolean, optional): Force refresh from UEX API (default: false)

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "status": "completed",
    "uex_status": "Complete",
    "uex_order_id": "UEX-1234567890",
    "client_amount": 100.00,
    "seller_amount": 98.50,
    "client_currency": "USD",
    "seller_currency": "BTC",
    "created_at": "2025-10-22T12:15:00Z",
    "updated_at": "2025-10-22T12:30:00Z",
    "completed_at": "2025-10-22T12:30:00Z",
    "timeline": [
      {"status": "pending", "timestamp": "2025-10-22T12:15:00Z"},
      {"status": "processing", "timestamp": "2025-10-22T12:20:00Z"},
      {"status": "completed", "timestamp": "2025-10-22T12:30:00Z"}
    ]
  }
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction with ID {id} not found"
  }
}
```

---

#### 6.1.3 List Transactions

**Endpoint**: `GET /api/payments/transactions`

**Description**: Retrieves list of transactions with filtering

**Query Parameters**:
- `status` (string, optional): Filter by status (pending, processing, completed, failed, cancelled)
- `client_id` (string, optional): Filter by client ID
- `seller_id` (string, optional): Filter by seller ID
- `currency` (string, optional): Filter by currency code
- `from_date` (string, optional): ISO 8601 date (e.g., 2025-01-01)
- `to_date` (string, optional): ISO 8601 date
- `limit` (number, optional): Max results (default: 50, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "uuid",
        "status": "completed",
        "client_amount": 100.00,
        "seller_amount": 98.50,
        "client_currency": "USD",
        "seller_currency": "BTC",
        "created_at": "2025-10-22T12:15:00Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

#### 6.1.4 Get Exchange Rate

**Endpoint**: `GET /api/exchange-rates/estimate`

**Description**: Retrieves exchange rate estimate for currency pair

**Query Parameters**:
- `from_currency` (string, required): Source currency code
- `to_currency` (string, required): Target currency code
- `amount` (number, required): Amount to convert

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "from_currency": "BTC",
    "to_currency": "USDT",
    "from_amount": 0.5,
    "to_amount": 21500.00,
    "exchange_rate": 43000.00,
    "fees": {
      "uex_buyer_fee": 21.50,
      "uex_seller_fee": 21.50,
      "total_fees": 43.00
    },
    "limits": {
      "min_amount": 0.001,
      "max_amount": 10.0
    },
    "valid_until": "2025-10-22T12:20:00Z",
    "cached": false
  }
}
```

---

#### 6.1.5 Get Supported Currencies

**Endpoint**: `GET /api/exchange-rates/currencies`

**Description**: Retrieves list of all supported cryptocurrencies

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "code": "BTC",
        "name": "Bitcoin",
        "type": "crypto",
        "networks": ["Bitcoin"],
        "min_amount": 0.001,
        "max_amount": 100.0
      },
      {
        "code": "ETH",
        "name": "Ethereum",
        "type": "crypto",
        "networks": ["Ethereum"],
        "min_amount": 0.01,
        "max_amount": 1000.0
      }
    ],
    "total": 52,
    "cached_at": "2025-10-22T12:00:00Z"
  }
}
```

---

#### 6.1.6 Webhook Endpoint (UEX Status Updates)

**Endpoint**: `POST /api/uex/webhook/order-status`

**Description**: Receives order status updates from UEX

**Request Body**:
```json
{
  "order_id": "UEX-1234567890",
  "status": "Complete",
  "from_currency": "BTC",
  "to_currency": "USDT",
  "from_amount": 0.5,
  "to_amount": 21500.00,
  "timestamp": "2025-10-22T12:30:00Z"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

---

### 6.2 External API Integration (UEX)

#### 6.2.1 UEX Swap API Base URL
```
https://api.uexswap.com
```

#### 6.2.2 Get Supported Currencies

**Endpoint**: `GET /api/partners/get-currencies`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Response**:
```json
{
  "Cardano Tokens": [
    {"ticker": "ADA", "name": "Cardano"},
    {"ticker": "USDC", "name": "USD Coin"}
  ],
  "Currencies": [
    {"ticker": "BTC", "name": "Bitcoin", "network": "Bitcoin"},
    {"ticker": "ETH", "name": "Ethereum", "network": "Ethereum"}
  ]
}
```

---

#### 6.2.3 Get Exchange Rate Estimate

**Endpoint**: `POST /api/partners/estimate`

**Request Body**:
```json
{
  "from_currency": "BTC",
  "to_currency": "USDT",
  "amount": "0.5",
  "referral_code": "YOUR_REFERRAL_CODE"
}
```

**Response**:
```json
{
  "rate": 43000.00,
  "to_amount": 21500.00,
  "buyer_fee": 21.50,
  "seller_fee": 21.50,
  "min_amount": 0.001,
  "max_amount": 10.0
}
```

---

#### 6.2.4 Initiate Crypto-to-Crypto Swap

**Endpoint**: `POST /api/partners/swap/initiate-crypto-to-crypto`

**Request Body**:
```json
{
  "from_currency": "BTC",
  "to_currency": "USDT",
  "amount": "0.5",
  "to_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "referral_code": "YOUR_REFERRAL_CODE",
  "webhook_url": "https://yourdomain.com/api/uex/webhook/order-status"
}
```

**Response**:
```json
{
  "order_id": "UEX-1234567890",
  "deposit_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "status": "Awaiting Deposit",
  "expires_at": "2025-10-22T13:15:00Z"
}
```

---

#### 6.2.5 Get Order Status

**Endpoint**: `POST /api/partners/order-show`

**Request Body**:
```json
{
  "order_id": "UEX-1234567890"
}
```

**Response**:
```json
{
  "order_id": "UEX-1234567890",
  "status": "Complete",
  "from_currency": "BTC",
  "to_currency": "USDT",
  "from_amount": "0.5",
  "to_amount": "21500.00",
  "created_at": "2025-10-22T12:15:00Z",
  "completed_at": "2025-10-22T12:30:00Z"
}
```

---

#### 6.2.6 UEX Merchant API - Get OAuth Token

**Base URL**: `https://uex.us`

**Endpoint**: `POST /api/merchant/oauth2/token`

**Request Body**:
```json
{
  "grant_type": "client_credentials",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### 6.2.7 Generate Payment Link

**Endpoint**: `POST /api/merchant/generate-payment-url`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "order_id": "ORDER-12345",
  "item_name": "Product Purchase",
  "amount": "100.00",
  "currency": "USD",
  "success_url": "https://yourdomain.com/payment/success",
  "failure_url": "https://yourdomain.com/payment/failure"
}
```

**Response**:
```json
{
  "payment_url": "https://uex.us/checkout/abc123def456",
  "expires_at": "2025-10-22T13:15:00Z"
}
```

---

## 7. Database Requirements

### 7.1 Database Technology

**RDBMS**: PostgreSQL 13+

**Rationale**:
- ACID compliance for financial transactions
- JSON/JSONB support for flexible metadata
- Strong consistency and reliability
- Excellent performance for transactional workloads
- Rich ecosystem and tooling

### 7.2 Schema Definitions

#### 7.2.1 payment_transactions Table

```sql
CREATE TABLE payment_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  seller_id VARCHAR(255) NOT NULL,
  client_amount DECIMAL(20, 8) NOT NULL,
  seller_amount DECIMAL(20, 8) NOT NULL,
  client_currency VARCHAR(10) NOT NULL,
  seller_currency VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(20, 8),
  
  -- Fee breakdown
  uex_buyer_fee DECIMAL(20, 8) DEFAULT 0,
  uex_seller_fee DECIMAL(20, 8) DEFAULT 0,
  conversion_fee DECIMAL(20, 8) DEFAULT 0,
  management_fee DECIMAL(20, 8) DEFAULT 0,
  total_fee DECIMAL(20, 8) DEFAULT 0,
  
  -- Payment information
  payment_method VARCHAR(50) NOT NULL,
  settlement_method VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- UEX integration fields
  uex_order_id VARCHAR(255),
  uex_deposit_address TEXT,
  uex_status VARCHAR(100),
  uex_raw_response JSONB,
  uex_webhook_data JSONB,
  
  -- Metadata
  description TEXT,
  recipient_wallet_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT chk_payment_method CHECK (payment_method IN ('credit_card', 'bank_transfer', 'crypto'))
);

CREATE INDEX idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX idx_payment_transactions_seller_id ON payment_transactions(seller_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_uex_order_id ON payment_transactions(uex_order_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_client_currency ON payment_transactions(client_currency);
CREATE INDEX idx_payment_transactions_seller_currency ON payment_transactions(seller_currency);
```

---

#### 7.2.2 currency_conversions Table

```sql
CREATE TABLE currency_conversions (
  conversion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(transaction_id) ON DELETE CASCADE,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  from_amount DECIMAL(20, 8) NOT NULL,
  to_amount DECIMAL(20, 8) NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  conversion_fee DECIMAL(20, 8) DEFAULT 0,
  provider VARCHAR(50) DEFAULT 'UEX',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_currency_conversions_transaction_id ON currency_conversions(transaction_id);
CREATE INDEX idx_currency_conversions_created_at ON currency_conversions(created_at DESC);
```

---

#### 7.2.3 exchange_rates Table

```sql
CREATE TABLE exchange_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'UEX',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(from_currency, to_currency, valid_from)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_valid_until ON exchange_rates(valid_until);
```

---

#### 7.2.4 seller_payout_accounts Table (Existing - Enhanced)

```sql
ALTER TABLE seller_payout_accounts ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT;
ALTER TABLE seller_payout_accounts ADD COLUMN IF NOT EXISTS preferred_crypto_currency VARCHAR(10);
ALTER TABLE seller_payout_accounts ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'bank_transfer';

CREATE INDEX idx_seller_payout_accounts_seller_id ON seller_payout_accounts(seller_id);
```

---

#### 7.2.5 uex_order_tracking Table

```sql
CREATE TABLE uex_order_tracking (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uex_order_id VARCHAR(255) NOT NULL UNIQUE,
  transaction_id UUID REFERENCES payment_transactions(transaction_id) ON DELETE SET NULL,
  status VARCHAR(100) NOT NULL,
  status_history JSONB DEFAULT '[]'::jsonb,
  last_polled_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uex_order_tracking_order_id ON uex_order_tracking(uex_order_id);
CREATE INDEX idx_uex_order_tracking_transaction_id ON uex_order_tracking(transaction_id);
CREATE INDEX idx_uex_order_tracking_status ON uex_order_tracking(status);
```

---

#### 7.2.6 referral_earnings Table

```sql
CREATE TABLE referral_earnings (
  earning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions(transaction_id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  commission_percentage DECIMAL(5, 4) DEFAULT 0.0019,
  commission_amount DECIMAL(20, 8),
  bonus_ada DECIMAL(20, 8) DEFAULT 0,
  currency VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_earnings_transaction_id ON referral_earnings(transaction_id);
CREATE INDEX idx_referral_earnings_referral_code ON referral_earnings(referral_code);
```

---

### 7.3 Database Relationships

```
payment_transactions (1) ──< (Many) currency_conversions
payment_transactions (1) ──< (Many) referral_earnings
payment_transactions (1) ──< (1) uex_order_tracking
seller_payout_accounts (1) ──< (Many) payment_transactions (via seller_id)
```

### 7.4 Data Retention Policy

| Table | Retention Period | Archive Strategy |
|-------|-----------------|------------------|
| payment_transactions | 7 years | Cold storage after 2 years |
| currency_conversions | 7 years | Cold storage after 2 years |
| exchange_rates | 1 year | Delete after expiration |
| uex_order_tracking | 1 year | Delete after completion + 1 year |
| referral_earnings | Permanent | Archive after 5 years |

### 7.5 Backup Requirements

- **Full Backup**: Daily at 2:00 AM UTC
- **Incremental Backup**: Every 6 hours
- **Transaction Log Backup**: Every 15 minutes
- **Backup Retention**: 30 days online, 1 year offline
- **Recovery Point Objective (RPO)**: 15 minutes
- **Recovery Time Objective (RTO)**: 1 hour

### 7.6 Database Performance Tuning

**Connection Pooling**:
```javascript
{
  min: 10,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
}
```

**Query Optimization**:
- Use prepared statements for all queries
- Implement query result caching
- Create composite indexes for common filter combinations
- Use EXPLAIN ANALYZE for slow queries
- Set up query monitoring and alerting

---

## 8. Security Requirements

### 8.1 Authentication & Authorization

**SR-001: API Authentication**
- **Requirement**: All internal API endpoints must require authentication
- **Implementation**: JWT (JSON Web Tokens) with RS256 algorithm
- **Token Expiration**: 1 hour for access tokens, 30 days for refresh tokens
- **Token Storage**: HTTPOnly cookies for web, secure storage for mobile

**SR-002: UEX API Authentication**
- **Requirement**: Secure storage and rotation of UEX API credentials
- **Implementation**: 
  - Store credentials in environment variables
  - Use OAuth2 for merchant API access
  - Rotate credentials every 90 days
  - Never log credentials in plain text

**SR-003: Role-Based Access Control (RBAC)**
- **Roles**:
  - `admin`: Full access to all endpoints
  - `seller`: Access to own transactions and payouts
  - `customer`: Access to own payment history
  - `system`: Internal service-to-service communication
- **Implementation**: JWT claims with role verification middleware

### 8.2 Data Protection

**SR-004: Encryption at Rest**
- **Database Encryption**: PostgreSQL Transparent Data Encryption (TDE)
- **Sensitive Fields**: Encrypt wallet addresses, API keys, personal information
- **Algorithm**: AES-256-GCM
- **Key Management**: AWS KMS or HashiCorp Vault

**SR-005: Encryption in Transit**
- **Protocol**: TLS 1.3 minimum
- **Certificate**: Valid SSL/TLS certificate from trusted CA
- **HSTS**: Enforce HTTPS with HSTS header
- **Configuration**:
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```

**SR-006: Data Masking**
- **Sensitive Data**: Mask wallet addresses, transaction IDs in logs
- **Format**: Show first 6 and last 4 characters (e.g., `1A1zP1...DivfNa`)
- **Logs**: Never log full wallet addresses, private keys, API secrets

### 8.3 API Security

**SR-007: Rate Limiting**
- **General API**: 100 requests per 15 minutes per IP
- **Payment API**: 10 requests per minute per user
- **Webhook API**: 60 requests per minute per IP
- **Implementation**: Express rate limit middleware with Redis backend

**SR-008: Input Validation**
- **Validation Rules**:
  - Sanitize all user inputs
  - Validate data types, ranges, formats
  - Reject requests with invalid data
- **Protection Against**:
  - SQL Injection
  - XSS (Cross-Site Scripting)
  - Command Injection
  - Path Traversal

**SR-009: CORS Policy**
- **Allowed Origins**: Whitelist of trusted domains
- **Allowed Methods**: GET, POST, PUT, DELETE
- **Allowed Headers**: Authorization, Content-Type
- **Credentials**: Allow credentials for authenticated requests

**SR-010: Request Signing (Webhooks)**
- **Requirement**: Verify webhook authenticity
- **Implementation**: HMAC-SHA256 signature in request header
- **Validation**: Compare computed signature with received signature

### 8.4 Secure Coding Practices

**SR-011: Dependency Management**
- **Requirement**: Keep dependencies up-to-date and secure
- **Tools**: npm audit, Snyk, Dependabot
- **Policy**: Update within 7 days for critical vulnerabilities

**SR-012: Error Handling**
- **Requirement**: Never expose sensitive information in errors
- **Implementation**:
  - Generic error messages for clients
  - Detailed errors logged server-side only
  - Error codes instead of stack traces

**SR-013: Logging & Monitoring**
- **Requirements**:
  - Log all authentication attempts
  - Log all payment transactions
  - Log all API errors
  - Never log sensitive data (passwords, API keys, full wallet addresses)
- **Tools**: Winston, Sentry, CloudWatch

### 8.5 Compliance Requirements

**SR-014: PCI DSS Compliance** (if handling credit cards)
- **Requirement**: Maintain PCI DSS Level 1 compliance
- **Implementation**: Use tokenization, never store CVV

**SR-015: GDPR Compliance** (if serving EU users)
- **Requirements**:
  - Data subject rights (access, deletion, portability)
  - Privacy by design
  - Data breach notification (72 hours)
- **Implementation**: Privacy policy, consent management, data export API

**SR-016: AML/KYC Compliance**
- **Requirement**: Comply with anti-money laundering regulations
- **Implementation**: UEX handles KYC, platform operator must be verified

### 8.6 Incident Response

**SR-017: Security Incident Response Plan**
- **Detection**: Automated alerts for suspicious activities
- **Response Steps**:
  1. Identify and contain the incident
  2. Assess the impact
  3. Notify affected parties within 24 hours
  4. Remediate vulnerabilities
  5. Document lessons learned
- **Communication**: Designated security officer, escalation procedures

---

## 9. Performance Requirements

### 9.1 Service Level Objectives (SLOs)

**PR-001: System Availability**
- **Target**: 99.9% uptime (43.8 minutes downtime per month)
- **Measurement**: Uptime monitoring across all endpoints
- **Exclusions**: Planned maintenance windows

**PR-002: API Response Times**

| Endpoint Type | Target (P95) | Maximum (P99) |
|--------------|--------------|---------------|
| GET requests | 200ms | 500ms |
| POST /api/payments/process | 2s | 5s |
| GET /api/payments/transaction/:id | 300ms | 800ms |
| Webhook endpoints | 500ms | 1s |
| Database queries | 100ms | 300ms |
| External API calls (UEX) | 2s | 5s |

**PR-003: Database Performance**
- **Query Execution**: 95% of queries complete in <100ms
- **Connection Pool**: Maintain 10-50 active connections
- **Transaction Throughput**: Support 100 transactions per second

### 9.2 Throughput Requirements

**PR-004: Transaction Volume**
- **Current**: 100 transactions per day
- **6 Months**: 500 transactions per day
- **12 Months**: 2,000 transactions per day
- **Peak Load**: 5x average daily volume

**PR-005: Concurrent Users**
- **Average**: 50 concurrent users
- **Peak**: 500 concurrent users
- **Support**: System must handle 10x current load without degradation

### 9.3 Scalability Requirements

**PR-006: Horizontal Scaling**
- **Capability**: Add application servers without code changes
- **Implementation**: Stateless application design
- **Auto-scaling**: Scale up at 70% CPU/memory, scale down at 30%

**PR-007: Database Scaling**
- **Read Replicas**: Support 3+ read replicas for query distribution
- **Partitioning**: Implement table partitioning for tables >10M rows
- **Sharding**: Design to support sharding if needed (future)

**PR-008: Caching Strategy**
- **Exchange Rates**: Cache for 1 minute
- **Currency List**: Cache for 1 hour
- **Transaction Status**: Cache for 5 seconds
- **Implementation**: In-memory cache (node-cache) with fallback to Redis

### 9.4 Resource Utilization

**PR-009: Server Resources**
- **CPU**: Average <50%, peak <80%
- **Memory**: Average <60%, peak <85%
- **Disk I/O**: <70% utilization
- **Network**: <80% bandwidth utilization

**PR-010: Database Resources**
- **Storage**: Plan for 20% growth per month
- **CPU**: Average <60%, peak <85%
- **Memory**: Maintain 30% free buffer cache
- **Connections**: Use <80% of max connections

### 9.5 Optimization Requirements

**PR-011: Code Optimization**
- **Bundle Size**: <2MB for client-side code
- **API Payload**: <100KB for most responses
- **Compression**: Enable gzip/brotli for responses >1KB

**PR-012: Network Optimization**
- **CDN**: Use CDN for static assets
- **Keep-Alive**: Enable HTTP keep-alive connections
- **Connection Pooling**: Reuse database and HTTP connections

---

## 10. Integration Requirements

### 10.1 UEX API Integration

**IR-001: Swap API Integration**
- **Base URL**: `https://api.uexswap.com`
- **Endpoints**:
  - GET /api/partners/get-currencies
  - POST /api/partners/estimate
  - POST /api/partners/swap/initiate-crypto-to-crypto
  - POST /api/partners/order-show
- **Authentication**: API key in request header (if required)
- **Rate Limits**: Respect UEX rate limits (unknown, implement backoff)
- **Error Handling**: Implement retry logic with exponential backoff

**IR-002: Merchant API Integration**
- **Base URL**: `https://uex.us`
- **Endpoints**:
  - POST /api/merchant/oauth2/token
  - POST /api/merchant/generate-payment-url
- **Authentication**: OAuth2 client credentials flow
- **Token Management**: Refresh tokens before expiration

**IR-003: Webhook Integration**
- **Endpoint**: `POST /api/uex/webhook/order-status`
- **Security**: Verify webhook signatures (if provided by UEX)
- **Retry Logic**: Return 200 OK to prevent UEX retries
- **Processing**: Asynchronous processing to respond quickly

### 10.2 Third-Party Services

**IR-004: Email Service**
- **Provider**: SendGrid, Amazon SES, or similar
- **Use Cases**:
  - Transaction confirmation emails
  - Payment status updates
  - Failed transaction alerts
- **Requirements**: Template support, analytics, deliverability >98%

**IR-005: Notification Service**
- **Provider**: Firebase Cloud Messaging, Twilio, or similar
- **Use Cases**:
  - Real-time payment status updates
  - Push notifications for mobile apps
  - SMS alerts for high-value transactions

**IR-006: Monitoring & Logging**
- **APM**: DataDog, New Relic, or similar
- **Logging**: ELK Stack, CloudWatch, or similar
- **Error Tracking**: Sentry, Rollbar, or similar
- **Requirements**: Real-time alerts, log retention 90 days

**IR-007: QR Code Generation**
- **Service**: QR Server API or self-hosted library
- **Endpoint**: `https://api.qrserver.com/v1/create-qr-code/`
- **Use Case**: Generate QR codes for deposit addresses
- **Fallback**: Local QR code generation library

### 10.3 Internal System Integration

**IR-008: Existing Payment System**
- **Components**:
  - PaymentController (enhanced)
  - ExchangeRateService (enhanced)
  - PaymentProcessingService (enhanced)
  - DatabaseService (enhanced)
- **Changes**: Add UEX-specific logic without breaking existing functionality
- **Backward Compatibility**: Maintain support for non-crypto payments

**IR-009: Seller Payout System**
- **Integration Point**: Update seller payout logic to handle crypto conversions
- **Requirements**: 
  - Support crypto-to-fiat conversion
  - Track UEX order IDs for reconciliation
  - Calculate fees accurately

**IR-010: Reporting System**
- **Integration**: Feed transaction data to existing reporting dashboards
- **Requirements**:
  - Real-time transaction counts
  - Revenue tracking (including referral commissions)
  - Currency distribution metrics

### 10.4 Development & Deployment Tools

**IR-011: Version Control**
- **System**: Git (GitHub, GitLab, or Bitbucket)
- **Branching Strategy**: GitFlow (main, develop, feature branches)
- **Code Review**: Required for all PRs before merge

**IR-012: CI/CD Pipeline**
- **Tools**: GitHub Actions, Jenkins, or GitLab CI
- **Stages**:
  1. Lint and format check
  2. Unit tests
  3. Integration tests
  4. Build Docker image
  5. Deploy to staging
  6. Run E2E tests
  7. Deploy to production (manual approval)

**IR-013: Infrastructure as Code**
- **Tool**: Terraform, CloudFormation, or Pulumi
- **Resources**: Define all infrastructure in code
- **Version Control**: Track infrastructure changes in Git

---

## 11. Testing Requirements

### 11.1 Unit Testing

**TR-001: Code Coverage**
- **Target**: 80% minimum code coverage
- **Priority Areas**: 
  - UEXService: 90% coverage
  - PaymentProcessingService: 90% coverage
  - Fee calculations: 100% coverage
- **Tools**: Jest, Istanbul/nyc
- **Execution**: Run on every commit

**TR-002: Unit Test Cases**
- **Service Layer**:
  - Test all public methods
  - Mock external dependencies (UEX API, database)
  - Test error scenarios
  - Test edge cases (min/max amounts, unsupported currencies)
- **Controller Layer**:
  - Test request validation
  - Test response formatting
  - Test error handling

### 11.2 Integration Testing

**TR-003: API Integration Tests**
- **Coverage**: All REST endpoints
- **Test Cases**:
  - Happy path scenarios
  - Error scenarios (invalid input, API failures)
  - Authentication and authorization
  - Rate limiting
- **Tools**: Jest + Supertest
- **Environment**: Dedicated test database

**TR-004: Database Integration Tests**
- **Test Cases**:
  - CRUD operations
  - Transaction integrity (rollback on error)
  - Constraint validation
  - Index performance
- **Setup**: Use test database with seed data
- **Cleanup**: Reset database after each test suite

**TR-005: UEX API Integration Tests**
- **Strategy**: Use UEX sandbox/test environment
- **Test Cases**:
  - Currency list retrieval
  - Exchange rate estimation
  - Swap initiation
  - Order status polling
  - Webhook handling
- **Mocking**: Mock UEX responses for CI/CD pipeline

### 11.3 End-to-End Testing

**TR-006: E2E Test Scenarios**
- **Scenario 1**: Complete crypto payment flow
  1. User initiates payment (BTC → USD)
  2. System fetches exchange rate
  3. System initiates UEX swap
  4. User "sends" crypto (simulated)
  5. Webhook updates status
  6. Seller receives payout
- **Scenario 2**: Failed transaction handling
  1. Initiate payment with unsupported currency
  2. Verify error response
  3. Verify database rollback
- **Scenario 3**: Status tracking
  1. Create pending transaction
  2. Poll status endpoint
  3. Verify status updates

**TR-007: E2E Testing Tools**
- **API Testing**: Postman/Newman, REST Client
- **Browser Testing** (if UI exists): Playwright, Cypress
- **Environment**: Staging environment with test data

### 11.4 Performance Testing

**TR-008: Load Testing**
- **Tool**: Apache JMeter, k6, or Artillery
- **Scenarios**:
  - Simulate 100 concurrent users
  - Ramp up to 500 concurrent users
  - Sustained load for 30 minutes
- **Metrics**:
  - Response times (P50, P95, P99)
  - Throughput (requests per second)
  - Error rate (<1%)
  - Resource utilization

**TR-009: Stress Testing**
- **Objective**: Identify breaking point
- **Approach**: Gradually increase load until system degrades
- **Metrics**: Maximum sustainable load, failure modes

**TR-010: Spike Testing**
- **Objective**: Test system behavior under sudden load spikes
- **Scenario**: Increase from 10 to 500 concurrent users instantly
- **Expected**: System handles spike gracefully, no crashes

### 11.5 Security Testing

**TR-011: Penetration Testing**
- **Frequency**: Annually or after major releases
- **Scope**: All public-facing endpoints
- **Test Cases**:
  - SQL injection attempts
  - XSS attacks
  - Authentication bypass
  - Rate limit bypass
  - CSRF attacks
- **Tools**: OWASP ZAP, Burp Suite

**TR-012: Vulnerability Scanning**
- **Frequency**: Weekly
- **Scope**: Application dependencies
- **Tools**: npm audit, Snyk, Dependabot
- **Action**: Fix critical vulnerabilities within 7 days

### 11.6 User Acceptance Testing (UAT)

**TR-013: UAT Scenarios**
- **Participants**: Product team, select users
- **Environment**: Staging with production-like data
- **Test Cases**:
  - Customer makes crypto payment
  - Seller receives fiat payout
  - Admin monitors transactions
  - Error scenarios (failed payments)
- **Success Criteria**: 95% task completion rate, positive feedback

### 11.7 Test Automation

**TR-014: Automated Test Execution**
- **Unit Tests**: Run on every commit
- **Integration Tests**: Run on every PR
- **E2E Tests**: Run on every deployment to staging
- **Performance Tests**: Run weekly and before major releases
- **CI/CD Integration**: Block deployments if tests fail

**TR-015: Test Reporting**
- **Metrics**: Test pass rate, coverage, execution time
- **Dashboard**: Real-time test results in CI/CD dashboard
- **Notifications**: Alert team on test failures

---

## 12. Deployment Requirements

### 12.1 Deployment Environments

**DR-001: Development Environment**
- **Purpose**: Local development and testing
- **Infrastructure**:
  - Local Node.js runtime
  - Local PostgreSQL instance
  - Mock UEX API responses
- **Configuration**: .env.development
- **Access**: Developer laptops only

**DR-002: Staging Environment**
- **Purpose**: Pre-production testing, UAT
- **Infrastructure**:
  - 2 application servers (auto-scaling)
  - Managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
  - UEX sandbox environment
  - Load balancer
- **Configuration**: .env.staging
- **Access**: Development team, QA team, select stakeholders

**DR-003: Production Environment**
- **Purpose**: Live system serving real users
- **Infrastructure**:
  - 3+ application servers (auto-scaling)
  - PostgreSQL cluster (primary + 2 replicas)
  - UEX production API
  - Load balancer with SSL termination
  - CDN for static assets
  - Monitoring and alerting
- **Configuration**: .env.production (encrypted)
- **Access**: Operations team only, restricted access

### 12.2 Infrastructure Requirements

**DR-004: Server Specifications**

| Environment | CPU | Memory | Storage | Instances |
|-------------|-----|--------|---------|----------|
| Development | 2 cores | 4GB | 20GB | 1 |
| Staging | 4 cores | 8GB | 50GB | 2 |
| Production | 8 cores | 16GB | 100GB | 3-10 (auto-scale) |

**DR-005: Database Specifications**

| Environment | CPU | Memory | Storage | IOPS | Backup |
|-------------|-----|--------|---------|------|--------|
| Development | 2 cores | 4GB | 20GB | Standard | None |
| Staging | 4 cores | 8GB | 100GB | 3000 | Daily |
| Production | 8 cores | 32GB | 500GB | 10000 | Continuous |

**DR-006: Network Configuration**
- **Firewall Rules**:
  - Allow HTTPS (443) from Internet
  - Allow HTTP (80) redirect to HTTPS
  - Allow PostgreSQL (5432) from app servers only
  - Block all other inbound traffic
- **Security Groups**: Separate groups for app, database, load balancer
- **VPC**: All resources in private VPC, only load balancer public

### 12.3 Containerization & Orchestration

**DR-007: Docker Configuration**
- **Base Image**: node:16-alpine
- **Multi-stage Build**: Build and production stages
- **Image Size**: <200MB
- **Registry**: Docker Hub, AWS ECR, or private registry

**Dockerfile Example**:
```dockerfile
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**DR-008: Kubernetes Deployment** (Optional)
- **Cluster**: Minimum 3 nodes
- **Deployments**: 
  - API deployment (3 replicas)
  - Polling service deployment (1 replica)
- **Services**: LoadBalancer for API, ClusterIP for database
- **ConfigMaps**: Store non-sensitive configuration
- **Secrets**: Store sensitive credentials (encrypted)
- **Auto-scaling**: HorizontalPodAutoscaler based on CPU/memory

### 12.4 CI/CD Pipeline

**DR-009: Build Pipeline**
1. **Trigger**: Git push to develop/main branch
2. **Steps**:
   - Checkout code
   - Install dependencies
   - Run linter (ESLint)
   - Run unit tests
   - Run integration tests
   - Build TypeScript to JavaScript
   - Build Docker image
   - Tag image with commit SHA and branch
   - Push image to registry
3. **Duration**: <10 minutes
4. **Failure Handling**: Stop pipeline, notify team

**DR-010: Deployment Pipeline**
1. **Trigger**: Successful build + manual approval (production)
2. **Steps**:
   - Pull latest Docker image
   - Run database migrations
   - Deploy to target environment
   - Run smoke tests
   - Health check
   - Notify team on success/failure
3. **Rollback**: Automatic rollback on health check failure
4. **Duration**: <5 minutes

**DR-011: Deployment Strategy**
- **Development**: Direct deployment on push
- **Staging**: Automatic deployment on merge to develop
- **Production**: Blue-green or rolling deployment
  - Deploy to subset of servers
  - Monitor for errors
  - Gradually shift traffic
  - Full rollback capability

### 12.5 Configuration Management

**DR-012: Environment Variables**

**Development (.env.development)**:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/payments_dev
UEX_API_BASE_URL=https://api.uexswap.com
UEX_MERCHANT_API_BASE_URL=https://uex.us
UEX_REFERRAL_CODE=TEST_CODE
UEX_CLIENT_ID=test_client_id
UEX_CLIENT_SECRET=test_client_secret
CACHE_TTL_CURRENCIES=3600
CACHE_TTL_RATES=60
POLLING_INTERVAL=300000
LOG_LEVEL=debug
```

**Production (.env.production)**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<encrypted>
UEX_API_BASE_URL=https://api.uexswap.com
UEX_MERCHANT_API_BASE_URL=https://uex.us
UEX_REFERRAL_CODE=<encrypted>
UEX_CLIENT_ID=<encrypted>
UEX_CLIENT_SECRET=<encrypted>
CACHE_TTL_CURRENCIES=3600
CACHE_TTL_RATES=60
POLLING_INTERVAL=300000
LOG_LEVEL=info
SENTRY_DSN=<encrypted>
```

**DR-013: Secrets Management**
- **Tool**: AWS Secrets Manager, HashiCorp Vault, or similar
- **Access**: Application retrieves secrets at startup
- **Rotation**: Automatic rotation every 90 days
- **Encryption**: AES-256 encryption at rest

### 12.6 Database Migrations

**DR-014: Migration Strategy**
- **Tool**: Knex.js migrations
- **Process**:
  1. Write migration scripts
  2. Test in development
  3. Test in staging
  4. Review and approve
  5. Run in production during maintenance window
- **Rollback**: Every migration has a down() function
- **Versioning**: Sequential versioning (001, 002, 003...)

**DR-015: Migration Execution**
- **Timing**: During deployment, before application starts
- **Automation**: Automated via CI/CD pipeline
- **Validation**: Check schema after migration
- **Backup**: Full database backup before migration

### 12.7 Monitoring & Alerting

**DR-016: Health Checks**
- **Endpoint**: GET /health
- **Checks**:
  - Application status
  - Database connectivity
  - UEX API reachability
  - Cache service status
- **Frequency**: Every 30 seconds
- **Action**: Auto-restart on failure

**DR-017: Application Monitoring**
- **Metrics**:
  - Request rate, response time, error rate
  - CPU, memory, disk usage
  - Database query performance
  - UEX API call success rate
- **Tools**: DataDog, New Relic, Prometheus + Grafana
- **Dashboards**: Real-time metrics visualization

**DR-018: Alerting Rules**
- **Critical Alerts** (Immediate notification):
  - Application down
  - Database unreachable
  - Error rate >5%
  - Response time P95 >5s
- **Warning Alerts** (Review within 1 hour):
  - CPU usage >80%
  - Memory usage >85%
  - Disk usage >80%
  - UEX API error rate >10%
- **Notification Channels**: Slack, Email, PagerDuty

### 12.8 Logging

**DR-019: Log Aggregation**
- **Tool**: ELK Stack, CloudWatch Logs, or Datadog
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Structured Logging**: JSON format with context
- **Retention**: 90 days online, 1 year archived

**DR-020: Log Content**
- **Always Log**:
  - All API requests (method, path, status, duration)
  - All payment transactions
  - All UEX API calls
  - All errors with stack traces
- **Never Log**:
  - API secrets, passwords
  - Full wallet addresses (mask them)
  - Credit card numbers
  - Personal identification information

---

## 13. Acceptance Criteria

### 13.1 Functional Acceptance

**AC-001: Crypto Payment Flow**
- ✅ User can select from 50+ cryptocurrencies
- ✅ System displays accurate exchange rate (<1% deviation from UEX)
- ✅ System generates deposit address within 5 seconds
- ✅ QR code is displayed for deposit address
- ✅ Transaction status updates automatically
- ✅ Seller receives payout after completion
- ✅ All fees are calculated correctly

**AC-002: Exchange Rate Service**
- ✅ Fetches currency list from UEX successfully
- ✅ Returns exchange rate estimate within 2 seconds
- ✅ Caches rates for 1 minute
- ✅ Falls back to cached data if UEX API fails
- ✅ Supports all UEX currency pairs

**AC-003: Order Tracking**
- ✅ Polls UEX API every 5 minutes for pending orders
- ✅ Updates status in database correctly
- ✅ Webhook endpoint processes status updates
- ✅ Status timeline is recorded accurately
- ✅ Notifications sent on status changes

**AC-004: Merchant Payment Links**
- ✅ Generates payment URL successfully
- ✅ OAuth token refreshed before expiration
- ✅ Payment links are valid and functional
- ✅ Success/failure redirects work correctly

### 13.2 Technical Acceptance

**AC-005: API Performance**
- ✅ GET requests respond in <500ms (P95)
- ✅ POST /api/payments/process responds in <5s (P95)
- ✅ Database queries execute in <100ms (P95)
- ✅ System handles 100 concurrent requests
- ✅ No memory leaks after 24 hours of operation

**AC-006: Database**
- ✅ All migrations run successfully
- ✅ Indexes improve query performance
- ✅ Transaction rollback works correctly
- ✅ Data integrity maintained (foreign keys, constraints)
- ✅ Backup and restore tested successfully

**AC-007: Security**
- ✅ All API endpoints require authentication (except public ones)
- ✅ Rate limiting enforced correctly
- ✅ Input validation prevents injection attacks
- ✅ Sensitive data encrypted at rest
- ✅ HTTPS enforced for all connections
- ✅ No sensitive data in logs

**AC-008: Monitoring**
- ✅ Health check endpoint returns correct status
- ✅ Metrics dashboard shows real-time data
- ✅ Alerts triggered for critical issues
- ✅ Logs aggregated and searchable
- ✅ Error tracking captures exceptions

### 13.3 Business Acceptance

**AC-009: Referral Commission**
- ✅ Referral code included in all UEX API calls
- ✅ Commission tracked in database (0.19% + 0.5 ADA for Cardano)
- ✅ Earnings report available for platform owner

**AC-010: Fee Calculation**
- ✅ UEX buyer fee: 0.1% of amount
- ✅ UEX seller fee: 0.1% of amount
- ✅ Conversion fee: 0.2% (if currencies differ)
- ✅ Management fee: 1.0% (0.5% buyer + 0.5% seller)
- ✅ Total fees displayed to user before confirmation

**AC-011: Transaction Reporting**
- ✅ Admin can filter transactions by status, currency, date
- ✅ Export to CSV works correctly
- ✅ Report shows accurate totals and fees
- ✅ Seller payout tracking is accurate

### 13.4 User Experience Acceptance

**AC-012: Usability**
- ✅ API documentation is complete and clear
- ✅ Error messages are user-friendly
- ✅ Response format is consistent (JSON)
- ✅ API follows RESTful conventions

**AC-013: Reliability**
- ✅ System recovers gracefully from UEX API failures
- ✅ Pending transactions are retried automatically
- ✅ No data loss on application restart
- ✅ Failed transactions can be retried manually

### 13.5 Testing Acceptance

**AC-014: Test Coverage**
- ✅ Unit test coverage >80%
- ✅ All critical paths have integration tests
- ✅ E2E tests cover main user flows
- ✅ Load testing validates performance requirements
- ✅ Security testing finds no critical vulnerabilities

**AC-015: Test Automation**
- ✅ Tests run automatically in CI/CD pipeline
- ✅ Failed tests block deployment
- ✅ Test results visible in dashboard
- ✅ Test data is properly cleaned up

### 13.6 Deployment Acceptance

**AC-016: Deployment Process**
- ✅ Deployment to staging is automated
- ✅ Production deployment requires manual approval
- ✅ Rollback can be executed within 5 minutes
- ✅ Zero-downtime deployment achieved
- ✅ Database migrations run successfully

**AC-017: Environment Configuration**
- ✅ All environments have proper configuration
- ✅ Secrets are encrypted and secure
- ✅ Environment variables documented
- ✅ Configuration changes tracked in version control

### 13.7 Documentation Acceptance

**AC-018: Technical Documentation**
- ✅ API documentation complete (all endpoints)
- ✅ Database schema documented
- ✅ Architecture diagrams provided
- ✅ Code comments for complex logic
- ✅ README with setup instructions

**AC-019: Operational Documentation**
- ✅ Deployment runbook created
- ✅ Troubleshooting guide available
- ✅ Monitoring and alerting documented
- ✅ Incident response procedures defined

### 13.8 Launch Readiness

**AC-020: Production Readiness Checklist**
- ✅ All acceptance criteria met
- ✅ Security audit completed
- ✅ Performance testing passed
- ✅ UEX KYC verification completed
- ✅ Referral code activated
- ✅ Monitoring and alerting configured
- ✅ Team trained on new features
- ✅ Support documentation prepared
- ✅ Rollback plan documented
- ✅ Stakeholder sign-off obtained

---

## Appendices

### Appendix A: Glossary

- **ADA**: Cardano cryptocurrency
- **API**: Application Programming Interface
- **BTC**: Bitcoin cryptocurrency
- **ETH**: Ethereum cryptocurrency
- **HMAC**: Hash-based Message Authentication Code
- **JWT**: JSON Web Token
- **KYC**: Know Your Customer
- **OAuth2**: Open Authorization 2.0
- **P95**: 95th percentile
- **QR Code**: Quick Response code
- **REST**: Representational State Transfer
- **RBAC**: Role-Based Access Control
- **SLA**: Service Level Agreement
- **SLO**: Service Level Objective
- **TLS**: Transport Layer Security
- **UEX**: Cryptocurrency exchange platform
- **USDT**: Tether (stablecoin)
- **UUID**: Universally Unique Identifier

### Appendix B: References

1. UEX Swap API Documentation
2. UEX Merchant API Documentation
3. Node.js Best Practices Guide
4. PostgreSQL Performance Tuning Guide
5. OWASP Security Guidelines
6. RESTful API Design Principles

### Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0.0 | 2025-10-22 | Integration Team | Initial release |

---

**Document Status**: ✅ Complete

**Next Steps**:
1. Review with stakeholders
2. Obtain sign-off from technical and business teams
3. Begin implementation following the integration guide
4. Track progress against acceptance criteria

---

*End of Requirements & Specifications Document*
