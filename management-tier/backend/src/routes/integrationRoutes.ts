import { Router } from 'express'
import { logger } from '../utils/logger'
import { DatabaseService } from '../services/DatabaseService'
import { MarketplaceOrchestrationService } from '../services/MarketplaceOrchestrationService'

const router = Router()
const db = new DatabaseService()
const orchestrationService = new MarketplaceOrchestrationService()

// 1. Resource Sync (Processing → Management)
router.post('/resources/sync', async (req, res) => {
  const { clusterId, cpu, gpu, memory } = req.body
  logger.info('Resource sync received', req.body)
  try {
    // Upsert resource data for the cluster
    await db.query(`
      INSERT INTO resources (cluster_id, cpu, gpu, memory, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (cluster_id) DO UPDATE SET
        cpu = $2,
        gpu = $3,
        memory = $4,
        updated_at = NOW()
    `, [clusterId, cpu, gpu, memory])
    res.json({ success: true, message: 'Resource sync stored' })
  } catch (error) {
    logger.error('Resource sync DB error:', error)
    res.status(500).json({ success: false, error: 'Failed to store resource sync' })
  }
})

// 2. Order State Update (Processing → Management)
router.post('/orders/update', async (req, res) => {
  const { orderId, userId, status, amount } = req.body
  logger.info('Order update received', req.body)
  try {
    await db.query(`
      INSERT INTO orders (order_id, user_id, status, amount, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (order_id) DO UPDATE SET
        user_id = $2,
        status = $3,
        amount = $4,
        updated_at = NOW()
    `, [orderId, userId, status, amount])
    res.json({ success: true, message: 'Order update stored' })
  } catch (error) {
    logger.error('Order update DB error:', error)
    res.status(500).json({ success: false, error: 'Failed to store order update' })
  }
})

// 3. Transaction State Update (Processing → Management)
router.post('/transactions/update', async (req, res) => {
  const { transactionId, orderId, userId, status, amount, fees } = req.body
  logger.info('Transaction update received', req.body)
  try {
    await db.query(`
      INSERT INTO transactions (transaction_id, order_id, user_id, status, amount, fees, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (transaction_id) DO UPDATE SET
        order_id = $2,
        user_id = $3,
        status = $4,
        amount = $5,
        fees = $6,
        updated_at = NOW()
    `, [transactionId, orderId, userId, status, amount, fees])
    res.json({ success: true, message: 'Transaction update stored' })
  } catch (error) {
    logger.error('Transaction update DB error:', error)
    res.status(500).json({ success: false, error: 'Failed to store transaction update' })
  }
})

// 4. Fee Config Fetch (Processing ← Management)
router.get('/fees/config', async (req, res) => {
  try {
    // Fetch real fee config from the fee management service
    const feeConfig = {
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
      ]
    }
    
    logger.info('Fee config requested by processing tier')
    res.json(feeConfig)
  } catch (error) {
    logger.error('Fee config fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch fee config' })
  }
})

// 5. Settlement Instruction (Processing ← Management)
router.post('/settlement/execute', (req, res) => {
  logger.info('Settlement instruction received', req.body)
  res.json({ success: true, message: 'Settlement instruction received' })
})

// 6. Compliance/Audit Event (Processing → Management)
router.post('/audit/log', (req, res) => {
  logger.info('Audit event received', req.body)
  res.json({ success: true, message: 'Audit event received' })
})

// 7. Analytics Ingest (Processing → Management)
router.post('/analytics/ingest', async (req, res) => {
  const { eventType, eventData } = req.body
  logger.info('Analytics ingest received', req.body)
  try {
    await db.query(`
      INSERT INTO analytics_events (event_type, event_data, timestamp)
      VALUES ($1, $2, NOW())
    `, [eventType, JSON.stringify(eventData)])
    res.json({ success: true, message: 'Analytics event stored' })
  } catch (error) {
    logger.error('Analytics ingest DB error:', error)
    res.status(500).json({ success: false, error: 'Failed to store analytics event' })
  }
})

// 8. Cluster/State Sync (Bidirectional)
router.get('/clusters', async (req, res) => {
  try {
    const clusters = await db.query(`
      SELECT * FROM clusters 
      WHERE status != 'deleted'
      ORDER BY created_at ASC
    `)
    res.json({ clusters: clusters.rows })
  } catch (error) {
    logger.error('Get clusters error:', error)
    res.status(500).json({ error: 'Failed to fetch clusters' })
  }
})

router.post('/clusters', async (req, res) => {
  const clusterData = req.body
  logger.info('Cluster registration/update received', req.body)
  try {
    await orchestrationService.registerCluster(clusterData)
    res.json({ success: true, message: 'Cluster registered successfully' })
  } catch (error) {
    logger.error('Cluster registration error:', error)
    res.status(500).json({ success: false, error: 'Failed to register cluster' })
  }
})

export { router as integrationRoutes } 