import { Request, Response } from 'express';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { PaymentRequest } from '../types';

export class PaymentController {
  private paymentService: PaymentProcessingService;

  constructor(paymentService: PaymentProcessingService) {
    this.paymentService = paymentService;
  }

  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentRequest: PaymentRequest = req.body;

      // Validate request body
      if (!this.validatePaymentRequest(paymentRequest)) {
        res.status(400).json({
          error: 'Invalid payment request',
          details: 'Missing required fields or invalid data format'
        });
        return;
      }

      const result = await this.paymentService.processPayment(paymentRequest);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Payment processing error:', error);
      
      res.status(500).json({
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({
          error: 'Transaction ID is required'
        });
        return;
      }

      const transaction = await this.paymentService.getTransactionStatus(transactionId);

      if (!transaction) {
        res.status(404).json({
          error: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction status error:', error);
      
      res.status(500).json({
        error: 'Failed to get transaction status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async updateTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { status, metadata } = req.body;

      if (!transactionId) {
        res.status(400).json({
          error: 'Transaction ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          error: 'Status is required'
        });
        return;
      }

      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: 'Invalid status',
          validStatuses
        });
        return;
      }

      const updatedTransaction = await this.paymentService.updateTransactionStatus(
        transactionId, 
        status, 
        metadata
      );

      if (!updatedTransaction) {
        res.status(404).json({
          error: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedTransaction
      });

    } catch (error) {
      console.error('Update transaction status error:', error);
      
      res.status(500).json({
        error: 'Failed to update transaction status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getTransactionFees(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({
          error: 'Transaction ID is required'
        });
        return;
      }

      const fees = await this.paymentService.getTransactionFees(transactionId);

      res.status(200).json({
        success: true,
        data: fees
      });

    } catch (error) {
      console.error('Get transaction fees error:', error);
      
      res.status(500).json({
        error: 'Failed to get transaction fees',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getTransactionConversions(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({
          error: 'Transaction ID is required'
        });
        return;
      }

      const conversions = await this.paymentService.getTransactionConversions(transactionId);

      res.status(200).json({
        success: true,
        data: conversions
      });

    } catch (error) {
      console.error('Get transaction conversions error:', error);
      
      res.status(500).json({
        error: 'Failed to get transaction conversions',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  private validatePaymentRequest(request: any): request is PaymentRequest {
    return !!(
      request &&
      typeof request.client_id === 'string' &&
      typeof request.seller_id === 'string' &&
      typeof request.amount === 'number' &&
      typeof request.currency === 'string' &&
      typeof request.target_currency === 'string' &&
      typeof request.payment_method === 'string' &&
      typeof request.settlement_method === 'string' &&
      request.amount > 0 &&
      ['fiat', 'crypto'].includes(request.payment_method) &&
      ['bank', 'blockchain'].includes(request.settlement_method)
    );
  }
} 