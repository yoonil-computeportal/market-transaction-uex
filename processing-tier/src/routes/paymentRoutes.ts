import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock data for demonstration
const mockPaymentMethods = [
  {
    id: 'pm-1',
    type: 'credit_card',
    name: 'Visa ending in 4242',
    last4: '4242',
    isDefault: true
  },
  {
    id: 'pm-2',
    type: 'bank_transfer',
    name: 'Bank Account',
    isDefault: false
  }
]

const mockPayments = [
  {
    id: 'pay-1',
    transactionId: 'txn-1',
    amount: 5.00,
    currency: 'USD',
    method: mockPaymentMethods[0],
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z'
  }
]

// GET /api/payments/methods
router.get('/methods', (_req, res) => {
  try {
    return res.json(mockPaymentMethods)
  } catch (error) {
    logger.error('Get payment methods error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/payments/methods
router.post('/methods', (req, res) => {
  try {
    const methodData = req.body
    
    const newMethod = {
      id: `pm-${Date.now()}`,
      type: methodData.type,
      name: methodData.name,
      last4: methodData.last4,
      isDefault: methodData.isDefault || false
    }
    
    mockPaymentMethods.push(newMethod)
    
    logger.info(`Payment method added: ${newMethod.id}`)
    return res.status(201).json(newMethod)
  } catch (error) {
    logger.error('Add payment method error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/payments/methods/:id
router.delete('/methods/:id', (req, res) => {
  try {
    const { id } = req.params
    const methodIndex = mockPaymentMethods.findIndex(m => m.id === id)
    
    if (methodIndex === -1) {
      return res.status(404).json({ error: 'Payment method not found' })
    }
    
    mockPaymentMethods.splice(methodIndex, 1)
    
    logger.info(`Payment method removed: ${id}`)
    return res.status(204).send()
  } catch (error) {
    logger.error('Remove payment method error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/payments/process
router.post('/process', (req, res) => {
  try {
    const { transactionId, methodId, amount } = req.body
    
    // Validate payment data
    if (!transactionId || !methodId || !amount) {
      return res.status(400).json({ error: 'Missing required payment data' })
    }
    
    const method = mockPaymentMethods.find(m => m.id === methodId)
    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' })
    }
    
    // Create payment record
    const newPayment = {
      id: `pay-${Date.now()}`,
      transactionId,
      amount,
      currency: 'USD',
      method,
      status: 'completed',
      createdAt: new Date().toISOString()
    }
    
    mockPayments.push(newPayment)
    
    logger.info(`Payment processed: ${newPayment.id}`)
    return res.status(201).json(newPayment)
  } catch (error) {
    logger.error('Process payment error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/payments/history
router.get('/history', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedPayments = mockPayments.slice(startIndex, endIndex)
    
    return res.json({
      data: paginatedPayments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockPayments.length,
        totalPages: Math.ceil(mockPayments.length / Number(limit))
      }
    })
  } catch (error) {
    logger.error('Get payment history error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as paymentRoutes } 