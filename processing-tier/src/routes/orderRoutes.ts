import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock data for demonstration
const mockOrders = [
  {
    id: 'order-1',
    userId: 'user-1',
    resources: [
      {
        resourceId: 'cpu-1',
        quantity: 2,
        price: 2.50,
        specifications: { cpu: 32, memory: 128 }
      }
    ],
    totalAmount: 5.00,
    currency: 'USD',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: 'order-2',
    userId: 'user-1',
    resources: [
      {
        resourceId: 'gpu-1',
        quantity: 1,
        price: 5.00,
        specifications: { gpu: 'RTX 4090', memory: 24 }
      }
    ],
    totalAmount: 5.00,
    currency: 'USD',
    status: 'pending',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  }
]

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const orderData = req.body
    
    // Validate order data
    if (!orderData.resources || !Array.isArray(orderData.resources)) {
      return res.status(400).json({ error: 'Invalid order data' })
    }
    
    // Create new order
    const newOrder = {
      id: `order-${Date.now()}`,
      userId: orderData.userId || 'user-1',
      resources: orderData.resources,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency || 'USD',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockOrders.push(newOrder)
    
    logger.info(`Order created: ${newOrder.id}`)
    return res.status(201).json(newOrder)
  } catch (error) {
    logger.error('Create order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/orders/user
router.get('/user', (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const userId = req.query['userId'] || 'user-1'
    
    let filteredOrders = mockOrders.filter(o => o.userId === userId)
    
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status)
    }
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)
    
    return res.json({
      data: paginatedOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / Number(limit))
      }
    })
  } catch (error) {
    logger.error('Get user orders error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const order = mockOrders.find(o => o.id === id)
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    return res.json(order)
  } catch (error) {
    logger.error('Get order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/orders/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const orderIndex = mockOrders.findIndex(o => o.id === id)
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    logger.info(`Order updated: ${id}`)
    return res.json(mockOrders[orderIndex])
  } catch (error) {
    logger.error('Update order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/orders/:id/cancel
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params
    
    const orderIndex = mockOrders.findIndex(o => o.id === id)
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' })
    }
    const order = mockOrders[orderIndex]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    order.status = 'cancelled'
    order.updatedAt = new Date().toISOString()
    
    logger.info(`Order cancelled: ${id}`)
    return res.json(order)
  } catch (error) {
    logger.error('Cancel order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as orderRoutes } 