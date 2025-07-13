import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock fee configuration data
let feeConfig = {
  buyerFee: 0.5,
  sellerFee: 0.5,
  tiers: [
    {
      id: 'tier-1',
      name: 'Standard',
      minVolume: 0,
      maxVolume: 10000,
      buyerFee: 0.5,
      sellerFee: 0.5
    },
    {
      id: 'tier-2',
      name: 'Premium',
      minVolume: 10000,
      maxVolume: 100000,
      buyerFee: 0.4,
      sellerFee: 0.4
    }
  ],
  scheduledChanges: [] as Array<{
    id: string;
    effectiveDate: any;
    buyerFee: any;
    sellerFee: any;
    status: string;
  }>
}

// GET /api/fees/config
router.get('/config', (req, res) => {
  try {
    res.json(feeConfig)
  } catch (error) {
    logger.error('Get fee config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/fees/config
router.put('/config', (req, res) => {
  try {
    const { buyerFee, sellerFee } = req.body
    
    if (buyerFee !== undefined) {
      feeConfig.buyerFee = buyerFee
    }
    if (sellerFee !== undefined) {
      feeConfig.sellerFee = sellerFee
    }
    
    logger.info(`Fee config updated: buyer=${feeConfig.buyerFee}%, seller=${feeConfig.sellerFee}%`)
    res.json(feeConfig)
  } catch (error) {
    logger.error('Update fee config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/fees/tiers
router.get('/tiers', (req, res) => {
  try {
    res.json(feeConfig.tiers)
  } catch (error) {
    logger.error('Get fee tiers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/fees/tiers
router.post('/tiers', (req, res) => {
  try {
    const tierData = req.body
    
    const newTier = {
      id: `tier-${Date.now()}`,
      name: tierData.name,
      minVolume: tierData.minVolume,
      maxVolume: tierData.maxVolume,
      buyerFee: tierData.buyerFee,
      sellerFee: tierData.sellerFee
    }
    
    feeConfig.tiers.push(newTier)
    
    logger.info(`Fee tier created: ${newTier.name}`)
    res.status(201).json(newTier)
  } catch (error) {
    logger.error('Create fee tier error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/fees/tiers/:id
router.put('/tiers/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const tierIndex = feeConfig.tiers.findIndex(t => t.id === id)
    if (tierIndex === -1) {
      return res.status(404).json({ error: 'Fee tier not found' })
    }
    
    feeConfig.tiers[tierIndex] = { ...feeConfig.tiers[tierIndex], ...updates }
    
    logger.info(`Fee tier updated: ${id}`)
    return res.json(feeConfig.tiers[tierIndex])
  } catch (error) {
    logger.error('Update fee tier error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/fees/tiers/:id
router.delete('/tiers/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const tierIndex = feeConfig.tiers.findIndex(t => t.id === id)
    if (tierIndex === -1) {
      return res.status(404).json({ error: 'Fee tier not found' })
    }
    
    feeConfig.tiers.splice(tierIndex, 1)
    
    logger.info(`Fee tier deleted: ${id}`)
    return res.status(204).send()
  } catch (error) {
    logger.error('Delete fee tier error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/fees/schedule
router.post('/schedule', (req, res) => {
  try {
    const { effectiveDate, buyerFee, sellerFee } = req.body
    
    const scheduledChange = {
      id: `schedule-${Date.now()}`,
      effectiveDate,
      buyerFee,
      sellerFee,
      status: 'pending'
    }
    
    feeConfig.scheduledChanges.push(scheduledChange)
    
    logger.info(`Fee change scheduled: ${scheduledChange.id}`)
    res.status(201).json(scheduledChange)
  } catch (error) {
    logger.error('Schedule fee change error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/fees/analytics
router.get('/analytics', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // Mock analytics data
    const analytics = {
      totalRevenue: 1250.50,
      totalTransactions: 150,
      averageFee: 8.34,
      revenueByPeriod: [
        { period: '2024-01', revenue: 450.25, transactions: 54 },
        { period: '2024-02', revenue: 800.25, transactions: 96 }
      ],
      feeOptimization: {
        recommendedBuyerFee: 0.45,
        recommendedSellerFee: 0.45,
        potentialRevenueIncrease: 12.5
      }
    }
    
    res.json(analytics)
  } catch (error) {
    logger.error('Get fee analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as feeRoutes } 