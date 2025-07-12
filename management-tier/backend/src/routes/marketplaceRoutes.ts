import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock marketplace data
const mockClusters = [
  {
    id: 'cluster-1',
    name: 'US East Cluster',
    status: 'active',
    resources: {
      cpu: 1000,
      gpu: 50,
      memory: 8000
    },
    utilization: 75
  },
  {
    id: 'cluster-2',
    name: 'US West Cluster',
    status: 'active',
    resources: {
      cpu: 800,
      gpu: 30,
      memory: 6000
    },
    utilization: 60
  }
]

// GET /api/marketplace/clusters
router.get('/clusters', (req, res) => {
  try {
    res.json(mockClusters)
  } catch (error) {
    logger.error('Get clusters error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/marketplace/clusters/:id
router.get('/clusters/:id', (req, res) => {
  try {
    const { id } = req.params
    const cluster = mockClusters.find(c => c.id === id)
    
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' })
    }
    
    res.json(cluster)
  } catch (error) {
    logger.error('Get cluster error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/marketplace/analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = {
      totalTransactions: 1250,
      totalRevenue: 12500.50,
      activeUsers: 450,
      resourceUtilization: 68,
      topResources: [
        { name: 'High-Performance CPU', transactions: 150 },
        { name: 'NVIDIA RTX 4090', transactions: 120 },
        { name: 'Storage Cluster', transactions: 95 }
      ]
    }
    
    res.json(analytics)
  } catch (error) {
    logger.error('Get marketplace analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as marketplaceRoutes } 