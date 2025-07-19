import { Router, Request, Response } from 'express';
import { getSellerTransactions, getTransactionsByStatus, getTransactionsByItem, getTransactionById, getRecentTransactions } from '../data/transactions';
import { ApiResponse, SellerStats } from '../types';

const router = Router();

// GET /api/transactions - Get all transactions
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, item_id, limit = '50', offset = '0' } = req.query;
    
    let filteredTransactions = [...getSellerTransactions()];
    
    // Filter by status
    if (status && typeof status === 'string') {
      filteredTransactions = getTransactionsByStatus(status);
    }
    
    // Filter by item
    if (item_id && typeof item_id === 'string') {
      filteredTransactions = getTransactionsByItem(item_id);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedTransactions = filteredTransactions.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<typeof paginatedTransactions> = {
      success: true,
      data: paginatedTransactions,
      message: `Retrieved ${paginatedTransactions.length} transactions`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const completedTransactions = getTransactionsByStatus('completed');
    const pendingTransactions = getTransactionsByStatus('pending');
    const processingTransactions = getTransactionsByStatus('processing');
    
    const totalRevenue = completedTransactions.reduce((sum, txn) => sum + txn.total_amount, 0);
    const monthlyRevenue = completedTransactions
      .filter(txn => {
        const txnDate = new Date(txn.created_at);
        const now = new Date();
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, txn) => sum + txn.total_amount, 0);
    
    // Calculate top selling items
    const itemSales = new Map<string, { count: number; revenue: number; name: string }>();
    completedTransactions.forEach(txn => {
      const existing = itemSales.get(txn.item_id) || { count: 0, revenue: 0, name: txn.item_name };
      existing.count += 1;
      existing.revenue += txn.total_amount;
      itemSales.set(txn.item_id, existing);
    });
    
    const topSellingItems = Array.from(itemSales.entries())
      .map(([item_id, data]) => ({
        item_id,
        item_name: data.name,
        sales_count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    const stats: SellerStats = {
      total_items: 5, // From items data
      total_transactions: getSellerTransactions().length,
      total_revenue: totalRevenue,
      active_listings: 5, // From items data
      pending_transactions: pendingTransactions.length,
      completed_transactions: completedTransactions.length,
      monthly_revenue: monthlyRevenue,
      top_selling_items: topSellingItems
    };
    
    const response: ApiResponse<SellerStats> = {
      success: true,
      data: stats,
      message: 'Transaction statistics retrieved successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transaction statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions/status/:status - Get transactions by status
router.get('/status/:status', (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const transactions = getTransactionsByStatus(status);
    
    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
      message: `Retrieved ${transactions.length} transactions with status ${status}`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get transactions by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions by status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions/item/:item_id - Get transactions by item
router.get('/item/:item_id', (req: Request, res: Response) => {
  try {
    const { item_id } = req.params;
    const transactions = getTransactionsByItem(item_id);
    
    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
      message: `Retrieved ${transactions.length} transactions for item ${item_id}`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get transactions by item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions by item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions/recent/:limit - Get recent transactions
router.get('/recent/:limit', (req: Request, res: Response) => {
  try {
    const { limit } = req.params;
    const limitNum = parseInt(limit) || 10;
    const transactions = getRecentTransactions(limitNum);
    
    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
      message: `Retrieved ${transactions.length} recent transactions`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = getTransactionById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        message: `Transaction with ID ${id} does not exist`
      });
    }
    
    const response: ApiResponse<typeof transaction> = {
      success: true,
      data: transaction,
      message: 'Transaction retrieved successfully'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 