import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

// Mock data for demonstration
const mockResources = [
  {
    id: 'cpu-1',
    name: 'High-Performance CPU Cluster',
    type: 'CPU',
    specifications: { cpu: 32, memory: 128 },
    price: 2.50,
    currency: 'USD',
    availability: 10,
    location: 'US East',
    provider: 'Cloud Provider A',
    sla: 'Gold',
    rating: 4.8,
    reviews: 150,
    estimatedProvisioningTime: 5,
    utilization: 75
  },
  {
    id: 'gpu-1',
    name: 'NVIDIA RTX 4090 GPU',
    type: 'GPU',
    specifications: { gpu: 'RTX 4090', memory: 24 },
    price: 5.00,
    currency: 'USD',
    availability: 5,
    location: 'US West',
    provider: 'Cloud Provider B',
    sla: 'Platinum',
    rating: 4.9,
    reviews: 89,
    estimatedProvisioningTime: 3,
    utilization: 60
  }
]

// GET /api/resources/search
router.get('/search', (req, res) => {
  try {
    const { query, filters, sortBy, sortOrder, page = 1, limit = 12 } = req.query
    
    // Mock search implementation
    let filteredResources = [...mockResources]
    
    if (query) {
      filteredResources = filteredResources.filter(resource => 
        resource.name.toLowerCase().includes((query as string).toLowerCase())
      )
    }
    
    // Apply filters
    if (filters) {
      const filterObj = JSON.parse(filters as string)
      if (filterObj.resourceType?.length) {
        filteredResources = filteredResources.filter(resource => 
          filterObj.resourceType.includes(resource.type)
        )
      }
      if (filterObj.priceRange) {
        filteredResources = filteredResources.filter(resource => 
          resource.price >= filterObj.priceRange.min && 
          resource.price <= filterObj.priceRange.max
        )
      }
    }
    
    // Apply sorting
    if (sortBy === 'price') {
      filteredResources.sort((a, b) => 
        sortOrder === 'desc' ? b.price - a.price : a.price - b.price
      )
    }
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedResources = filteredResources.slice(startIndex, endIndex)
    
    return res.json({
      data: paginatedResources,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredResources.length,
        totalPages: Math.ceil(filteredResources.length / Number(limit))
      }
    })
  } catch (error) {
    logger.error('Resource search error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/resources/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const resource = mockResources.find(r => r.id === id)
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(resource)
  } catch (error) {
    logger.error('Get resource error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/resources/compare
router.post('/compare', (req, res) => {
  try {
    const { resourceIds } = req.body
    
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ error: 'Invalid resource IDs' })
    }
    
    const resources = mockResources.filter(r => resourceIds.includes(r.id))
    return res.json(resources)
  } catch (error) {
    logger.error('Resource comparison error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/resources/:id/availability
router.get('/:id/availability', (req, res) => {
  try {
    const { id } = req.params
    const resource = mockResources.find(r => r.id === id)
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json({
      availability: resource.availability,
      utilization: resource.utilization
    })
  } catch (error) {
    logger.error('Get availability error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as resourceRoutes } 