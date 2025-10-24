/**
 * Seller Payout Service
 *
 * Manages seller payout tracking and reporting including:
 * - Payout calculation and tracking
 * - Seller earnings history
 * - Payout reconciliation
 * - Fee deductions and net earnings
 * - Payout status tracking
 */

import { DatabaseService } from './DatabaseService';
import { errorTracking } from './ErrorTrackingService';

export interface SellerPayout {
  payout_id: string;
  seller_id: string;
  transaction_id: string;
  gross_amount: number;
  currency: string;
  fees_deducted: number;
  net_amount: number;
  payout_method: string;
  payout_status: 'pending' | 'processing' | 'completed' | 'failed';
  payout_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SellerPayoutSummary {
  seller_id: string;
  total_transactions: number;
  total_gross_amount: number;
  total_fees_deducted: number;
  total_net_amount: number;
  total_pending: number;
  total_completed: number;
  total_failed: number;
  currency_breakdown: Record<string, {
    count: number;
    gross_amount: number;
    net_amount: number;
  }>;
  recent_payouts: SellerPayout[];
}

export interface PayoutFilter {
  startDate?: Date;
  endDate?: Date;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CreatePayoutRequest {
  seller_id: string;
  transaction_id: string;
  gross_amount: number;
  currency: string;
  fees_deducted: number;
  payout_method: string;
}

export class SellerPayoutService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Create a new payout record
   */
  async createPayout(request: CreatePayoutRequest): Promise<SellerPayout> {
    try {
      const db = this.dbService.getDatabase();

      const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const netAmount = request.gross_amount - request.fees_deducted;

      const payout: SellerPayout = {
        payout_id: payoutId,
        seller_id: request.seller_id,
        transaction_id: request.transaction_id,
        gross_amount: request.gross_amount,
        currency: request.currency,
        fees_deducted: request.fees_deducted,
        net_amount: netAmount,
        payout_method: request.payout_method,
        payout_status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Check if seller_payouts table exists, create if not
      const hasTable = await db.schema.hasTable('seller_payouts');
      if (!hasTable) {
        await db.schema.createTable('seller_payouts', (table) => {
          table.string('payout_id').primary();
          table.string('seller_id').notNullable();
          table.string('transaction_id').notNullable();
          table.decimal('gross_amount', 20, 8).notNullable();
          table.string('currency').notNullable();
          table.decimal('fees_deducted', 20, 8).notNullable();
          table.decimal('net_amount', 20, 8).notNullable();
          table.string('payout_method').notNullable();
          table.string('payout_status').notNullable();
          table.timestamp('payout_date').nullable();
          table.timestamp('created_at').notNullable();
          table.timestamp('updated_at').notNullable();
          table.index('seller_id');
          table.index('transaction_id');
          table.index('payout_status');
          table.index('created_at');
        });
      }

      await db('seller_payouts').insert(payout);

      errorTracking.addBreadcrumb({
        message: 'Seller payout created',
        level: 'info',
        category: 'payout',
        data: {
          payout_id: payoutId,
          seller_id: request.seller_id,
          net_amount: netAmount,
        },
      });

      return payout;
    } catch (error) {
      errorTracking.captureDatabaseError(error as Error, {
        operation: 'insert',
        table: 'seller_payouts',
      });
      throw error;
    }
  }

  /**
   * Get seller payouts with filtering
   */
  async getSellerPayouts(
    sellerId: string,
    filter: PayoutFilter = {}
  ): Promise<SellerPayout[]> {
    try {
      const db = this.dbService.getDatabase();

      // Check if table exists
      const hasTable = await db.schema.hasTable('seller_payouts');
      if (!hasTable) {
        return [];
      }

      let query = db('seller_payouts')
        .where('seller_id', sellerId)
        .select('*');

      // Apply filters
      if (filter.startDate) {
        query = query.where('created_at', '>=', filter.startDate);
      }
      if (filter.endDate) {
        query = query.where('created_at', '<=', filter.endDate);
      }
      if (filter.status) {
        query = query.where('payout_status', filter.status);
      }
      if (filter.currency) {
        query = query.where('currency', filter.currency);
      }
      if (filter.minAmount !== undefined) {
        query = query.where('net_amount', '>=', filter.minAmount);
      }
      if (filter.maxAmount !== undefined) {
        query = query.where('net_amount', '<=', filter.maxAmount);
      }

      query = query.orderBy('created_at', 'desc');

      const payouts = await query;

      return payouts;
    } catch (error) {
      errorTracking.captureDatabaseError(error as Error, {
        operation: 'select',
        table: 'seller_payouts',
      });
      throw error;
    }
  }

  /**
   * Get seller payout summary
   */
  async getSellerPayoutSummary(
    sellerId: string,
    filter: PayoutFilter = {}
  ): Promise<SellerPayoutSummary> {
    try {
      const payouts = await this.getSellerPayouts(sellerId, filter);

      const summary: SellerPayoutSummary = {
        seller_id: sellerId,
        total_transactions: payouts.length,
        total_gross_amount: 0,
        total_fees_deducted: 0,
        total_net_amount: 0,
        total_pending: 0,
        total_completed: 0,
        total_failed: 0,
        currency_breakdown: {},
        recent_payouts: payouts.slice(0, 10),
      };

      payouts.forEach((payout) => {
        summary.total_gross_amount += payout.gross_amount;
        summary.total_fees_deducted += payout.fees_deducted;
        summary.total_net_amount += payout.net_amount;

        // Status counts
        switch (payout.payout_status) {
          case 'pending':
            summary.total_pending++;
            break;
          case 'completed':
            summary.total_completed++;
            break;
          case 'failed':
            summary.total_failed++;
            break;
        }

        // Currency breakdown
        if (!summary.currency_breakdown[payout.currency]) {
          summary.currency_breakdown[payout.currency] = {
            count: 0,
            gross_amount: 0,
            net_amount: 0,
          };
        }
        summary.currency_breakdown[payout.currency].count++;
        summary.currency_breakdown[payout.currency].gross_amount += payout.gross_amount;
        summary.currency_breakdown[payout.currency].net_amount += payout.net_amount;
      });

      return summary;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'seller_payout_summary' },
      });
      throw error;
    }
  }

  /**
   * Update payout status
   */
  async updatePayoutStatus(
    payoutId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    payoutDate?: Date
  ): Promise<void> {
    try {
      const db = this.dbService.getDatabase();

      const updateData: any = {
        payout_status: status,
        updated_at: new Date(),
      };

      if (payoutDate) {
        updateData.payout_date = payoutDate;
      } else if (status === 'completed') {
        updateData.payout_date = new Date();
      }

      await db('seller_payouts')
        .where('payout_id', payoutId)
        .update(updateData);

      errorTracking.addBreadcrumb({
        message: 'Payout status updated',
        level: 'info',
        category: 'payout',
        data: {
          payout_id: payoutId,
          status,
        },
      });
    } catch (error) {
      errorTracking.captureDatabaseError(error as Error, {
        operation: 'update',
        table: 'seller_payouts',
      });
      throw error;
    }
  }

  /**
   * Get payout by ID
   */
  async getPayoutById(payoutId: string): Promise<SellerPayout | null> {
    try {
      const db = this.dbService.getDatabase();

      // Check if table exists
      const hasTable = await db.schema.hasTable('seller_payouts');
      if (!hasTable) {
        return null;
      }

      const payout = await db('seller_payouts')
        .where('payout_id', payoutId)
        .first();

      return payout || null;
    } catch (error) {
      errorTracking.captureDatabaseError(error as Error, {
        operation: 'select',
        table: 'seller_payouts',
      });
      throw error;
    }
  }

  /**
   * Calculate seller earnings from completed transactions
   */
  async calculateSellerEarnings(
    sellerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_transactions: number;
    total_gross_earnings: number;
    total_fees: number;
    total_net_earnings: number;
  }> {
    try {
      const db = this.dbService.getDatabase();

      let query = db('payment_transactions')
        .where('seller_id', sellerId)
        .where('status', 'completed');

      if (startDate) {
        query = query.where('created_at', '>=', startDate);
      }
      if (endDate) {
        query = query.where('created_at', '<=', endDate);
      }

      const transactions = await query.select(
        'target_amount',
        'uex_seller_fee',
        'platform_fee'
      );

      const earnings = {
        total_transactions: transactions.length,
        total_gross_earnings: 0,
        total_fees: 0,
        total_net_earnings: 0,
      };

      transactions.forEach((tx) => {
        earnings.total_gross_earnings += tx.target_amount;
        earnings.total_fees += tx.uex_seller_fee + tx.platform_fee;
      });

      earnings.total_net_earnings = earnings.total_gross_earnings - earnings.total_fees;

      return earnings;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'calculate_seller_earnings' },
      });
      throw error;
    }
  }

  /**
   * Get pending payouts for a seller
   */
  async getPendingPayouts(sellerId: string): Promise<SellerPayout[]> {
    return this.getSellerPayouts(sellerId, { status: 'pending' });
  }

  /**
   * Export seller payouts to CSV
   */
  exportPayoutsToCSV(payouts: SellerPayout[]): string {
    try {
      if (payouts.length === 0) {
        return 'No data to export';
      }

      // CSV headers
      const headers = [
        'Payout ID',
        'Seller ID',
        'Transaction ID',
        'Gross Amount',
        'Currency',
        'Fees Deducted',
        'Net Amount',
        'Payout Method',
        'Status',
        'Payout Date',
        'Created At',
      ];

      // CSV rows
      const rows = payouts.map((payout) => [
        payout.payout_id,
        payout.seller_id,
        payout.transaction_id,
        payout.gross_amount,
        payout.currency,
        payout.fees_deducted,
        payout.net_amount,
        payout.payout_method,
        payout.payout_status,
        payout.payout_date ? new Date(payout.payout_date).toISOString() : '',
        new Date(payout.created_at).toISOString(),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      errorTracking.addBreadcrumb({
        message: 'Seller payouts exported to CSV',
        level: 'info',
        category: 'payout',
        data: { rowCount: payouts.length },
      });

      return csvContent;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'csv_export' },
      });
      throw error;
    }
  }

  /**
   * Reconcile payouts with transactions
   * Ensures all completed transactions have corresponding payouts
   */
  async reconcilePayouts(sellerId: string): Promise<{
    missing_payouts: string[];
    total_missing: number;
    total_amount: number;
  }> {
    try {
      const db = this.dbService.getDatabase();

      // Get completed transactions
      const completedTransactions = await db('payment_transactions')
        .where('seller_id', sellerId)
        .where('status', 'completed')
        .select('transaction_id', 'target_amount', 'uex_seller_fee', 'platform_fee');

      // Get existing payouts
      const existingPayouts = await this.getSellerPayouts(sellerId);
      const payoutTransactionIds = new Set(existingPayouts.map(p => p.transaction_id));

      // Find missing payouts
      const missingPayouts = completedTransactions.filter(
        tx => !payoutTransactionIds.has(tx.transaction_id)
      );

      const totalAmount = missingPayouts.reduce((sum, tx) => {
        const netAmount = tx.target_amount - (tx.uex_seller_fee + tx.platform_fee);
        return sum + netAmount;
      }, 0);

      return {
        missing_payouts: missingPayouts.map(tx => tx.transaction_id),
        total_missing: missingPayouts.length,
        total_amount: totalAmount,
      };
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'reconcile_payouts' },
      });
      throw error;
    }
  }
}

// Singleton instance
let sellerPayoutServiceInstance: SellerPayoutService | null = null;

export function getSellerPayoutService(dbService: DatabaseService): SellerPayoutService {
  if (!sellerPayoutServiceInstance) {
    sellerPayoutServiceInstance = new SellerPayoutService(dbService);
  }
  return sellerPayoutServiceInstance;
}
