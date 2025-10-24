# UEX API Integration Guide - Part 3

## Step 10: Status Polling Service (Alternative to Webhooks)

Create a background service to poll UEX order statuses:

```typescript
// services/UEXPollingService.ts

import { DatabaseService } from './DatabaseService';
import { UEXService } from './UEXService';
import { PaymentProcessingService } from './PaymentProcessingService';

export class UEXPollingService {
  private dbService: DatabaseService;
  private uexService: UEXService;
  private paymentService: PaymentProcessingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;

  constructor(
    dbService: DatabaseService,
    uexService: UEXService,
    paymentService: PaymentProcessingService
  ) {
    this.dbService = dbService;
    this.uexService = uexService;
    this.paymentService = paymentService;
  }

  /**
   * Start polling for order status updates
   */
  startPolling(intervalMs: number = 5 * 60 * 1000): void {
    if (this.isPolling) {
      console.warn('Polling service is already running');
      return;
    }

    this.isPolling = true;
    console.log(`🔄 Starting UEX polling service (interval: ${intervalMs}ms)`);

    // Run immediately
    this.pollPendingOrders();

    // Then run on interval
    this.pollingInterval = setInterval(() => {
      this.pollPendingOrders();
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('🛑 Stopped UEX polling service');
    }
  }

  /**
   * Poll all pending/processing orders
   */
  private async pollPendingOrders(): Promise<void> {
    try {
      console.log('📊 Polling pending UEX orders...');

      // Get all transactions with UEX orders that are not completed/failed
      const pendingTransactions = await this.dbService.getPendingUEXTransactions();

      if (pendingTransactions.length === 0) {
        console.log('✅ No pending UEX orders to poll');
        return;
      }

      console.log(`🔍 Found ${pendingTransactions.length} pending orders`);

      let updated = 0;
      let errors = 0;

      for (const transaction of pendingTransactions) {
        try {
          if (!transaction.uex_order_id) {
            continue;
          }

          // Get status from UEX
          const uexStatus = await this.uexService.getOrderStatus(transaction.uex_order_id);
          const newStatus = this.uexService.mapOrderStatus(uexStatus.data.external_status);

          // Update if status changed
          if (newStatus !== transaction.status) {
            await this.paymentService.updateTransactionStatus(
              transaction.id,
              newStatus,
              {
                uex_status: uexStatus.data.external_status,
                last_polled_at: new Date()
              }
            );

            console.log(
              `✅ Updated transaction ${transaction.id}: ${transaction.status} → ${newStatus}`
            );
            updated++;
          }

        } catch (error) {
          console.error(
            `❌ Failed to poll order ${transaction.uex_order_id}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          errors++;
        }
      }

      console.log(
        `📈 Polling complete: ${updated} updated, ${errors} errors, ${pendingTransactions.length - updated - errors} unchanged`
      );

    } catch (error) {
      console.error('❌ Polling service error:', error);
    }
  }

  /**
   * Manual poll for a specific transaction
   */
  async pollTransaction(transactionId: string): Promise<boolean> {
    try {
      const transaction = await this.paymentService.getTransactionStatus(transactionId);

      if (!transaction || !transaction.uex_order_id) {
        throw new Error('Transaction not found or not associated with UEX order');
      }

      const uexStatus = await this.uexService.getOrderStatus(transaction.uex_order_id);
      const newStatus = this.uexService.mapOrderStatus(uexStatus.data.external_status);

      if (newStatus !== transaction.status) {
        await this.paymentService.updateTransactionStatus(
          transactionId,
          newStatus,
          { uex_status: uexStatus.data.external_status }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to poll transaction ${transactionId}:`, error);
      throw error;
    }
  }
}
```

Add method to DatabaseService:

```typescript
// Add to DatabaseService.ts

async getPendingUEXTransactions(): Promise<PaymentTransaction[]> {
  const results = await this.db('payment_transactions')
    .whereNotNull('uex_order_id')
    .whereIn('status', ['pending', 'processing'])
    .orderBy('created_at', 'desc');
  
  return results;
}
```

---

## Step 11: Implement Polling in Main Application

```typescript
// index.ts (Enhanced with Polling)

import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';
import uexRoutes from './routes/uexRoutes';
import { UEXPollingService } from './services/UEXPollingService';
import { DatabaseService } from './services/DatabaseService';
import { UEXService } from './services/UEXService';
import { ExchangeRateService } from './services/ExchangeRateService';
import { PaymentProcessingService } from './services/PaymentProcessingService';

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
    features: [
      'Multi-currency payment processing',
      'UEX cryptocurrency exchange integration',
      'Real-time exchange rates',
      'Automated order status polling',
      'Webhook support for instant updates'
    ]
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

// Initialize polling service
let pollingService: UEXPollingService | null = null;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`🔄 UEX Integration: http://localhost:${PORT}/api/uex`);

  // Start polling service if enabled
  if (process.env.UEX_POLLING_ENABLED === 'true') {
    const dbService = new DatabaseService();
    const uexService = new UEXService({
      swapBaseUrl: process.env.UEX_SWAP_BASE_URL || 'https://uexswap.com',
      merchantBaseUrl: process.env.UEX_MERCHANT_BASE_URL || 'https://uex.us',
      referralCode: process.env.UEX_REFERRAL_CODE || ''
    });
    const exchangeRateService = new ExchangeRateService(dbService, uexService);
    const paymentService = new PaymentProcessingService(
      dbService,
      exchangeRateService,
      uexService
    );

    pollingService = new UEXPollingService(dbService, uexService, paymentService);
    
    // Start polling every 5 minutes (300000ms)
    const intervalMs = parseInt(process.env.UEX_POLLING_INTERVAL || '300000');
    pollingService.startPolling(intervalMs);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (pollingService) {
    pollingService.stopPolling();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (pollingService) {
    pollingService.stopPolling();
  }
  process.exit(0);
});

export default app;
```

---

## Step 12: Complete Environment Variables

Update your `.env` file with all configuration:

```env
# ===================================
# Application Configuration
# ===================================
PORT=3000
NODE_ENV=development

# ===================================
# Database Configuration
# ===================================
DATABASE_URL=postgresql://user:password@localhost:5432/payment_db

# ===================================
# UEX API Configuration
# ===================================

# UEX Base URLs
UEX_SWAP_BASE_URL=https://uexswap.com
UEX_MERCHANT_BASE_URL=https://uex.us

# UEX Referral Code (REQUIRED)
# Get from: https://uex.us/referrals
UEX_REFERRAL_CODE=5drfo01pgq88

# UEX Merchant API Credentials (Optional - for payment links)
# Get from: https://uex.us/profile
UEX_CLIENT_ID=your_client_id_here
UEX_SECRET_KEY=your_secret_key_here

# ===================================
# UEX Polling Configuration
# ===================================

# Enable/disable automatic polling (true/false)
UEX_POLLING_ENABLED=true

# Polling interval in milliseconds (default: 5 minutes = 300000)
UEX_POLLING_INTERVAL=300000

# ===================================
# Webhook Configuration
# ===================================

# Your public webhook URL (for UEX to send updates)
WEBHOOK_BASE_URL=https://your-domain.com

# Webhook secret for validation (optional)
WEBHOOK_SECRET=your_webhook_secret_here

# ===================================
# Logging Configuration
# ===================================
LOG_LEVEL=info
```

---

## Step 13: Testing Guide

### Test 1: Check UEX Connection

```bash
# Test getting supported currencies
curl -X GET http://localhost:3000/api/uex/currencies
```

Expected response:
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "id": 1,
        "name": "Bitcoin",
        "code": "BTC",
        "network": [...]
      }
    ],
    "cardano_tokens": [...]
  }
}
```

### Test 2: Estimate Conversion

```bash
curl -X POST http://localhost:3000/api/uex/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "from_currency": "BTC",
    "to_currency": "USDT",
    "amount": 0.5
  }'
```

### Test 3: Process Crypto Payment

```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test-client-001",
    "seller_id": "test-seller-001",
    "amount": 0.1,
    "currency": "BTC",
    "target_currency": "USDT",
    "payment_method": "crypto",
    "settlement_method": "blockchain",
    "metadata": {
      "order_id": "order-test-001",
      "item_name": "Test Product"
    }
  }'
```

### Test 4: Check Transaction Status

```bash
# Replace {transaction_id} with actual ID
curl -X GET http://localhost:3000/api/payments/transaction/{transaction_id}/status
```

### Test 5: Poll Order Status

```bash
# Replace {transaction_id} with actual ID
curl -X GET http://localhost:3000/api/uex/poll/{transaction_id}
```

### Test 6: Simulate Webhook

```bash
curl -X POST http://localhost:3000/api/uex/webhook/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "xaAkVZUkI0pE",
    "status": "Complete",
    "transaction_hash": "0x123abc..."
  }'
```

---

## Step 14: Error Handling & Monitoring

### Error Handler Middleware

```typescript
// middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

export class UEXError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof UEXError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Log unexpected errors
  console.error('❌ Unexpected Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  return res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

### Logging Service

```typescript
// services/LoggingService.ts

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export class LoggingService {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data
    };

    // In production, send to logging service (e.g., Winston, Datadog)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service
    }

    // Console output
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    }[level];

    console.log(`${emoji} [${timestamp}] [${this.context}] ${message}`, data || '');
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack
    });
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}
```

### Monitoring Endpoints

```typescript
// Add to routes/uexRoutes.ts

// Monitoring endpoint
router.get('/monitoring/stats', async (_req, res) => {
  try {
    const dbService = new DatabaseService();
    
    const stats = {
      total_transactions: await dbService.countTransactions(),
      pending_uex_orders: await dbService.countPendingUEXOrders(),
      completed_today: await dbService.countCompletedToday(),
      failed_today: await dbService.countFailedToday(),
      average_completion_time: await dbService.getAverageCompletionTime(),
      total_volume_24h: await dbService.getTotalVolume24h()
    };

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch monitoring stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check with dependencies
router.get('/health/detailed', async (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: 'unknown',
      uex_api: 'unknown'
    }
  };

  // Check database
  try {
    const dbService = new DatabaseService();
    await dbService.healthCheck();
    health.dependencies.database = 'healthy';
  } catch (error) {
    health.dependencies.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check UEX API
  try {
    const uexService = new UEXService({
      swapBaseUrl: process.env.UEX_SWAP_BASE_URL || 'https://uexswap.com',
      merchantBaseUrl: process.env.UEX_MERCHANT_BASE_URL || 'https://uex.us',
      referralCode: process.env.UEX_REFERRAL_CODE || ''
    });
    await uexService.getSupportedCurrencies();
    health.dependencies.uex_api = 'healthy';
  } catch (error) {
    health.dependencies.uex_api = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

Add monitoring methods to DatabaseService:

```typescript
// Add to DatabaseService.ts

async countTransactions(): Promise<number> {
  const result = await this.db('payment_transactions').count('* as count').first();
  return parseInt(result?.count as string) || 0;
}

async countPendingUEXOrders(): Promise<number> {
  const result = await this.db('payment_transactions')
    .whereNotNull('uex_order_id')
    .whereIn('status', ['pending', 'processing'])
    .count('* as count')
    .first();
  return parseInt(result?.count as string) || 0;
}

async countCompletedToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const result = await this.db('payment_transactions')
    .where('status', 'completed')
    .where('completed_at', '>=', startOfDay)
    .count('* as count')
    .first();
  return parseInt(result?.count as string) || 0;
}

async countFailedToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const result = await this.db('payment_transactions')
    .where('status', 'failed')
    .where('updated_at', '>=', startOfDay)
    .count('* as count')
    .first();
  return parseInt(result?.count as string) || 0;
}

async getAverageCompletionTime(): Promise<number> {
  const result = await this.db('payment_transactions')
    .whereNotNull('completed_at')
    .select(
      this.db.raw(
        'AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds'
      )
    )
    .first();
  return parseFloat(result?.avg_seconds) || 0;
}

async getTotalVolume24h(): Promise<number> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await this.db('payment_transactions')
    .where('created_at', '>=', yesterday)
    .sum('amount as total')
    .first();
  return parseFloat(result?.total) || 0;
}

async healthCheck(): Promise<boolean> {
  await this.db.raw('SELECT 1');
  return true;
}
```

---

Continued in Part 4...
