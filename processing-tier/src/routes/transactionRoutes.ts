import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock data for demonstration
const mockTransactions = [
  {
    id: 'txn-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: 5.00,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'credit_card',
    fees: {
      buyer: 0.025,
      seller: 0.025,
      platform: 0.05
    },
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: 'txn-2',
    orderId: 'order-2',
    userId: 'user-1',
    amount: 5.00,
    currency: 'USD',
    status: 'pending',
    paymentMethod: 'credit_card',
    fees: {
      buyer: 0.025,
      seller: 0.025,
      platform: 0.05
    },
    createdAt: '2024-01-16T14:20:00Z'
  }
]

// GET /api/transactions/user
router.get('/user', (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const userId = req.query['userId'] || 'user-1'
    
    let filteredTransactions = mockTransactions.filter(t => t.userId === userId)
    
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status)
    }
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)
    
    return res.json({
      data: paginatedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / Number(limit))
      }
    })
  } catch (error) {
    logger.error('Get user transactions error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const transaction = mockTransactions.find(t => t.id === id)
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    
    return res.json(transaction)
  } catch (error) {
    logger.error('Get transaction error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/transactions/history
router.get('/history', (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query
    
    let filteredTransactions = [...mockTransactions]
    
    // Apply date filters if provided
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.createdAt) >= new Date(startDate as string)
      )
    }
    
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.createdAt) <= new Date(endDate as string)
      )
    }
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)
    
    res.json({
      data: paginatedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / Number(limit))
      }
    })
  } catch (error) {
    logger.error('Get transaction history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as transactionRoutes } 