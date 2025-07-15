import { Router, Request, Response } from 'express';
import { UEXIntegrationService, UEXPaymentRequest } from '../services/UEXIntegrationService';

const router = Router();

/**
 * @route GET /api/uex/transactions
 * @desc Get all transactions from UEX backend
 */
router.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const transactions = await UEXIntegrationService.getAllTransactions();
    
    res.status(200).json({
      success: true,
      data: transactions,
      message: 'Retrieved all transactions from UEX backend'
    });
  } catch (error: any) {
    console.error('UEX Get all transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transactions from UEX backend',
      message: error.message
    });
  }
});

/**
 * @route POST /api/uex/process-payment
 * @desc Process a payment through UEX backend
 */
router.post('/process-payment', async (req: Request, res: Response) => {
  try {
    const paymentRequest: UEXPaymentRequest = req.body;
    
    // Validate required fields
    if (!paymentRequest.client_id || !paymentRequest.seller_id || !paymentRequest.amount) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['client_id', 'seller_id', 'amount', 'currency', 'target_currency', 'payment_method', 'settlement_method']
      });
      return;
    }

    const result = await UEXIntegrationService.processPayment(paymentRequest);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Payment processed successfully through UEX backend'
    });
  } catch (error: any) {
    console.error('UEX Payment processing error:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/transaction/:id/status
 * @desc Get transaction status from UEX backend
 */
router.get('/transaction/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }
    const status = await UEXIntegrationService.getTransactionStatus(id);
    
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('UEX Get transaction status error:', error);
    return res.status(404).json({
      error: 'Transaction not found',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/uex/transaction/:id/status
 * @desc Update transaction status in UEX backend
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

    const result = await UEXIntegrationService.updateTransactionStatus(id, status, metadata);
    
    return res.status(200).json({
      success: true,
      data: result,
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
 * @route GET /api/uex/transaction/:id/fees
 * @desc Get transaction fees from UEX backend
 */
router.get('/transaction/:id/fees', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }
    const fees = await UEXIntegrationService.getTransactionFees(id);
    
    return res.status(200).json({
      success: true,
      data: fees
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
 * @desc Get currency conversions from UEX backend
 */
router.get('/transaction/:id/conversions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }
    const conversions = await UEXIntegrationService.getTransactionConversions(id);
    
    return res.status(200).json({
      success: true,
      data: conversions
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
 * @route POST /api/uex/transaction/:id/settle
 * @desc Process settlement for a transaction
 */
router.post('/transaction/:id/settle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const settlementData = req.body;
    
    if (!id) {
      return res.status(400).json({
        error: 'Transaction ID is required'
      });
    }
    
    const result = await UEXIntegrationService.processSettlement(id, settlementData);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Settlement processed successfully'
    });
  } catch (error: any) {
    console.error('UEX Settlement processing error:', error);
    return res.status(500).json({
      error: 'Settlement processing failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/health
 * @desc Check UEX backend health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await UEXIntegrationService.checkHealth();
    
    return res.status(200).json({
      success: true,
      data: health,
      message: 'UEX backend is healthy'
    });
  } catch (error: any) {
    console.error('UEX Health check error:', error);
    return res.status(503).json({
      error: 'UEX backend is not available',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/info
 * @desc Get UEX API information
 */
router.get('/info', async (_req: Request, res: Response) => {
  try {
    const info = await UEXIntegrationService.getApiInfo();
    
    return res.status(200).json({
      success: true,
      data: info
    });
  } catch (error: any) {
    console.error('UEX API info error:', error);
    return res.status(500).json({
      error: 'Failed to get UEX API information',
      message: error.message
    });
  }
});

/**
 * @route GET /api/uex/analytics
 * @desc Get transaction analytics from UEX backend
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        required: ['startDate', 'endDate']
      });
    }

    const analytics = await UEXIntegrationService.getTransactionAnalytics(
      startDate as string, 
      endDate as string
    );
    
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

export default router; 