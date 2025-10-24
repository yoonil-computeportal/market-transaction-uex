/**
 * Transaction Reporting Routes
 *
 * Provides API endpoints for transaction reporting and analytics
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { getTransactionReportingService, TransactionFilter } from '../services/TransactionReportingService';
import { getSellerPayoutService, PayoutFilter } from '../services/SellerPayoutService';
import { errorTracking } from '../services/ErrorTrackingService';

const router = Router();
const dbService = new DatabaseService();
const reportingService = getTransactionReportingService(dbService);
const payoutService = getSellerPayoutService(dbService);

/**
 * GET /api/reports/transactions
 * Get filtered transactions
 *
 * Query parameters:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - status: pending | processing | completed | failed
 * - currency: string
 * - targetCurrency: string
 * - sellerId: string
 * - clientId: string
 * - paymentMethod: crypto | fiat
 * - settlementMethod: blockchain | bank_transfer
 * - minAmount: number
 * - maxAmount: number
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const filter: TransactionFilter = {};

    // Parse query parameters
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }
    if (req.query.targetCurrency) {
      filter.targetCurrency = req.query.targetCurrency as string;
    }
    if (req.query.sellerId) {
      filter.sellerId = req.query.sellerId as string;
    }
    if (req.query.clientId) {
      filter.clientId = req.query.clientId as string;
    }
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod as any;
    }
    if (req.query.settlementMethod) {
      filter.settlementMethod = req.query.settlementMethod as any;
    }
    if (req.query.minAmount) {
      filter.minAmount = parseFloat(req.query.minAmount as string);
    }
    if (req.query.maxAmount) {
      filter.maxAmount = parseFloat(req.query.maxAmount as string);
    }

    const transactions = await reportingService.getTransactions(filter);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      filter: filter,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'report_transactions' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/metrics
 * Get aggregated metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const filter: TransactionFilter = {};

    // Parse query parameters (same as /transactions)
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }
    if (req.query.targetCurrency) {
      filter.targetCurrency = req.query.targetCurrency as string;
    }
    if (req.query.sellerId) {
      filter.sellerId = req.query.sellerId as string;
    }
    if (req.query.clientId) {
      filter.clientId = req.query.clientId as string;
    }

    const metrics = await reportingService.getAggregatedMetrics(filter);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'report_metrics' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/transactions/export
 * Export transactions to CSV
 */
router.get('/transactions/export', async (req: Request, res: Response) => {
  try {
    const filter: TransactionFilter = {};

    // Parse query parameters (same as /transactions)
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }
    if (req.query.targetCurrency) {
      filter.targetCurrency = req.query.targetCurrency as string;
    }
    if (req.query.sellerId) {
      filter.sellerId = req.query.sellerId as string;
    }
    if (req.query.clientId) {
      filter.clientId = req.query.clientId as string;
    }

    const transactions = await reportingService.getTransactions(filter);
    const csv = reportingService.exportToCSV(transactions);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);

    res.send(csv);
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'report_export' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to export transactions',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/analytics
 * Get transaction analytics grouped by time period
 *
 * Query parameters:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - groupBy: day | week | month (default: day)
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

    const analytics = await reportingService.getTransactionAnalytics(startDate, endDate, groupBy);

    res.json({
      success: true,
      data: analytics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        groupBy: groupBy,
      },
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'report_analytics' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/top-sellers
 * Get top sellers by volume
 *
 * Query parameters:
 * - limit: number (default: 10)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
router.get('/top-sellers', async (req: Request, res: Response) => {
  try {
    const filter: TransactionFilter = {};

    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const topSellers = await reportingService.getTopSellers(filter, limit);

    res.json({
      success: true,
      data: topSellers,
      count: topSellers.length,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'report_top_sellers' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top sellers',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/seller/:sellerId/payouts
 * Get seller payouts with filtering
 *
 * Query parameters:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - status: pending | processing | completed | failed
 * - currency: string
 * - minAmount: number
 * - maxAmount: number
 */
router.get('/seller/:sellerId/payouts', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const filter: PayoutFilter = {};

    // Parse query parameters
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }
    if (req.query.minAmount) {
      filter.minAmount = parseFloat(req.query.minAmount as string);
    }
    if (req.query.maxAmount) {
      filter.maxAmount = parseFloat(req.query.maxAmount as string);
    }

    const payouts = await payoutService.getSellerPayouts(sellerId, filter);

    res.json({
      success: true,
      data: payouts,
      count: payouts.length,
      filter: filter,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'seller_payouts' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve seller payouts',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/seller/:sellerId/summary
 * Get seller payout summary
 */
router.get('/seller/:sellerId/summary', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const filter: PayoutFilter = {};

    // Parse query parameters (same as payouts)
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }

    const summary = await payoutService.getSellerPayoutSummary(sellerId, filter);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'seller_payout_summary' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve seller payout summary',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/seller/:sellerId/earnings
 * Calculate seller earnings from completed transactions
 *
 * Query parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
router.get('/seller/:sellerId/earnings', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const earnings = await payoutService.calculateSellerEarnings(sellerId, startDate, endDate);

    res.json({
      success: true,
      data: earnings,
      period: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'seller_earnings' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to calculate seller earnings',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/seller/:sellerId/payouts/export
 * Export seller payouts to CSV
 */
router.get('/seller/:sellerId/payouts/export', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const filter: PayoutFilter = {};

    // Parse query parameters
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as any;
    }
    if (req.query.currency) {
      filter.currency = req.query.currency as string;
    }

    const payouts = await payoutService.getSellerPayouts(sellerId, filter);
    const csv = payoutService.exportPayoutsToCSV(payouts);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=seller-payouts-${sellerId}-${Date.now()}.csv`);

    res.send(csv);
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'seller_payouts_export' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to export seller payouts',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/reports/seller/:sellerId/reconcile
 * Reconcile seller payouts with completed transactions
 */
router.get('/seller/:sellerId/reconcile', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const reconciliation = await payoutService.reconcilePayouts(sellerId);

    res.json({
      success: true,
      data: reconciliation,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'seller_payout_reconciliation' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reconcile seller payouts',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/reports/seller/:sellerId/payout
 * Create a new payout record
 */
router.post('/seller/:sellerId/payout', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { transaction_id, gross_amount, currency, fees_deducted, payout_method } = req.body;

    // Validate required fields
    if (!transaction_id || !gross_amount || !currency || fees_deducted === undefined || !payout_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['transaction_id', 'gross_amount', 'currency', 'fees_deducted', 'payout_method'],
      });
    }

    const payout = await payoutService.createPayout({
      seller_id: sellerId,
      transaction_id,
      gross_amount,
      currency,
      fees_deducted,
      payout_method,
    });

    res.status(201).json({
      success: true,
      data: payout,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'create_payout' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create payout',
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/reports/payout/:payoutId/status
 * Update payout status
 */
router.put('/payout/:payoutId/status', async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;
    const { status, payout_date } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        allowed: ['pending', 'processing', 'completed', 'failed'],
      });
    }

    const payoutDate = payout_date ? new Date(payout_date) : undefined;
    await payoutService.updatePayoutStatus(payoutId, status, payoutDate);

    // Get updated payout
    const updatedPayout = await payoutService.getPayoutById(payoutId);

    res.json({
      success: true,
      data: updatedPayout,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'update_payout_status' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update payout status',
      message: (error as Error).message,
    });
  }
});

export default router;
