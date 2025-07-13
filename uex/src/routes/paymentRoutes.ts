import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { DatabaseService } from '../services/DatabaseService';
import { ExchangeRateService } from '../services/ExchangeRateService';

const router = Router();

// Initialize services
const dbService = new DatabaseService();
const exchangeRateService = new ExchangeRateService(dbService);
const paymentService = new PaymentProcessingService(dbService, exchangeRateService);
const paymentController = new PaymentController(paymentService);

// Payment processing routes
router.post('/process', (req, res) => paymentController.processPayment(req, res));

// Transaction management routes
router.get('/transaction/:transactionId/status', (req, res) => paymentController.getTransactionStatus(req, res));
router.put('/transaction/:transactionId/status', (req, res) => paymentController.updateTransactionStatus(req, res));
router.get('/transaction/:transactionId/fees', (req, res) => paymentController.getTransactionFees(req, res));
router.get('/transaction/:transactionId/conversions', (req, res) => paymentController.getTransactionConversions(req, res));

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'UEX Payment Processing',
    timestamp: new Date().toISOString()
  });
});

// API documentation route
router.get('/', (_req, res) => {
  res.status(200).json({
    service: 'UEX Backend - Multi-Currency Payment Processing',
    version: '1.0.0',
    endpoints: {
      'POST /api/payments/process': 'Process a new payment transaction',
      'GET /api/payments/transaction/:id/status': 'Get transaction status',
      'PUT /api/payments/transaction/:id/status': 'Update transaction status',
      'GET /api/payments/transaction/:id/fees': 'Get transaction fees',
      'GET /api/payments/transaction/:id/conversions': 'Get currency conversions',
      'GET /api/payments/health': 'Health check',
      'GET /api/payments': 'API documentation'
    },
    supported_currencies: ['USD', 'EUR', 'GBP', 'BTC', 'ETH'],
    payment_methods: ['fiat', 'crypto'],
    settlement_methods: ['bank', 'blockchain']
  });
});

export default router; 