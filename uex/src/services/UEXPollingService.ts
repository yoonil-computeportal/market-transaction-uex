/**
 * UEX Polling Service
 * Background service that polls UEX API for order status updates
 *
 * Purpose:
 * - Alternative to webhooks for tracking order status
 * - Polls pending/processing orders every 5 minutes
 * - Updates internal transaction status based on UEX order status
 * - Handles cases where webhooks may fail or be missed
 *
 * Usage:
 *   const pollingService = new UEXPollingService();
 *   pollingService.start(); // Start polling
 *   pollingService.stop();  // Stop polling
 */

import { uexService } from './UEXService';
import { DatabaseService } from './DatabaseService';
import { PaymentProcessingService } from './PaymentProcessingService';
import { ExchangeRateService } from './ExchangeRateServiceEnhanced';

export class UEXPollingService {
  private dbService: DatabaseService;
  private paymentService: PaymentProcessingService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private pollIntervalMs: number;
  private lastPollTime: Date | null = null;
  private stats = {
    totalPolls: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastError: null as string | null
  };

  constructor(pollIntervalMinutes: number = 5) {
    this.dbService = new DatabaseService();
    const exchangeRateService = new ExchangeRateService(this.dbService);
    this.paymentService = new PaymentProcessingService(this.dbService, exchangeRateService);
    this.pollIntervalMs = pollIntervalMinutes * 60 * 1000;
  }

  /**
   * Start the polling service
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[UEXPolling] Service is already running');
      return;
    }

    console.log(`[UEXPolling] Starting polling service (interval: ${this.pollIntervalMs / 60000} minutes)`);

    this.isRunning = true;

    // Run immediately on start
    this.pollOrders();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.pollOrders();
    }, this.pollIntervalMs);
  }

  /**
   * Stop the polling service
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[UEXPolling] Service is not running');
      return;
    }

    console.log('[UEXPolling] Stopping polling service');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Poll UEX for order status updates
   */
  private async pollOrders(): Promise<void> {
    try {
      this.stats.totalPolls++;
      this.lastPollTime = new Date();

      console.log(`[UEXPolling] Starting poll #${this.stats.totalPolls} at ${this.lastPollTime.toISOString()}`);

      // Get all transactions that have UEX order IDs and are not in final state
      const pendingTransactions = await this.dbService.getPendingUEXTransactions();

      console.log(`[UEXPolling] Found ${pendingTransactions.length} pending transactions with UEX orders`);

      if (pendingTransactions.length === 0) {
        console.log('[UEXPolling] No pending transactions to poll');
        return;
      }

      let updated = 0;
      let failed = 0;

      // Poll each transaction
      for (const transaction of pendingTransactions) {
        try {
          if (!transaction.uex_order_id) {
            continue;
          }

          // Get order status from UEX
          const orderStatus = await uexService.getOrderStatus(transaction.uex_order_id);

          console.log(`[UEXPolling] Order ${transaction.uex_order_id}: ${orderStatus.external_status}`);

          // Check if status has changed
          if (orderStatus.external_status !== transaction.uex_status) {
            // Map UEX status to internal status
            const internalStatus = this.mapUEXStatusToInternal(orderStatus.external_status);

            // Update transaction
            const metadata: any = {
              uex_status: orderStatus.external_status,
              uex_polled_at: new Date().toISOString()
            };

            if (orderStatus.tx_hash) {
              metadata.transaction_hash = orderStatus.tx_hash;
            }

            if (orderStatus.deposit_confirmed !== undefined) {
              metadata.deposit_confirmed = orderStatus.deposit_confirmed;
            }

            await this.paymentService.updateTransactionStatus(
              transaction.id,
              internalStatus,
              metadata
            );

            // Update UEX-specific fields
            await this.dbService.updateTransactionUEXData(transaction.id, {
              uex_status: orderStatus.external_status,
              last_poll_at: new Date()
            });

            console.log(`[UEXPolling] Updated transaction ${transaction.id}: ${transaction.uex_status} -> ${orderStatus.external_status}`);
            updated++;
            this.stats.successfulUpdates++;
          }

          // Rate limiting: Wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`[UEXPolling] Error polling transaction ${transaction.id}:`, error);
          failed++;
          this.stats.failedUpdates++;
          this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      console.log(`[UEXPolling] Poll complete: ${updated} updated, ${failed} failed`);

    } catch (error) {
      console.error('[UEXPolling] Error in polling cycle:', error);
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Map UEX status to internal status
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
   * Get polling service statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      pollIntervalMinutes: this.pollIntervalMs / 60000,
      lastPollTime: this.lastPollTime,
      stats: this.stats
    };
  }

  /**
   * Force an immediate poll (useful for testing)
   */
  async pollNow(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Polling service is not running');
    }

    console.log('[UEXPolling] Forcing immediate poll');
    await this.pollOrders();
  }
}

// Export singleton instance
export const uexPollingService = new UEXPollingService(
  parseInt(process.env.UEX_POLL_INTERVAL_MINUTES || '5', 10)
);
