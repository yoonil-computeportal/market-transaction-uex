/**
 * Enhanced UEX Backend Server with Full Crypto Integration
 * This is the updated version of index.ts with UEX crypto payment support
 *
 * To use: Rename this file to index.ts (backup the old one first)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import enhanced routes with UEX integration
import paymentRoutes from './routes/paymentRoutesEnhanced';
import webhookRoutes from './routes/webhookRoutes';

// Import polling service for background order tracking
import { uexPollingService } from './services/UEXPollingService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3903;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-UEX-Signature']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '60000'),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined'));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// Enhanced API Routes with UEX Integration
// ============================================================================

// Payment routes (includes both standard and crypto endpoints)
app.use(paymentRoutes);

// Webhook routes (for UEX status updates)
app.use(webhookRoutes);

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    service: 'UEX Backend - Multi-Currency Payment Processing with Crypto',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: [
      'Standard fiat payment processing',
      'Cryptocurrency payments (50+ coins)',
      'Real-time exchange rates',
      'Webhook status updates',
      'Background order polling',
      'Referral commission tracking'
    ],
    endpoints: {
      api_docs: '/api/payments',
      standard_payments: '/api/payments/process',
      crypto_currencies: '/api/payments/currencies',
      crypto_estimate: '/api/payments/estimate',
      crypto_swap: '/api/payments/crypto/initiate',
      webhooks: '/api/webhooks/uex',
      health: '/api/payments/health'
    },
    integration: {
      uex_swap_api: 'https://uexswap.com',
      uex_merchant_api: 'https://uex.us',
      polling_enabled: process.env['UEX_POLLING_ENABLED'] !== 'false',
      polling_interval: `${process.env['UEX_POLL_INTERVAL_MINUTES'] || 5} minutes`
    }
  });
});

// ============================================================================
// Error Handlers
// ============================================================================

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: {
      root: '/',
      api_docs: '/api/payments',
      payments: '/api/payments/process',
      crypto: '/api/payments/crypto/initiate',
      webhooks: '/api/webhooks/uex/order-update',
      health: '/api/payments/health'
    }
  });
});

// Global error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);

  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'production'
      ? 'Something went wrong'
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Start Server & Background Services
// ============================================================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 UEX Backend Server Started');
  console.log('='.repeat(70));
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 Server: http://localhost:${PORT}`);
  console.log(`📋 API Docs: http://localhost:${PORT}/api/payments`);
  console.log(`💚 Health: http://localhost:${PORT}/api/payments/health`);
  console.log('\n📡 API Endpoints:');
  console.log(`  Standard Payments: POST /api/payments/process`);
  console.log(`  Crypto Currencies: GET  /api/payments/currencies`);
  console.log(`  Estimate Swap:     POST /api/payments/estimate`);
  console.log(`  Initiate Swap:     POST /api/payments/crypto/initiate`);
  console.log(`  Track Order:       GET  /api/payments/crypto/order/:id`);
  console.log(`  Webhooks:          POST /api/webhooks/uex/order-update`);

  // Start UEX polling service
  if (process.env['UEX_POLLING_ENABLED'] !== 'false') {
    const interval = process.env['UEX_POLL_INTERVAL_MINUTES'] || '5';
    console.log(`\n🔄 Starting UEX polling service...`);
    console.log(`  Interval: ${interval} minutes`);
    console.log(`  Purpose: Auto-update order statuses`);

    try {
      uexPollingService.start();
      console.log(`✅ Polling service active`);
    } catch (error) {
      console.error(`❌ Failed to start polling service:`, error);
    }
  } else {
    console.log(`\n⏸️  Polling service disabled (set UEX_POLLING_ENABLED=true to enable)`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('Server ready to accept requests');
  console.log('='.repeat(70) + '\n');
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Stop polling service
  if (process.env['UEX_POLLING_ENABLED'] !== 'false') {
    console.log('Stopping polling service...');
    uexPollingService.stop();
    console.log('✅ Polling service stopped');
  }

  console.log('✅ Server shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
