/**
 * Transaction Reporting Service
 *
 * Provides comprehensive transaction reporting capabilities including:
 * - Filtering transactions by date, status, currency, seller, client
 * - Aggregated metrics (volume, fees, counts)
 * - Export functionality (JSON, CSV)
 * - Transaction analytics
 */

import { DatabaseService } from './DatabaseService';
import { db } from '../models/Database';
import { errorTracking } from './ErrorTrackingService';

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  currency?: string;
  targetCurrency?: string;
  sellerId?: string;
  clientId?: string;
  paymentMethod?: 'crypto' | 'fiat';
  settlementMethod?: 'blockchain' | 'bank_transfer';
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionReportData {
  transaction_id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  target_amount: number;
  payment_method: string;
  settlement_method: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  uex_order_id?: string;
  uex_buyer_fee: number;
  uex_seller_fee: number;
  platform_fee: number;
  transaction_hash?: string;
}

export interface AggregatedMetrics {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  totalUEXBuyerFees: number;
  totalUEXSellerFees: number;
  totalPlatformFees: number;
  averageTransactionAmount: number;
  statusBreakdown: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  currencyBreakdown: Record<string, {
    count: number;
    volume: number;
  }>;
}

export class TransactionReportingService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Get transactions with filtering
   */
  async getTransactions(filter: TransactionFilter = {}): Promise<TransactionReportData[]> {
    try {
      let query = db('payment_transactions')
        .select(
          'transaction_id',
          'client_id',
          'seller_id',
          'amount',
          'currency',
          'target_currency',
          'target_amount',
          'payment_method',
          'settlement_method',
          'status',
          'created_at',
          'updated_at',
          'uex_order_id',
          'uex_buyer_fee',
          'uex_seller_fee',
          'platform_fee',
          'transaction_hash'
        );

      // Apply filters
      if (filter.startDate) {
        query = query.where('created_at', '>=', filter.startDate);
      }
      if (filter.endDate) {
        query = query.where('created_at', '<=', filter.endDate);
      }
      if (filter.status) {
        query = query.where('status', filter.status);
      }
      if (filter.currency) {
        query = query.where('currency', filter.currency);
      }
      if (filter.targetCurrency) {
        query = query.where('target_currency', filter.targetCurrency);
      }
      if (filter.sellerId) {
        query = query.where('seller_id', filter.sellerId);
      }
      if (filter.clientId) {
        query = query.where('client_id', filter.clientId);
      }
      if (filter.paymentMethod) {
        query = query.where('payment_method', filter.paymentMethod);
      }
      if (filter.settlementMethod) {
        query = query.where('settlement_method', filter.settlementMethod);
      }
      if (filter.minAmount !== undefined) {
        query = query.where('amount', '>=', filter.minAmount);
      }
      if (filter.maxAmount !== undefined) {
        query = query.where('amount', '<=', filter.maxAmount);
      }

      query = query.orderBy('created_at', 'desc');

      const transactions = await query;

      errorTracking.addBreadcrumb({
        message: 'Transactions retrieved for report',
        level: 'info',
        category: 'reporting',
        data: {
          count: transactions.length,
          filter: JSON.stringify(filter),
        },
      });

      return transactions;
    } catch (error) {
      errorTracking.captureDatabaseError(error as Error, {
        operation: 'select',
        table: 'payment_transactions',
      });
      throw error;
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(filter: TransactionFilter = {}): Promise<AggregatedMetrics> {
    try {
      const transactions = await this.getTransactions(filter);

      const metrics: AggregatedMetrics = {
        totalTransactions: transactions.length,
        totalVolume: 0,
        totalFees: 0,
        totalUEXBuyerFees: 0,
        totalUEXSellerFees: 0,
        totalPlatformFees: 0,
        averageTransactionAmount: 0,
        statusBreakdown: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        },
        currencyBreakdown: {},
      };

      transactions.forEach((tx) => {
        // Volume and fees
        metrics.totalVolume += tx.amount;
        metrics.totalUEXBuyerFees += tx.uex_buyer_fee;
        metrics.totalUEXSellerFees += tx.uex_seller_fee;
        metrics.totalPlatformFees += tx.platform_fee;
        metrics.totalFees += tx.uex_buyer_fee + tx.uex_seller_fee + tx.platform_fee;

        // Status breakdown
        if (tx.status in metrics.statusBreakdown) {
          metrics.statusBreakdown[tx.status as keyof typeof metrics.statusBreakdown]++;
        }

        // Currency breakdown
        if (!metrics.currencyBreakdown[tx.currency]) {
          metrics.currencyBreakdown[tx.currency] = {
            count: 0,
            volume: 0,
          };
        }
        metrics.currencyBreakdown[tx.currency].count++;
        metrics.currencyBreakdown[tx.currency].volume += tx.amount;
      });

      if (metrics.totalTransactions > 0) {
        metrics.averageTransactionAmount = metrics.totalVolume / metrics.totalTransactions;
      }

      return metrics;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'aggregated_metrics' },
      });
      throw error;
    }
  }

  /**
   * Export transactions to CSV format
   */
  exportToCSV(transactions: TransactionReportData[]): string {
    try {
      if (transactions.length === 0) {
        return 'No data to export';
      }

      // CSV headers
      const headers = [
        'Transaction ID',
        'Client ID',
        'Seller ID',
        'Amount',
        'Currency',
        'Target Currency',
        'Target Amount',
        'Payment Method',
        'Settlement Method',
        'Status',
        'UEX Order ID',
        'UEX Buyer Fee',
        'UEX Seller Fee',
        'Platform Fee',
        'Transaction Hash',
        'Created At',
        'Updated At',
      ];

      // CSV rows
      const rows = transactions.map((tx) => [
        tx.transaction_id,
        tx.client_id,
        tx.seller_id,
        tx.amount,
        tx.currency,
        tx.target_currency,
        tx.target_amount,
        tx.payment_method,
        tx.settlement_method,
        tx.status,
        tx.uex_order_id || '',
        tx.uex_buyer_fee,
        tx.uex_seller_fee,
        tx.platform_fee,
        tx.transaction_hash || '',
        new Date(tx.created_at).toISOString(),
        new Date(tx.updated_at).toISOString(),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      errorTracking.addBreadcrumb({
        message: 'Transactions exported to CSV',
        level: 'info',
        category: 'reporting',
        data: { rowCount: transactions.length },
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
   * Get transaction analytics for a specific period
   */
  async getTransactionAnalytics(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ period: string; count: number; volume: number; fees: number }>> {
    try {
      const transactions = await this.getTransactions({ startDate, endDate });

      // Group transactions by period
      const grouped = new Map<string, { count: number; volume: number; fees: number }>();

      transactions.forEach((tx) => {
        const date = new Date(tx.created_at);
        let periodKey: string;

        switch (groupBy) {
          case 'day':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'week':
            const week = this.getWeekNumber(date);
            periodKey = `${date.getFullYear()}-W${week}`;
            break;
          case 'month':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!grouped.has(periodKey)) {
          grouped.set(periodKey, { count: 0, volume: 0, fees: 0 });
        }

        const data = grouped.get(periodKey)!;
        data.count++;
        data.volume += tx.amount;
        data.fees += tx.uex_buyer_fee + tx.uex_seller_fee + tx.platform_fee;
      });

      // Convert to array and sort by period
      const analytics = Array.from(grouped.entries())
        .map(([period, data]) => ({
          period,
          ...data,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return analytics;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'transaction_analytics' },
      });
      throw error;
    }
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get top sellers by volume
   */
  async getTopSellers(
    filter: TransactionFilter = {},
    limit: number = 10
  ): Promise<Array<{ seller_id: string; transaction_count: number; total_volume: number; total_fees_earned: number }>> {
    try {
      const transactions = await this.getTransactions({ ...filter, status: 'completed' });

      // Group by seller
      const sellerStats = new Map<string, { count: number; volume: number; fees: number }>();

      transactions.forEach((tx) => {
        if (!sellerStats.has(tx.seller_id)) {
          sellerStats.set(tx.seller_id, { count: 0, volume: 0, fees: 0 });
        }

        const stats = sellerStats.get(tx.seller_id)!;
        stats.count++;
        stats.volume += tx.target_amount;
        stats.fees += tx.uex_seller_fee + tx.platform_fee;
      });

      // Convert to array and sort by volume
      const topSellers = Array.from(sellerStats.entries())
        .map(([seller_id, stats]) => ({
          seller_id,
          transaction_count: stats.count,
          total_volume: stats.volume,
          total_fees_earned: stats.fees,
        }))
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, limit);

      return topSellers;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'top_sellers' },
      });
      throw error;
    }
  }
}

// Singleton instance
let transactionReportingServiceInstance: TransactionReportingService | null = null;

export function getTransactionReportingService(dbService: DatabaseService): TransactionReportingService {
  if (!transactionReportingServiceInstance) {
    transactionReportingServiceInstance = new TransactionReportingService(dbService);
  }
  return transactionReportingServiceInstance;
}
