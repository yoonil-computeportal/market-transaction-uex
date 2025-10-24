/**
 * UEX Webhook Controller
 * Handles webhook callbacks from UEX for order status updates
 *
 * Webhook Flow:
 * 1. UEX sends POST request to /api/webhooks/uex/order-update
 * 2. Validate webhook signature (if configured)
 * 3. Update internal transaction status based on UEX order status
 * 4. Send acknowledgment to UEX
 */

import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { UEXOrderStatus } from '../types/uex';
import crypto from 'crypto';

export class UEXWebhookController {
  private dbService: DatabaseService;
  private paymentService: PaymentProcessingService;
  private webhookSecret: string | undefined;

  constructor(
    dbService: DatabaseService,
    paymentService: PaymentProcessingService
  ) {
    this.dbService = dbService;
    this.paymentService = paymentService;
    this.webhookSecret = process.env.UEX_WEBHOOK_SECRET;
  }

  /**
   * POST /api/webhooks/uex/order-update
   * Handle UEX order status update webhook
   */
  async handleOrderUpdate(req: Request, res: Response): Promise<void> {
    try {
      // Validate webhook signature if secret is configured
      if (this.webhookSecret && !this.validateWebhookSignature(req)) {
        console.warn('[Webhook] Invalid signature from UEX');
        res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
        return;
      }

      const webhookData = req.body;

      // Validate webhook payload
      if (!webhookData.order_id || !webhookData.status) {
        console.warn('[Webhook] Invalid payload:', webhookData);
        res.status(400).json({
          success: false,
          error: 'Missing required fields: order_id, status'
        });
        return;
      }

      console.log(`[Webhook] Received order update for ${webhookData.order_id}: ${webhookData.status}`);

      // Find internal transaction by UEX order ID
      const transaction = await this.dbService.getTransactionByUEXOrderId(webhookData.order_id);

      if (!transaction) {
        console.warn(`[Webhook] No transaction found for UEX order ${webhookData.order_id}`);
        // Still return success to prevent webhook retries
        res.status(200).json({
          success: true,
          message: 'Order ID not found in system, acknowledged'
        });
        return;
      }

      // Map UEX status to internal status
      const internalStatus = this.mapUEXStatusToInternal(webhookData.status);

      // Update transaction status
      const metadata: any = {
        uex_status: webhookData.status,
        uex_webhook_received_at: new Date().toISOString()
      };

      if (webhookData.tx_hash) {
        metadata.transaction_hash = webhookData.tx_hash;
      }

      if (webhookData.deposit_confirmed !== undefined) {
        metadata.deposit_confirmed = webhookData.deposit_confirmed;
      }

      if (webhookData.failure_reason) {
        metadata.failure_reason = webhookData.failure_reason;
      }

      await this.paymentService.updateTransactionStatus(
        transaction.id,
        internalStatus,
        metadata
      );

      // Also update UEX-specific fields in database
      await this.dbService.updateTransactionUEXData(transaction.id, {
        uex_status: webhookData.status,
        uex_webhook_data: webhookData,
        last_webhook_at: new Date()
      });

      console.log(`[Webhook] Updated transaction ${transaction.id} to status: ${internalStatus}`);

      // Send success response to UEX
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        transaction_id: transaction.id,
        new_status: internalStatus
      });

    } catch (error) {
      console.error('[Webhook] Error processing order update:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/webhooks/uex/test
   * Test webhook endpoint (for development)
   */
  async testWebhook(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString(),
      signature_validation: !!this.webhookSecret ? 'enabled' : 'disabled'
    });
  }

  /**
   * POST /api/webhooks/uex/simulate
   * Simulate a webhook call (for testing)
   */
  async simulateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, status, tx_hash } = req.body;

      if (!order_id || !status) {
        res.status(400).json({
          error: 'Missing required fields: order_id, status'
        });
        return;
      }

      // Create simulated webhook payload
      const simulatedPayload = {
        order_id,
        status,
        tx_hash: tx_hash || `0x${crypto.randomBytes(32).toString('hex')}`,
        deposit_confirmed: ['Complete', 'Sending'].includes(status),
        updated_at: new Date().toISOString()
      };

      // Create a new request object with the simulated payload
      const simulatedReq = {
        ...req,
        body: simulatedPayload
      };

      // Process the simulated webhook
      await this.handleOrderUpdate(simulatedReq as Request, res);

    } catch (error) {
      console.error('[Webhook] Error simulating webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to simulate webhook'
      });
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Validate webhook signature
   * Uses HMAC-SHA256 to verify the webhook came from UEX
   */
  private validateWebhookSignature(req: Request): boolean {
    if (!this.webhookSecret) {
      return true; // Skip validation if no secret configured
    }

    const signature = req.headers['x-uex-signature'] as string;
    if (!signature) {
      return false;
    }

    // Calculate expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Map UEX order status to internal transaction status
   *
   * UEX Statuses:
   * - Awaiting Deposit
   * - Confirming Deposit
   * - Exchanging
   * - Sending
   * - Complete
   * - Expired
   * - Failed
   * - Refund
   * - Refunding
   * - Refunded
   */
  private mapUEXStatusToInternal(uexStatus: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, any> = {
      'Awaiting Deposit': 'pending',
      'Confirming Deposit': 'processing',
      'Exchanging': 'processing',
      'Sending': 'processing',
      'Complete': 'completed',
      'Expired': 'cancelled',
      'Failed': 'failed',
      'Refund': 'cancelled',
      'Refunding': 'processing',
      'Refunded': 'cancelled'
    };

    return statusMap[uexStatus] || 'pending';
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.dbService.getWebhookStats();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[Webhook] Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook statistics'
      });
    }
  }
}
