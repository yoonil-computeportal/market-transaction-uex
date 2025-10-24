/**
 * Webhook Routes for UEX Integration
 *
 * Endpoints:
 * - POST /api/webhooks/uex/order-update   - Receive UEX order status updates
 * - GET  /api/webhooks/uex/test           - Test webhook endpoint
 * - POST /api/webhooks/uex/simulate       - Simulate webhook (testing)
 * - GET  /api/webhooks/uex/stats          - Webhook statistics
 */

import { Router } from 'express';
import { UEXWebhookController } from '../controllers/UEXWebhookController';
import { DatabaseService } from '../services/DatabaseService';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { ExchangeRateService } from '../services/ExchangeRateServiceEnhanced';

const router = Router();

// Initialize services
const dbService = new DatabaseService();
const exchangeRateService = new ExchangeRateService(dbService);
const paymentService = new PaymentProcessingService(dbService, exchangeRateService);
const webhookController = new UEXWebhookController(dbService, paymentService);

/**
 * POST /api/webhooks/uex/order-update
 * Receive order status updates from UEX
 *
 * Expected payload from UEX:
 * {
 *   "order_id": "xaAkVZUkI0pE",
 *   "status": "Complete",
 *   "tx_hash": "0xabc123...",
 *   "deposit_confirmed": true,
 *   "updated_at": "2025-10-24T12:00:00Z"
 * }
 */
router.post(
  '/api/webhooks/uex/order-update',
  (req, res) => webhookController.handleOrderUpdate(req, res)
);

/**
 * GET /api/webhooks/uex/test
 * Test webhook endpoint is active
 */
router.get(
  '/api/webhooks/uex/test',
  (req, res) => webhookController.testWebhook(req, res)
);

/**
 * POST /api/webhooks/uex/simulate
 * Simulate a webhook call for testing
 *
 * Body:
 * {
 *   "order_id": "test-order-123",
 *   "status": "Complete",
 *   "tx_hash": "0xabc123..."
 * }
 */
router.post(
  '/api/webhooks/uex/simulate',
  (req, res) => webhookController.simulateWebhook(req, res)
);

/**
 * GET /api/webhooks/uex/stats
 * Get webhook statistics
 */
router.get(
  '/api/webhooks/uex/stats',
  (req, res) => webhookController.getWebhookStats(req, res)
);

export default router;
