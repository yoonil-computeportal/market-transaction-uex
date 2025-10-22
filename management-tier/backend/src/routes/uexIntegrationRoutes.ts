import { Router, Request, Response } from 'express';
import axios from 'axios';

// UEX Backend API Configuration
const UEX_API_BASE_URL = process.env['UEX_API_URL'] || 'http://localhost:3903/api';

// Create axios instance for UEX API
const uexApi = axios.create({
  baseURL: UEX_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const router = Router();

/**
 * @route GET /api/uex/health
 * @desc Check UEX backend health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const response = await uexApi.get('/payments/health');
    res.status(200).json({
      success: true,
      data: response.data,
      message: 'UEX backend health check successful'
    });
  } catch (error: any) {
    console.error('UEX Health check error:', error);
    res.status(503).json({
      error: 'UEX backend is not available',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/transactions
 * @desc Get all UEX transactions with optional filtering
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, limit = '50', offset = '0' } = req.query;
    
    // For now, we'll return mock data since UEX doesn't have a bulk transaction endpoint
    // In a real implementation, this would call UEX's transaction listing endpoint
    const mockTransactions = [
      {
        id: 'txn-001',
        client_id: 'client123',
        seller_id: 'seller456',
        amount: 100.00,
        currency: 'USD',
        target_currency: 'EUR',
        status: 'completed',
        payment_method: 'fiat',
        settlement_method: 'bank',
        created_at: new Date().toISOString(),
        total_amount: 103.00,
        conversion_rate: 0.85
      },
      {
        id: 'txn-002',
        client_id: 'client124',
        seller_id: 'seller457',
        amount: 50.00,
        currency: 'USD',
        target_currency: 'BTC',
        status: 'processing',
        payment_method: 'fiat',
        settlement_method: 'blockchain',
        created_at: new Date().toISOString(),
        total_amount: 53.00,
        conversion_rate: 0.000025
      }
    ];

    // Apply filters
    let filteredTransactions = mockTransactions;
    
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredTransactions = filteredTransactions.filter(t => {
        const createdAt = new Date(t.created_at);
        return createdAt >= start && createdAt <= end;
      });
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedTransactions = filteredTransactions.slice(offsetNum, offsetNum + limitNum);

    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          total: filteredTransactions.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < filteredTransactions.length
        }
      }
    });
  } catch (error: any) {
    console.error('UEX Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/transaction/:id
 * @desc Get specific UEX transaction details
 */
router.get('/transaction/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }

    const response = await uexApi.get(`/payments/transaction/${id}/status`);
    
    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error: any) {
    console.error('UEX Get transaction error:', error);
    return res.status(404).json({
      error: 'Transaction not found',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/transaction/:id/fees
 * @desc Get transaction fees breakdown
 */
router.get('/transaction/:id/fees', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }

    const response = await uexApi.get(`/payments/transaction/${id}/fees`);
    
    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error: any) {
    console.error('UEX Get transaction fees error:', error);
    return res.status(500).json({
      error: 'Failed to get transaction fees',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/transaction/:id/conversions
 * @desc Get currency conversion details
 */
router.get('/transaction/:id/conversions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }

    const response = await uexApi.get(`/payments/transaction/${id}/conversions`);
    
    return res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error: any) {
    console.error('UEX Get transaction conversions error:', error);
    return res.status(500).json({
      error: 'Failed to get transaction conversions',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/uex/transaction/:id/status
 * @desc Update transaction status (admin function)
 */
router.put('/transaction/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body;
    
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    const response = await uexApi.put(`/payments/transaction/${id}/status`, {
      status,
      metadata
    });
    
    return res.status(200).json({
      success: true,
      data: response.data.data,
      message: 'Transaction status updated successfully'
    });
  } catch (error: any) {
    console.error('UEX Update transaction status error:', error);
    return res.status(500).json({
      error: 'Failed to update transaction status',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/analytics
 * @desc Get UEX transaction analytics and metrics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, currency } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        required: ['startDate', 'endDate']
      });
    }

    // Mock analytics data - in real implementation, this would aggregate from UEX database
    const analytics = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        total_transactions: 150,
        total_volume: 25000,
        average_amount: 166.67,
        completed_transactions: 145,
        failed_transactions: 5,
        success_rate: 96.67
      },
      currency_breakdown: {
        USD: { count: 60, volume: 12000 },
        EUR: { count: 25, volume: 5000 },
        GBP: { count: 10, volume: 2000 },
        BTC: { count: 3, volume: 3000 },
        ETH: { count: 2, volume: 1000 }
      },
      payment_method_breakdown: {
        fiat: { count: 95, volume: 19000 },
        crypto: { count: 5, volume: 6000 }
      },
      settlement_method_breakdown: {
        bank: { count: 90, volume: 18000 },
        blockchain: { count: 10, volume: 7000 }
      },
      daily_trends: [
        { date: '2025-07-10', transactions: 25, volume: 4200 },
        { date: '2025-07-11', transactions: 30, volume: 5100 },
        { date: '2025-07-12', transactions: 28, volume: 4800 },
        { date: '2025-07-13', transactions: 35, volume: 5900 }
      ]
    };

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('UEX Analytics error:', error);
    return res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/fees/summary
 * @desc Get fee collection summary
 */
router.get('/fees/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        required: ['startDate', 'endDate']
      });
    }

    // Mock fee summary data
    const feeSummary = {
      period: {
        start: startDate,
        end: endDate
      },
      total_fees: 750.00,
      fee_breakdown: {
        conversion_fees: 500.00,
        management_fees: 250.00
      },
      currency_breakdown: {
        USD: 450.00,
        EUR: 200.00,
        GBP: 100.00
      },
      average_fee_per_transaction: 5.00,
      fee_trends: [
        { date: '2025-07-10', fees: 125.00 },
        { date: '2025-07-11', fees: 150.00 },
        { date: '2025-07-12', fees: 140.00 },
        { date: '2025-07-13', fees: 175.00 }
      ]
    };

    return res.status(200).json({
      success: true,
      data: feeSummary
    });
  } catch (error: any) {
    console.error('UEX Fee summary error:', error);
    return res.status(500).json({
      error: 'Failed to get fee summary',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/supported-currencies
 * @desc Get list of supported currencies
 */
router.get('/supported-currencies', async (req: Request, res: Response) => {
  try {
    const response = await uexApi.get('/payments');
    const supportedCurrencies = response.data.supported_currencies || ['USD', 'EUR', 'GBP', 'BTC', 'ETH'];
    
    return res.status(200).json({
      success: true,
      data: {
        currencies: supportedCurrencies,
        payment_methods: response.data.payment_methods || ['fiat', 'crypto'],
        settlement_methods: response.data.settlement_methods || ['bank', 'blockchain']
      }
    });
  } catch (error: any) {
    console.error('UEX Supported currencies error:', error);
    return res.status(500).json({
      error: 'Failed to get supported currencies',
      message: error.message
    });
  }
});

export default router; 