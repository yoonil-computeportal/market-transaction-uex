import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// GET /api/analytics/marketplace
router.get('/marketplace', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // Mock analytics data
    const analytics = {
      totalTransactions: 1250,
      totalRevenue: 12500.50,
      activeUsers: 450,
      resourceUtilization: 68,
      topResources: [
        { name: 'High-Performance CPU Cluster', transactions: 150 },
        { name: 'NVIDIA RTX 4090 GPU', transactions: 120 },
        { name: 'Enterprise NVMe Storage Cluster', transactions: 95 }
      ],
      revenueByPeriod: [
        { period: '2024-01', revenue: 4500.25, transactions: 450 },
        { period: '2024-02', revenue: 8000.25, transactions: 800 }
      ]
    }
    
    return res.json(analytics)
  } catch (error) {
    logger.error('Get marketplace analytics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/analytics/clusters
router.get('/clusters', (req, res) => {
  try {
    const clusterAnalytics = [
      {
        id: 'cluster-1',
        name: 'US East Cluster',
        status: 'active',
        utilization: 75,
        resources: {
          cpu: 1000,
          gpu: 50,
          memory: 8000
        }
      },
      {
        id: 'cluster-2',
        name: 'US West Cluster',
        status: 'active',
        utilization: 60,
        resources: {
          cpu: 800,
          gpu: 30,
          memory: 6000
        }
      }
    ]
    
    return res.json(clusterAnalytics)
  } catch (error) {
    logger.error('Get cluster analytics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as analyticsRoutes } 