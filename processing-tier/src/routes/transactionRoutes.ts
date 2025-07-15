import { Router } from 'express'
import { logger } from '../utils/logger'
import { UEXIntegrationService } from '../services/UEXIntegrationService'

const router = Router()

// GET /api/transactions/user
router.get('/user', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const userId = req.query['userId'] || 'user-1'

    logger.info(`Fetching transactions for user: ${userId}`)

    // Fetch real transactions from UEX backend
    logger.info('Calling UEXIntegrationService.getAllTransactions()')
    const allTransactions = await UEXIntegrationService.getAllTransactions()
    logger.info(`Retrieved ${allTransactions.length} transactions from UEX backend`)
    
    let filteredTransactions = allTransactions.filter(t => t.client_id === userId)
    logger.info(`Filtered to ${filteredTransactions.length} transactions for user ${userId}`)

    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status)
      logger.info(`Further filtered to ${filteredTransactions.length} transactions with status ${status}`)
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

    logger.info(`Returning ${paginatedTransactions.length} transactions for page ${page}`)

    return res.json({
      data: paginatedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / Number(limit))
      }
    })
  } catch (error: any) {
    logger.error('Get user transactions error:', error)
    logger.error('Error details:', { message: error.message, stack: error.stack })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/transactions/:id
router.get('/:id', (_req, res) => {
  res.status(501).json({ error: 'Not implemented. Use /user endpoint for real transactions.' })
})

// GET /api/transactions/history
router.get('/history', (_req, res) => {
  res.status(501).json({ error: 'Not implemented. Use /user endpoint for real transactions.' })
})

export { router as transactionRoutes } 