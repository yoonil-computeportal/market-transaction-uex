import express from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = express.Router();
const paymentController = new PaymentController();

// Get all payment transactions
router.get('/', paymentController.getAllPayments);

// Get specific payment transaction by ID
router.get('/:id', paymentController.getPaymentById);

// Get payment transaction status
router.get('/:id/status', paymentController.getPaymentStatus);

export default router; 