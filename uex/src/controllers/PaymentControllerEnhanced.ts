/**
 * Enhanced Payment Controller with UEX Crypto Integration
 * Handles both fiat and cryptocurrency payment processing
 */

import { Request, Response } from 'express';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { uexService } from '../services/UEXService';
import { PaymentRequest } from '../types';
import {
  InitiateCryptoSwapRequest,
  EstimateConversionRequest,
  GeneratePaymentLinkRequest
} from '../types/uex';

export class PaymentController {
  private paymentService: PaymentProcessingService;

  constructor(paymentService: PaymentProcessingService) {
    this.paymentService = paymentService;
  }

  // ============================================================================
  // Standard Payment Methods (Existing)
  // ============================================================================

  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentRequest: PaymentRequest = req.body;

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
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const transaction = await this.paymentService.getTransactionStatus(transactionId);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
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

      if (!transactionId || !status) {
        res.status(400).json({ error: 'Transaction ID and status are required' });
        return;
      }

      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status', validStatuses });
        return;
      }

      const updatedTransaction = await this.paymentService.updateTransactionStatus(
        transactionId,
        status,
        metadata
      );

      if (!updatedTransaction) {
        res.status(404).json({ error: 'Transaction not found' });
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

  async getAllTransactions(_req: Request, res: Response): Promise<void> {
    try {
      const transactions = await this.paymentService.getAllTransactions();
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  // ============================================================================
  // NEW: Crypto Payment Methods (UEX Integration)
  // ============================================================================

  /**
   * GET /api/payments/currencies
   * Get list of supported cryptocurrencies
   */
  async getSupportedCurrencies(_req: Request, res: Response): Promise<void> {
    try {
      const currencies = await uexService.getCurrencies();

      res.status(200).json({
        success: true,
        count: currencies.length,
        data: currencies
      });

    } catch (error) {
      console.error('Get supported currencies error:', error);

      res.status(500).json({
        error: 'Failed to fetch supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * POST /api/payments/estimate
   * Estimate crypto conversion rate and fees
   */
  async estimateConversion(req: Request, res: Response): Promise<void> {
    try {
      const request: EstimateConversionRequest = req.body;

      // Validate request
      if (!request.from_currency || !request.from_network ||
          !request.to_currency || !request.to_network || !request.amount) {
        res.status(400).json({
          error: 'Missing required fields',
          required: ['from_currency', 'from_network', 'to_currency', 'to_network', 'amount']
        });
        return;
      }

      const estimate = await uexService.estimateConversion(request);

      res.status(200).json({
        success: true,
        data: estimate
      });

    } catch (error) {
      console.error('Estimate conversion error:', error);

      res.status(500).json({
        error: 'Failed to estimate conversion',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * POST /api/payments/crypto/initiate
   * Initiate a cryptocurrency swap via UEX
   */
  async initiateCryptoSwap(req: Request, res: Response): Promise<void> {
    try {
      const request: InitiateCryptoSwapRequest = req.body;

      // Validate request
      if (!request.from_amount || !request.from_currency || !request.from_network ||
          !request.to_currency || !request.to_network || !request.recipient_address) {
        res.status(400).json({
          error: 'Missing required fields',
          required: [
            'from_amount', 'from_currency', 'from_network',
            'to_currency', 'to_network', 'recipient_address'
          ]
        });
        return;
      }

      // Initiate swap via UEX
      const swapResult = await uexService.initiateCryptoSwap(
        request.from_amount,
        request.from_currency,
        request.from_network,
        request.to_currency,
        request.to_network,
        request.recipient_address
      );

      // TODO: Store swap info in database with internal transaction
      // For now, return the UEX swap response

      res.status(201).json({
        success: true,
        data: {
          order_id: swapResult.orderId,
          deposit_address: swapResult.deposit_address,
          deposit_tag: swapResult.deposit_tag,
          qr_code: swapResult.qr_code,
          from_amount: swapResult.from_amount,
          to_amount: swapResult.to_amount,
          exchange_rate: swapResult.exchange_rate,
          status: swapResult.status,
          expires_at: swapResult.expires_at,
          instructions: {
            step1: `Send exactly ${swapResult.from_amount} ${request.from_currency} to the deposit address`,
            step2: swapResult.deposit_tag ? `Include memo/tag: ${swapResult.deposit_tag}` : undefined,
            step3: `You will receive ${swapResult.to_amount} ${request.to_currency} at ${request.recipient_address}`,
            step4: 'Track your order status using the order_id'
          }
        }
      });

    } catch (error) {
      console.error('Initiate crypto swap error:', error);

      res.status(500).json({
        error: 'Failed to initiate crypto swap',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * GET /api/payments/crypto/order/:orderId
   * Get UEX order status
   */
  async getUEXOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const orderStatus = await uexService.getOrderStatus(orderId);

      res.status(200).json({
        success: true,
        data: orderStatus
      });

    } catch (error) {
      console.error('Get UEX order status error:', error);

      res.status(500).json({
        error: 'Failed to get order status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * POST /api/payments/crypto/payment-link
   * Generate merchant payment link (requires OAuth2)
   */
  async generatePaymentLink(req: Request, res: Response): Promise<void> {
    try {
      const request: GeneratePaymentLinkRequest = req.body;

      // Validate request
      if (!request.order_id || !request.item_name || !request.amount) {
        res.status(400).json({
          error: 'Missing required fields',
          required: ['order_id', 'item_name', 'amount']
        });
        return;
      }

      const paymentLink = await uexService.generatePaymentLink(request);

      res.status(201).json({
        success: true,
        data: {
          payment_url: paymentLink.payment_url,
          order_id: request.order_id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      });

    } catch (error) {
      console.error('Generate payment link error:', error);

      res.status(500).json({
        error: 'Failed to generate payment link',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * GET /api/payments/health
   * Health check endpoint with UEX connectivity status
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const uexHealth = await uexService.checkHealth();

      res.status(200).json({
        status: 'healthy',
        service: 'UEX Payment Processing',
        timestamp: new Date().toISOString(),
        integrations: {
          uex_swap_api: uexHealth.swap_api,
          uex_merchant_api: uexHealth.merchant_api,
          cache: uexHealth.cache
        }
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'UEX Payment Processing',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

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
