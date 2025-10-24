/**
 * Enhanced Payment Routes with UEX Crypto Integration
 *
 * Standard Payment Endpoints:
 * - POST   /api/payments/process             - Process payment transaction
 * - GET    /api/payments/transactions        - Get all transactions
 * - GET    /api/payments/transaction/:id/status - Get transaction status
 * - PUT    /api/payments/transaction/:id/status - Update transaction status
 *
 * Crypto Payment Endpoints (NEW):
 * - GET    /api/payments/currencies           - List supported cryptocurrencies
 * - POST   /api/payments/estimate             - Estimate conversion rate & fees
 * - POST   /api/payments/crypto/initiate      - Initiate crypto swap
 * - GET    /api/payments/crypto/order/:id     - Get UEX order status
 * - POST   /api/payments/crypto/payment-link  - Generate merchant payment link
 * - GET    /api/payments/health               - Health check with UEX status
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentControllerEnhanced';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { DatabaseService } from '../services/DatabaseService';
import { ExchangeRateService } from '../services/ExchangeRateServiceEnhanced';

const router = Router();

// Initialize services
const dbService = new DatabaseService();
const exchangeRateService = new ExchangeRateService(dbService);
const paymentService = new PaymentProcessingService(dbService, exchangeRateService);
const paymentController = new PaymentController(paymentService);

// ============================================================================
// API Documentation Endpoint
// ============================================================================

router.get('/api/payments', (_req, res) => {
  res.json({
    service: 'UEX Payment Processing API',
    version: '2.0.0',
    description: 'Multi-currency payment processing with cryptocurrency support via UEX',
    endpoints: {
      standard: {
        'POST /api/payments/process': 'Process a payment transaction',
        'GET /api/payments/transactions': 'Get all transactions',
        'GET /api/payments/transaction/:id/status': 'Get transaction status',
        'PUT /api/payments/transaction/:id/status': 'Update transaction status',
        'GET /api/payments/transaction/:id/fees': 'Get transaction fees',
        'GET /api/payments/transaction/:id/conversions': 'Get currency conversions'
      },
      crypto: {
        'GET /api/payments/currencies': 'List 50+ supported cryptocurrencies',
        'POST /api/payments/estimate': 'Estimate crypto conversion (rate & fees)',
        'POST /api/payments/crypto/initiate': 'Initiate cryptocurrency swap',
        'GET /api/payments/crypto/order/:orderId': 'Track UEX swap order status',
        'POST /api/payments/crypto/payment-link': 'Generate merchant payment link'
      },
      monitoring: {
        'GET /api/payments/health': 'Service health check with UEX connectivity'
      }
    },
    documentation: 'https://uex-us.stoplight.io/docs/uex',
    integration_guide: '/Specifications/UEX_Integration_Guide/'
  });
});

// ============================================================================
// Standard Payment Endpoints
// ============================================================================

/**
 * POST /api/payments/process
 * Process a new payment transaction
 *
 * Body:
 * {
 *   "client_id": "user-1",
 *   "seller_id": "Cloud Provider A",
 *   "amount": 100.00,
 *   "currency": "USD",
 *   "target_currency": "EUR",
 *   "payment_method": "fiat",
 *   "settlement_method": "bank"
 * }
 */
router.post(
  '/api/payments/process',
  (req, res) => paymentController.processPayment(req, res)
);

/**
 * GET /api/payments/transactions
 * Get all payment transactions
 */
router.get(
  '/api/payments/transactions',
  (req, res) => paymentController.getAllTransactions(req, res)
);

/**
 * GET /api/payments/transaction/:transactionId/status
 * Get transaction status by ID
 */
router.get(
  '/api/payments/transaction/:transactionId/status',
  (req, res) => paymentController.getTransactionStatus(req, res)
);

/**
 * PUT /api/payments/transaction/:transactionId/status
 * Update transaction status
 *
 * Body:
 * {
 *   "status": "completed",
 *   "metadata": {
 *     "transaction_hash": "0xabc123...",
 *     "bank_reference": "REF12345"
 *   }
 * }
 */
router.put(
  '/api/payments/transaction/:transactionId/status',
  (req, res) => paymentController.updateTransactionStatus(req, res)
);

// ============================================================================
// NEW: Crypto Payment Endpoints (UEX Integration)
// ============================================================================

/**
 * GET /api/payments/currencies
 * Get list of 50+ supported cryptocurrencies from UEX
 *
 * Response:
 * {
 *   "success": true,
 *   "count": 52,
 *   "data": [
 *     { "code": "BTC", "name": "Bitcoin", "network": "BTC" },
 *     { "code": "ETH", "name": "Ethereum", "network": "ETH" },
 *     ...
 *   ]
 * }
 */
router.get(
  '/api/payments/currencies',
  (req, res) => paymentController.getSupportedCurrencies(req, res)
);

/**
 * POST /api/payments/estimate
 * Estimate cryptocurrency conversion rate and fees
 *
 * Body:
 * {
 *   "from_currency": "BTC",
 *   "from_network": "BTC",
 *   "to_currency": "USDT",
 *   "to_network": "TRX",
 *   "amount": 0.5
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "from_amount": 0.5,
 *     "to_amount": 20450.25,
 *     "exchange_rate": 40900.50,
 *     "fee": 20.45,
 *     "valid_for_minutes": 10
 *   }
 * }
 */
router.post(
  '/api/payments/estimate',
  (req, res) => paymentController.estimateConversion(req, res)
);

/**
 * POST /api/payments/crypto/initiate
 * Initiate a cryptocurrency swap via UEX
 *
 * Body:
 * {
 *   "from_amount": 0.5,
 *   "from_currency": "BTC",
 *   "from_network": "BTC",
 *   "to_currency": "USDT",
 *   "to_network": "TRX",
 *   "recipient_address": "TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "order_id": "xaAkVZUkI0pE",
 *     "deposit_address": "1FkccfH7TfWRx4qBMF...",
 *     "deposit_tag": null,
 *     "qr_code": "data:image/png;base64,...",
 *     "from_amount": 0.5,
 *     "to_amount": 20450.25,
 *     "exchange_rate": 40900.50,
 *     "status": "Awaiting Deposit",
 *     "expires_at": "2025-10-24T12:00:00Z",
 *     "instructions": { ... }
 *   }
 * }
 */
router.post(
  '/api/payments/crypto/initiate',
  (req, res) => paymentController.initiateCryptoSwap(req, res)
);

/**
 * GET /api/payments/crypto/order/:orderId
 * Get UEX swap order status
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "order_id": "xaAkVZUkI0pE",
 *     "status": "Complete",
 *     "from_amount": 0.5,
 *     "to_amount": 20450.25,
 *     "deposit_confirmed": true,
 *     "tx_hash": "0xabc123...",
 *     "updated_at": "2025-10-24T11:45:00Z"
 *   }
 * }
 */
router.get(
  '/api/payments/crypto/order/:orderId',
  (req, res) => paymentController.getUEXOrderStatus(req, res)
);

/**
 * POST /api/payments/crypto/payment-link
 * Generate merchant payment link (requires UEX merchant credentials)
 *
 * Body:
 * {
 *   "order_id": "ORDER-123",
 *   "item_name": "Cloud GPU Instance",
 *   "amount": "100",
 *   "success_url": "https://example.com/success",
 *   "failure_url": "https://example.com/failed"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payment_url": "https://uex.us/payment/select-gateway?payload=...",
 *     "order_id": "ORDER-123",
 *     "expires_at": "2025-10-25T12:00:00Z"
 *   }
 * }
 */
router.post(
  '/api/payments/crypto/payment-link',
  (req, res) => paymentController.generatePaymentLink(req, res)
);

// ============================================================================
// Health & Monitoring
// ============================================================================

/**
 * GET /api/payments/health
 * Service health check with UEX connectivity status
 *
 * Response:
 * {
 *   "status": "healthy",
 *   "service": "UEX Payment Processing",
 *   "timestamp": "2025-10-24T12:00:00Z",
 *   "integrations": {
 *     "uex_swap_api": { "status": "connected", "latency_ms": 120 },
 *     "uex_merchant_api": { "status": "connected", "latency_ms": 95 },
 *     "cache": { "hits": 1250, "misses": 45, "hit_rate": 96.5 }
 *   }
 * }
 */
router.get(
  '/api/payments/health',
  (req, res) => paymentController.healthCheck(req, res)
);

export default router;
