import { Router, Request, Response } from 'express';
import { 
  sellerPayouts, 
  transactionNotifications, 
  calculateFees, 
  addPayout, 
  addTransactionNotification,
  getPayoutByTransactionId,
  getPayoutsBySellerId,
  getRecentPayouts,
  getPayoutStats
} from '../data/payouts';
import { addSellerTransaction, createTransactionFromNotification } from '../data/transactions';
import { ApiResponse, TransactionCompletionNotification, SellerPayout, FeeCalculation } from '../types';

const router = Router();

// POST /api/payouts/transaction-completed - Handle transaction completion notification from UEX
router.post('/transaction-completed', (req: Request, res: Response) => {
  try {
    const {
      transaction_id,
      seller_id,
      item_id,
      item_name,
      original_amount,
      currency,
      payment_method,
      client_id,
      order_id
    } = req.body;

    // Validate required fields
    if (!transaction_id || !seller_id || !item_id || !original_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'transaction_id, seller_id, item_id, and original_amount are required'
      });
    }

    // Calculate fees
    const feeCalculation = calculateFees(original_amount, currency);
    
    // Create transaction completion notification
    const notification: TransactionCompletionNotification = {
      transaction_id,
      seller_id,
      item_id,
      item_name: item_name || 'Unknown Item',
      original_amount,
      currency,
      payment_method: payment_method || 'unknown',
      completed_at: new Date().toISOString(),
      fees: {
        management_tier_fee: feeCalculation.management_tier_fee,
        uex_fee: feeCalculation.uex_fee,
        total_fees: feeCalculation.total_fees
      },
      seller_payout_amount: feeCalculation.seller_payout_amount,
      client_id: client_id || 'unknown',
      order_id
    };

    // Create payout record
    const payout: SellerPayout = {
      transaction_id,
      seller_id,
      item_id,
      item_name: item_name || 'Unknown Item',
      original_amount,
      seller_payout_amount: feeCalculation.seller_payout_amount,
      currency,
      fees_breakdown: {
        management_tier_fee: feeCalculation.management_tier_fee,
        uex_fee: feeCalculation.uex_fee,
        total_fees: feeCalculation.total_fees
      },
      completed_at: new Date().toISOString(),
      status: 'pending',
      payout_method: 'automatic',
      payout_reference: `PAY-${new Date().getFullYear()}-${String(transactionNotifications.length + 1).padStart(3, '0')}`
    };

    // Add to data stores
    addTransactionNotification(notification);
    addPayout(payout);

    // 🔄 AUTOMATICALLY ADD TRANSACTION TO SELLER'S TRANSACTION LIST
    const sellerTransaction = createTransactionFromNotification(
      transaction_id,
      seller_id,
      item_id,
      item_name || 'Unknown Item',
      original_amount,
      currency,
      payment_method || 'unknown',
      client_id || 'unknown',
      notification.completed_at,
      {
        management_tier_fee: feeCalculation.management_tier_fee,
        uex_fee: feeCalculation.uex_fee,
        total_fees: feeCalculation.total_fees
      }
    );
    addSellerTransaction(sellerTransaction);

    console.log(`Transaction completed: ${transaction_id} - Seller payout: $${feeCalculation.seller_payout_amount}`);
    console.log(`✅ Transaction automatically added to seller's transaction list: ${transaction_id}`);

    const response: ApiResponse<{
      notification: TransactionCompletionNotification;
      payout: SellerPayout;
      fee_breakdown: FeeCalculation;
    }> = {
      success: true,
      data: {
        notification,
        payout,
        fee_breakdown: feeCalculation
      },
      message: `Transaction ${transaction_id} completed successfully. Seller payout: $${feeCalculation.seller_payout_amount}`
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Transaction completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process transaction completion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts - Get all payouts
router.get('/', (req: Request, res: Response) => {
  try {
    const { seller_id, status, limit = '50', offset = '0' } = req.query;
    
    let filteredPayouts = [...sellerPayouts];
    
    // Filter by seller
    if (seller_id && typeof seller_id === 'string') {
      filteredPayouts = getPayoutsBySellerId(seller_id);
    }
    
    // Filter by status
    if (status && typeof status === 'string') {
      filteredPayouts = filteredPayouts.filter(p => p.status === status);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedPayouts = filteredPayouts.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<typeof paginatedPayouts> = {
      success: true,
      data: paginatedPayouts,
      message: `Retrieved ${paginatedPayouts.length} payouts`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payouts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts/stats - Get payout statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { seller_id = 'cloud-provider-b' } = req.query;
    const stats = getPayoutStats(seller_id as string);
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Payout statistics retrieved successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get payout stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payout statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts/notifications - Get transaction completion notifications
router.get('/notifications', (req: Request, res: Response) => {
  try {
    const { seller_id, limit = '50', offset = '0' } = req.query;
    
    let filteredNotifications = [...transactionNotifications];
    
    // Filter by seller
    if (seller_id && typeof seller_id === 'string') {
      filteredNotifications = filteredNotifications.filter(n => n.seller_id === seller_id);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedNotifications = filteredNotifications.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<typeof paginatedNotifications> = {
      success: true,
      data: paginatedNotifications,
      message: `Retrieved ${paginatedNotifications.length} notifications`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts/recent/:limit - Get recent payouts
router.get('/recent/:limit', (req: Request, res: Response) => {
  try {
    const { limit } = req.params;
    const limitNum = parseInt(limit) || 10;
    const payouts = getRecentPayouts(limitNum);
    
    const response: ApiResponse<typeof payouts> = {
      success: true,
      data: payouts,
      message: `Retrieved ${payouts.length} recent payouts`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get recent payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent payouts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts/:transaction_id - Get payout by transaction ID
router.get('/:transaction_id', (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.params;
    const payout = getPayoutByTransactionId(transaction_id);
    
    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found',
        message: `Payout for transaction ${transaction_id} does not exist`
      });
    }
    
    const response: ApiResponse<typeof payout> = {
      success: true,
      data: payout,
      message: 'Payout retrieved successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get payout by transaction ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payout',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/payouts/calculate-fees - Calculate fees for a given amount
router.post('/calculate-fees', (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }
    
    const feeCalculation = calculateFees(amount, currency);
    
    const response: ApiResponse<FeeCalculation> = {
      success: true,
      data: feeCalculation,
      message: 'Fee calculation completed successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Calculate fees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fees',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/payouts/notifications - Get transaction completion notifications
router.get('/notifications', (req: Request, res: Response) => {
  try {
    const { seller_id, limit = '50', offset = '0' } = req.query;
    
    let filteredNotifications = [...transactionNotifications];
    
    // Filter by seller
    if (seller_id && typeof seller_id === 'string') {
      filteredNotifications = filteredNotifications.filter(n => n.seller_id === seller_id);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedNotifications = filteredNotifications.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<typeof paginatedNotifications> = {
      success: true,
      data: paginatedNotifications,
      message: `Retrieved ${paginatedNotifications.length} notifications`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 