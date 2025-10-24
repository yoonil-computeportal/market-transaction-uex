# UEX Server Integration Guide

This guide shows how to integrate the new UEX-enhanced services into your Express server.

## Quick Start

### 1. Update Your Main Server File

Edit `uex/src/index.ts` to use the enhanced routes and start the polling service:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import enhanced routes
import paymentRoutes from './routes/paymentRoutesEnhanced';
import webhookRoutes from './routes/webhookRoutes';

// Import polling service
import { uexPollingService } from './services/UEXPollingService';

const app = express();
const PORT = process.env.PORT || 3903;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'UEX Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use(paymentRoutes);  // Enhanced payment routes with crypto support
app.use(webhookRoutes);  // Webhook routes for UEX status updates

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'UEX Payment Processing Backend',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      payments: '/api/payments',
      webhooks: '/api/webhooks/uex',
      health: '/health'
    }
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ UEX Backend server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/payments`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/webhooks/uex/order-update`);

  // Start UEX polling service
  if (process.env.UEX_POLLING_ENABLED !== 'false') {
    console.log(`🔄 Starting UEX polling service...`);
    uexPollingService.start();
    console.log(`✅ Polling service started (interval: ${process.env.UEX_POLL_INTERVAL_MINUTES || 5} minutes)`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  uexPollingService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  uexPollingService.stop();
  process.exit(0);
});

export default app;
```

### 2. Run Database Migration

Before starting the server, run the database migration to add UEX fields:

```bash
# For SQLite (development)
sqlite3 dev.db < migrations/003_add_uex_fields.sql

# For PostgreSQL (production)
psql -d uex_payments -f migrations/003_add_uex_fields.sql
```

### 3. Configure Environment

Ensure your `.env` file has the required UEX configuration:

```bash
# Required
UEX_REFERRAL_CODE=your-referral-code-here

# Optional (for polling)
UEX_POLLING_ENABLED=true
UEX_POLL_INTERVAL_MINUTES=5

# Optional (for webhooks)
UEX_WEBHOOK_SECRET=your-random-secure-string
UEX_WEBHOOK_URL=https://yourdomain.com/api/webhooks/uex/order-update

# Optional (for merchant payment links)
UEX_CLIENT_ID=your-client-id
UEX_SECRET_KEY=your-secret-key
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints Available

Once integrated, your server will have these endpoints:

### Standard Payment Endpoints
- `POST /api/payments/process` - Process payment transaction
- `GET /api/payments/transactions` - Get all transactions
- `GET /api/payments/transaction/:id/status` - Get transaction status
- `PUT /api/payments/transaction/:id/status` - Update transaction status

### NEW: Crypto Payment Endpoints
- `GET /api/payments/currencies` - List 50+ cryptocurrencies
- `POST /api/payments/estimate` - Estimate crypto conversion
- `POST /api/payments/crypto/initiate` - Initiate crypto swap
- `GET /api/payments/crypto/order/:orderId` - Track order status
- `POST /api/payments/crypto/payment-link` - Generate payment link
- `GET /api/payments/health` - Health check with UEX status

### Webhook Endpoints
- `POST /api/webhooks/uex/order-update` - Receive UEX status updates
- `GET /api/webhooks/uex/test` - Test webhook endpoint
- `POST /api/webhooks/uex/simulate` - Simulate webhook (testing)
- `GET /api/webhooks/uex/stats` - Webhook statistics

## Testing the Integration

### 1. Health Check
```bash
curl http://localhost:3903/api/payments/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "UEX Payment Processing",
  "timestamp": "2025-10-24T12:00:00Z",
  "integrations": {
    "uex_swap_api": { "status": "connected", "latency_ms": 120 },
    "uex_merchant_api": { "status": "connected", "latency_ms": 95 },
    "cache": { "hits": 10, "misses": 2, "hit_rate": 83.3 }
  }
}
```

### 2. List Cryptocurrencies
```bash
curl http://localhost:3903/api/payments/currencies
```

### 3. Estimate Conversion
```bash
curl -X POST http://localhost:3903/api/payments/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "from_currency": "BTC",
    "from_network": "BTC",
    "to_currency": "USDT",
    "to_network": "TRX",
    "amount": 0.5
  }'
```

### 4. Initiate Crypto Swap
```bash
curl -X POST http://localhost:3903/api/payments/crypto/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "from_amount": 0.5,
    "from_currency": "BTC",
    "from_network": "BTC",
    "to_currency": "USDT",
    "to_network": "TRX",
    "recipient_address": "TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE"
  }'
```

### 5. Run Integration Tests
```bash
# Install test dependencies
npm install --save-dev @jest/globals jest ts-jest @types/jest

# Run tests
npm test

# Or run the standalone test script
ts-node test-uex-integration.ts
```

## Monitoring and Debugging

### Check Polling Service Status

The polling service runs in the background. Check logs for:

```
[UEXPolling] Starting polling service (interval: 5 minutes)
[UEXPolling] Starting poll #1 at 2025-10-24T12:00:00Z
[UEXPolling] Found 3 pending transactions with UEX orders
[UEXPolling] Order xaAkVZUkI0pE: Complete
[UEXPolling] Updated transaction abc-123: Awaiting Deposit -> Complete
[UEXPolling] Poll complete: 1 updated, 0 failed
```

### Check Webhook Events

View webhook statistics:
```bash
curl http://localhost:3903/api/webhooks/uex/stats
```

### View Cache Performance

Check cache hit rate in health endpoint:
```bash
curl http://localhost:3903/api/payments/health | jq '.integrations.cache'
```

## Troubleshooting

### Issue: Polling service not starting

**Solution:** Check environment variables:
```bash
# Ensure polling is enabled
UEX_POLLING_ENABLED=true
```

### Issue: Webhook signature validation fails

**Solution:** Ensure webhook secret matches:
```bash
# In .env
UEX_WEBHOOK_SECRET=your-secret-string

# Configure same secret in UEX dashboard
```

### Issue: API rate limits exceeded

**Solution:** Increase cache TTL:
```bash
# Cache currencies for longer
UEX_CURRENCY_CACHE_TTL=7200  # 2 hours

# Cache rates for longer
UEX_RATE_CACHE_TTL=600  # 10 minutes
```

### Issue: Database errors after migration

**Solution:** Verify migration ran successfully:
```bash
# SQLite
sqlite3 dev.db "PRAGMA table_info(payment_transactions);" | grep uex

# PostgreSQL
psql -d uex_payments -c "\d payment_transactions" | grep uex
```

## Performance Considerations

### Cache Strategy
- **Currencies**: Cached for 1 hour (rarely changes)
- **Exchange Rates**: Cached for 5 minutes (balance freshness vs API calls)
- **Order Status**: Cached for 1 minute (polling optimization)

### Rate Limiting
- **Polling**: 100ms delay between order status checks
- **API Calls**: Respect UEX rate limits (configurable)

### Database Indexes
Migration creates indexes on:
- `uex_order_id` for fast lookups
- `status` + `uex_order_id` for efficient polling queries
- `last_webhook_at` for statistics
- `last_poll_at` for debugging

## Next Steps

After integration:

1. ✅ Test all endpoints with curl/Postman
2. ✅ Run integration test suite
3. ✅ Monitor polling service logs
4. ✅ Test webhook with simulated events
5. ✅ Configure production webhook URL
6. ✅ Set up monitoring/alerting
7. ✅ Deploy to staging environment
8. ✅ Perform end-to-end crypto payment test

## Support

- **API Documentation**: `/uex/UEX_SERVICE_README.md`
- **Integration Guide**: `/Specifications/UEX_Integration_Guide/`
- **UEX Official Docs**: https://uex-us.stoplight.io/docs/uex
- **Issue Tracking**: Create a GitHub issue with logs

---

Your UEX integration is ready to go! 🚀
