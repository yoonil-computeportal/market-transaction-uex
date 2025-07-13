import express from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = express.Router();
const paymentController = new PaymentController();

// Get all payment transactions
router.get('/', paymentController.getAllPayments.bind(paymentController));

// Get specific payment transaction by ID
router.get('/:id', paymentController.getPaymentById.bind(paymentController));

// Get payment transaction status
router.get('/:id/status', paymentController.getPaymentStatus.bind(paymentController));

export default router; 