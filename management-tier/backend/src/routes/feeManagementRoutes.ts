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
  scheduledChanges: []
}

// GET /api/fees/config
router.get('/config', (req, res) => {
  try {
    return res.json(feeConfig)
  } catch (error) {
    logger.error('Get fee config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
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
    return res.json(feeConfig)
  } catch (error) {
    logger.error('Update fee config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Alias: GET /api/fees/current
router.get('/current', (req, res) => {
  try {
    return res.json(feeConfig)
  } catch (error) {
    logger.error('Get fee config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Alias: POST /api/fees/update
router.post('/update', (req, res) => {
  try {
    const { buyerFee, sellerFee } = req.body
    if (buyerFee !== undefined) {
      feeConfig.buyerFee = buyerFee
    }
    if (sellerFee !== undefined) {
      feeConfig.sellerFee = sellerFee
    }
    logger.info(`Fee config updated: buyer=${feeConfig.buyerFee}%, seller=${feeConfig.sellerFee}%`)
    return res.json(feeConfig)
  } catch (error) {
    logger.error('Update fee config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
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
    
    return res.json(analytics)
  } catch (error) {
    logger.error('Get fee analytics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as feeManagementRoutes } 