# UEX API Integration Guide - Part 2

## Step 4: Create Webhook Handler for UEX Status Updates

```typescript
// controllers/UEXWebhookController.ts

import { Request, Response } from 'express';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { UEXService } from '../services/UEXService';
import { DatabaseService } from '../services/DatabaseService';

export class UEXWebhookController {
  private paymentService: PaymentProcessingService;
  private uexService: UEXService;
  private dbService: DatabaseService;

  constructor(
    paymentService: PaymentProcessingService,
    uexService: UEXService,
    dbService: DatabaseService
  ) {
    this.paymentService = paymentService;
    this.uexService = uexService;
    this.dbService = dbService;
  }

  /**
   * Handle UEX order status webhooks
   */
  async handleOrderStatusUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, status, transaction_hash } = req.body;

      if (!order_id || !status) {
        res.status(400).json({
          error: 'Missing required fields: order_id and status'
        });
        return;
      }

      console.log(`Received UEX webhook for order ${order_id}: ${status}`);

      // Find transaction by UEX order ID
      const transaction = await this.dbService.getTransactionByUEXOrderId(order_id);

      if (!transaction) {
        console.warn(`Transaction not found for UEX order ${order_id}`);
        res.status(404).json({
          error: 'Transaction not found',
          order_id: order_id
        });
        return;
      }

      // Map UEX status to your system status
      const mappedStatus = this.uexService.mapOrderStatus(status);

      // Update transaction status
      const metadata: any = {};
      if (transaction_hash) {
        metadata.transaction_hash = transaction_hash;
      }

      await this.paymentService.updateTransactionStatus(
        transaction.id,
        mappedStatus,
        metadata
      );

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        transaction_id: transaction.id,
        new_status: mappedStatus
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Poll UEX for order status (alternative to webhooks)
   */
  async pollOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.params;

      const transaction = await this.paymentService.getTransactionStatus(transaction_id);

      if (!transaction || !transaction.uex_order_id) {
        res.status(404).json({
          error: 'Transaction not found or not associated with UEX order'
        });
        return;
      }

      // Get status from UEX
      const uexStatus = await this.uexService.getOrderStatus(transaction.uex_order_id);
      const mappedStatus = this.uexService.mapOrderStatus(uexStatus.data.external_status);

      // Update if status changed
      if (mappedStatus !== transaction.status) {
        await this.paymentService.updateTransactionStatus(
          transaction_id,
          mappedStatus
        );
      }

      res.status(200).json({
        success: true,
        data: {
          transaction_id: transaction_id,
          uex_order_id: transaction.uex_order_id,
          current_status: mappedStatus,
          uex_status: uexStatus.data.external_status,
          order_details: uexStatus.data.order
        }
      });

    } catch (error) {
      console.error('Poll order status error:', error);
      res.status(500).json({
        error: 'Failed to poll order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

---

## Step 5: Add UEX Routes

```typescript
// routes/uexRoutes.ts

import { Router } from 'express';
import { UEXWebhookController } from '../controllers/UEXWebhookController';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { UEXService } from '../services/UEXService';
import { DatabaseService } from '../services/DatabaseService';
import { ExchangeRateService } from '../services/ExchangeRateService';

const router = Router();

// Initialize services
const dbService = new DatabaseService();
const uexService = new UEXService({
  swapBaseUrl: process.env.UEX_SWAP_BASE_URL || 'https://uexswap.com',
  merchantBaseUrl: process.env.UEX_MERCHANT_BASE_URL || 'https://uex.us',
  referralCode: process.env.UEX_REFERRAL_CODE || '',
  clientId: process.env.UEX_CLIENT_ID,
  secretKey: process.env.UEX_SECRET_KEY
});
const exchangeRateService = new ExchangeRateService(dbService, uexService);
const paymentService = new PaymentProcessingService(dbService, exchangeRateService, uexService);
const webhookController = new UEXWebhookController(paymentService, uexService, dbService);

// Webhook endpoint for UEX status updates
router.post('/webhook/order-status', (req, res) => 
  webhookController.handleOrderStatusUpdate(req, res)
);

// Manual polling endpoint
router.get('/poll/:transaction_id', (req, res) => 
  webhookController.pollOrderStatus(req, res)
);

// Get supported currencies
router.get('/currencies', async (_req, res) => {
  try {
    const currencies = await uexService.getSupportedCurrencies();
    res.status(200).json({
      success: true,
      data: currencies
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch currencies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Estimate conversion
router.post('/estimate', async (req, res) => {
  try {
    const { from_currency, to_currency, amount } = req.body;

    if (!from_currency || !to_currency || !amount) {
      res.status(400).json({
        error: 'Missing required fields: from_currency, to_currency, amount'
      });
      return;
    }

    const fromNetwork = await uexService.getDefaultNetwork(from_currency);
    const toNetwork = await uexService.getDefaultNetwork(to_currency);

    if (!fromNetwork || !toNetwork) {
      res.status(400).json({
        error: 'Unable to determine currency networks'
      });
      return;
    }

    const estimate = await uexService.estimateConversion(
      from_currency,
      fromNetwork,
      to_currency,
      toNetwork,
      amount
    );

    res.status(200).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to estimate conversion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate payment link (merchant API)
router.post('/payment-link', async (req, res) => {
  try {
    const { order_id, item_name, amount, success_url, failure_url } = req.body;

    if (!order_id || !item_name || !amount || !success_url || !failure_url) {
      res.status(400).json({
        error: 'Missing required fields'
      });
      return;
    }

    const paymentLink = await uexService.generatePaymentLink({
      orderId: order_id,
      itemName: item_name,
      amount: amount.toString(),
      successUrl: success_url,
      failureUrl: failure_url
    });

    res.status(200).json({
      success: true,
      data: paymentLink
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate payment link',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

---

## Step 6: Update Main Application

```typescript
// index.ts (Enhanced)

import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';
import uexRoutes from './routes/uexRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/uex', uexRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'UEX-Integrated Payment Processing System',
    version: '2.0.0',
    endpoints: {
      // Payment endpoints
      'POST /api/payments/process': 'Process payment with UEX integration',
      'GET /api/payments/transactions': 'Get all transactions',
      'GET /api/payments/transaction/:id/status': 'Get transaction status',
      'PUT /api/payments/transaction/:id/status': 'Update transaction status',
      
      // UEX endpoints
      'POST /api/uex/webhook/order-status': 'UEX webhook for order status updates',
      'GET /api/uex/poll/:transaction_id': 'Poll UEX order status',
      'GET /api/uex/currencies': 'Get supported currencies from UEX',
      'POST /api/uex/estimate': 'Estimate conversion rate',
      'POST /api/uex/payment-link': 'Generate UEX payment link'
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`🔄 UEX Integration: http://localhost:${PORT}/api/uex`);
});

export default app;
```

---

## Step 7: Database Schema Updates

Add UEX-specific fields to your database:

```javascript
// migrations/009_add_uex_fields.js

exports.up = function(knex) {
  return knex.schema.table('payment_transactions', function(table) {
    table.string('uex_order_id', 50).nullable();
    table.string('deposit_address', 255).nullable();
    table.string('deposit_tag', 100).nullable();
    table.string('qr_code_url', 500).nullable();
    table.index('uex_order_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('payment_transactions', function(table) {
    table.dropColumn('uex_order_id');
    table.dropColumn('deposit_address');
    table.dropColumn('deposit_tag');
    table.dropColumn('qr_code_url');
  });
};
```

Update DatabaseService to include new methods:

```typescript
// Add to DatabaseService.ts

async getTransactionByUEXOrderId(uexOrderId: string): Promise<PaymentTransaction | null> {
  const result = await this.db('payment_transactions')
    .where('uex_order_id', uexOrderId)
    .first();
  
  return result || null;
}

async createPaymentTransactionWithId(
  transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>,
  id: string
): Promise<void> {
  await this.db('payment_transactions').insert({
    id,
    ...transaction,
    created_at: new Date(),
    updated_at: new Date()
  });
}
```

---

## Step 8: Environment Configuration

Create `.env` file:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payment_db

# UEX Configuration
UEX_SWAP_BASE_URL=https://uexswap.com
UEX_MERCHANT_BASE_URL=https://uex.us
UEX_REFERRAL_CODE=your_referral_code_here

# UEX Merchant API (Optional - for payment links)
UEX_CLIENT_ID=your_client_id
UEX_SECRET_KEY=your_secret_key

# Webhook URL (your public endpoint)
WEBHOOK_BASE_URL=https://your-domain.com
```

---

## Step 9: Type Definitions

Update your types file:

```typescript
// types/index.ts (Enhanced)

export interface PaymentRequest {
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  metadata?: {
    recipient_wallet?: string;
    order_id?: string;
    item_name?: string;
    [key: string]: any;
  };
}

export interface PaymentResponse {
  transaction_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate: number;
  fees: {
    uex_buyer_fee: number;
    uex_seller_fee: number;
    conversion_fee: number;
    management_fee: number;
    total_fee: number;
  };
  total_amount: number;
  estimated_settlement_time: string;
  created_at: Date;
  uex_data?: {
    order_id: string;
    deposit_address: string;
    deposit_tag: string | null;
    qr_code?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate: number;
  uex_buyer_fee: number;
  uex_seller_fee: number;
  conversion_fee: number;
  management_fee: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  settlement_method: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  failure_reason?: string;
  transaction_hash?: string;
  bank_reference?: string;
  
  // UEX-specific fields
  uex_order_id?: string;
  deposit_address?: string;
  deposit_tag?: string;
  qr_code_url?: string;
}

// ... rest of your existing types
```

---

## Usage Examples

### Example 1: Process Crypto Payment with UEX

```bash
# Request
POST http://localhost:3000/api/payments/process
Content-Type: application/json

{
  "client_id": "client-123",
  "seller_id": "seller-456",
  "amount": 0.5,
  "currency": "BTC",
  "target_currency": "USDT",
  "payment_method": "crypto",
  "settlement_method": "blockchain",
  "metadata": {
    "order_id": "order-789",
    "item_name": "Cloud Computing Services"
  }
}

# Response
{
  "success": true,
  "data": {
    "transaction_id": "txn-abc123",
    "status": "processing",
    "amount": 0.5,
    "currency": "BTC",
    "target_currency": "USDT",
    "conversion_rate": 40000,
    "fees": {
      "uex_buyer_fee": 0.0005,
      "uex_seller_fee": 0.0005,
      "conversion_fee": 0.001,
      "management_fee": 0.005,
      "total_fee": 0.0065
    },
    "total_amount": 0.5065,
    "estimated_settlement_time": "2025-10-22T13:47:00.000Z",
    "created_at": "2025-10-22T13:17:00.000Z",
    "uex_data": {
      "order_id": "xaAkVZUkI0pE",
      "deposit_address": "1FkccfHWhUwdwUAtY7AVEypnM53K17H51t",
      "deposit_tag": null,
      "qr_code": "https://quickchart.io/qr?chs=256x256&text=1FkccfHWhUwdwUAtY7AVEypnM53K17H51t"
    }
  }
}
```

### Example 2: Estimate Conversion

```bash
# Request
POST http://localhost:3000/api/uex/estimate
Content-Type: application/json

{
  "from_currency": "BTC",
  "to_currency": "USDT",
  "amount": 1.0
}

# Response
{
  "success": true,
  "data": {
    "rate": "40000.00",
    "convert": "40000.00",
    "data": {
      "provider": "076a37cfef8908618e7e6e8c9a8be66a",
      "rate": "40000.00",
      "min": "0.001",
      "max": "10",
      "convert": "40000.00",
      "fee": "0.0001"
    }
  }
}
```

### Example 3: Poll Order Status

```bash
# Request
GET http://localhost:3000/api/uex/poll/txn-abc123

# Response
{
  "success": true,
  "data": {
    "transaction_id": "txn-abc123",
    "uex_order_id": "xaAkVZUkI0pE",
    "current_status": "completed",
    "uex_status": "Complete",
    "order_details": {
      "orderId": "xaAkVZUkI0pE",
      "depositAddress": "1FkccfHWhUwdwUAtY7AVEypnM53K17H51t",
      "baseCurrencyAmount": "0.5",
      "quoteCurrencyAmount": "20000.00",
      "recipientAddress": "TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE",
      "baseCurrency": {
        "chainName": "BTC",
        "currencyId": "BTC",
        "currencyName": "BTC"
      },
      "quoteCurrency": {
        "chainName": "TRX",
        "currencyId": "USDT",
        "currencyName": "USDT"
      }
    }
  }
}
```

### Example 4: Generate Payment Link

```bash
# Request
POST http://localhost:3000/api/uex/payment-link
Content-Type: application/json

{
  "order_id": "order-789",
  "item_name": "Cloud Computing Services",
  "amount": "100",
  "success_url": "https://yoursite.com/payment/success",
  "failure_url": "https://yoursite.com/payment/failed"
}

# Response
{
  "success": true,
  "data": {
    "redirectUrl": "https://uex.us/payment/select-gateway?payload=eyJpdiI6..."
  }
}
```

---

## Workflow Diagrams

### Payment Flow with UEX Integration

```
Client Request
     ↓
PaymentController.processPayment()
     ↓
PaymentProcessingService.processPayment()
     ↓
Is Crypto Payment? ────No──→ Standard Payment Flow
     ↓ Yes
ExchangeRateService.getExchangeRate()
     ↓ (Uses UEX API)
Calculate Fees
     ↓
Create Transaction in DB
     ↓
UEXService.initiateCryptoToCryptoSwap()
     ↓ (Calls UEX API)
Update Transaction with UEX Order ID
     ↓
Return Response with Deposit Address
     ↓
Client Sends Crypto to Deposit Address
     ↓
UEX Processes Swap
     ↓
UEX Webhook/Poll Updates Status
     ↓
Update Transaction Status → 'completed'
     ↓
Notify Seller
```

### Status Synchronization Flow

```
Option 1: Webhook (Recommended)
┌────────────────────────────────────┐
│ UEX detects status change          │
│ (e.g., swap completed)             │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│ UEX sends POST to your webhook     │
│ /api/uex/webhook/order-status      │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│ Webhook Handler                    │
│ - Find transaction by UEX order ID │
│ - Map UEX status to your status    │
│ - Update transaction in DB         │
│ - Trigger notifications            │
└────────────────────────────────────┘

Option 2: Polling (Fallback)
┌────────────────────────────────────┐
│ Cron job runs every 5 minutes      │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│ Get all 'processing' transactions  │
│ with UEX order IDs                 │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│ For each transaction:              │
│ - Call UEX order-show API          │
│ - Check if status changed          │
│ - Update if needed                 │
└────────────────────────────────────┘
```

---

Continued in Part 3...
