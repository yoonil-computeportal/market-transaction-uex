/**
 * Database Service Extensions for UEX Integration
 * Adds UEX-specific database methods to support crypto payments
 */

import { db, TABLES } from '../models/Database';
import { PaymentTransaction } from '../types';

export class DatabaseServiceExtensions {
  /**
   * Get transaction by UEX order ID
   */
  async getTransactionByUEXOrderId(uexOrderId: string): Promise<PaymentTransaction | null> {
    const result = await db(TABLES.PAYMENT_TRANSACTIONS)
      .where({ uex_order_id: uexOrderId })
      .first();
    return result || null;
  }

  /**
   * Get all pending UEX transactions (for polling)
   * Returns transactions with UEX order IDs that are not in final state
   */
  async getPendingUEXTransactions(): Promise<PaymentTransaction[]> {
    return await db(TABLES.PAYMENT_TRANSACTIONS)
      .whereNotNull('uex_order_id')
      .whereIn('status', ['pending', 'processing'])
      .orderBy('created_at', 'desc');
  }

  /**
   * Update UEX-specific fields
   */
  async updateTransactionUEXData(
    transactionId: string,
    data: {
      uex_status?: string;
      uex_raw_response?: any;
      uex_webhook_data?: any;
      last_webhook_at?: Date;
      last_poll_at?: Date;
    }
  ): Promise<PaymentTransaction | null> {
    const updates: any = {
      ...data,
      updated_at: new Date()
    };

    // Convert objects to JSON strings for SQLite
    if (data.uex_raw_response) {
      updates.uex_raw_response = JSON.stringify(data.uex_raw_response);
    }
    if (data.uex_webhook_data) {
      updates.uex_webhook_data = JSON.stringify(data.uex_webhook_data);
    }

    const [result] = await db(TABLES.PAYMENT_TRANSACTIONS)
      .where({ id: transactionId })
      .update(updates)
      .returning('*');

    return result || null;
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(): Promise<any> {
    const totalWebhooks = await db(TABLES.PAYMENT_TRANSACTIONS)
      .whereNotNull('last_webhook_at')
      .count('* as count')
      .first();

    const recentWebhooks = await db(TABLES.PAYMENT_TRANSACTIONS)
      .whereNotNull('last_webhook_at')
      .where('last_webhook_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .count('* as count')
      .first();

    const statusCounts = await db(TABLES.PAYMENT_TRANSACTIONS)
      .whereNotNull('uex_order_id')
      .select('status')
      .count('* as count')
      .groupBy('status');

    return {
      total_webhooks_received: totalWebhooks?.count || 0,
      webhooks_last_24h: recentWebhooks?.count || 0,
      status_distribution: statusCounts.reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {})
    };
  }

  /**
   * Get recent exchange rates (for caching)
   */
  async getRecentExchangeRates(limit: number = 100): Promise<any[]> {
    return await db(TABLES.EXCHANGE_RATES)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

// Create singleton instance
export const dbExtensions = new DatabaseServiceExtensions();
