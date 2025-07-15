import { Router } from 'express'
import { logger } from '../utils/logger'
import { UEXIntegrationService } from '../services/UEXIntegrationService'

const router = Router()

// Real orders storage (replaces mock data)
const orders: any[] = []

// Clear old orders without UEX transaction IDs (for development)
const clearOldOrders = () => {
  const initialLength = orders.length
  const filteredOrders = orders.filter(order => order.uexTransactionId)
  orders.length = 0
  orders.push(...filteredOrders)
  logger.info(`Cleared ${initialLength - filteredOrders.length} old orders without UEX transaction IDs`)
}

// Initialize with clean state (no old orders)
orders.length = 0
logger.info('Cleared all old orders - starting with clean state')

// Function to update order status based on UEX transaction status
const updateOrderStatusFromUEX = async (orderId: string, uexTransactionId: string) => {
  try {
    const uexStatus = await UEXIntegrationService.getTransactionStatus(uexTransactionId)
    
    // Map UEX status to order status
    let orderStatus = 'pending'
    switch (uexStatus.status) {
      case 'completed':
        orderStatus = 'completed'
        break
      case 'processing':
        orderStatus = 'processing'
        break
      case 'failed':
        orderStatus = 'cancelled'
        break
      case 'cancelled':
        orderStatus = 'cancelled'
        break
      default:
        orderStatus = 'pending'
    }
    
    // Update order status
    const orderIndex = orders.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      orders[orderIndex].status = orderStatus
      orders[orderIndex].updatedAt = new Date().toISOString()
      logger.info(`Order ${orderId} status updated to ${orderStatus} based on UEX transaction ${uexTransactionId}`)
    }
  } catch (error) {
    logger.error(`Failed to update order status for ${orderId}:`, error)
  }
}

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const orderData = req.body
    
    // Validate order data
    if (!orderData.resources || !Array.isArray(orderData.resources)) {
      return res.status(400).json({ error: 'Invalid order data' })
    }
    
    // Create new order with UEX transaction ID
    const newOrder = {
      id: `order-${Date.now()}`,
      userId: orderData.userId || 'user-1',
      resources: orderData.resources,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency || 'USD',
      status: 'pending',
      uexTransactionId: orderData.uexTransactionId, // Store UEX transaction ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    orders.push(newOrder)
    
    logger.info(`Order created: ${newOrder.id} with UEX transaction: ${newOrder.uexTransactionId}`)
    
    // Update order status based on UEX transaction status
    if (newOrder.uexTransactionId) {
      updateOrderStatusFromUEX(newOrder.id, newOrder.uexTransactionId)
    }
    
    return res.status(201).json(newOrder)
  } catch (error) {
    logger.error('Create order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/orders/user
router.get('/user', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const userId = req.query['userId'] || 'user-1'
    
    let filteredOrders = orders.filter(o => o.userId === userId)
    
    // Update order statuses based on UEX transaction statuses
    for (const order of filteredOrders) {
      if (order.uexTransactionId) {
        await updateOrderStatusFromUEX(order.id, order.uexTransactionId)
      }
    }
    
    // Re-filter after status updates
    filteredOrders = orders.filter(o => o.userId === userId)
    
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
    const order = orders.find(o => o.id === id)
    
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
    
    const orderIndex = orders.findIndex(o => o.id === id)
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    logger.info(`Order updated: ${id}`)
    return res.json(orders[orderIndex])
  } catch (error) {
    logger.error('Update order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/orders/:id/cancel
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params
    
    const orderIndex = orders.findIndex(o => o.id === id)
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' })
    }
    const order = orders[orderIndex]
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

// POST /api/orders/clear-old
router.post('/clear-old', (_req, res) => {
  try {
    const initialLength = orders.length
    clearOldOrders()
    const finalLength = orders.length
    
    return res.json({
      message: `Cleared ${initialLength - finalLength} old orders without UEX transaction IDs`,
      remainingOrders: finalLength
    })
  } catch (error) {
    logger.error('Clear old orders error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as orderRoutes } 