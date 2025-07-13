import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { feeManagementRoutes } from './routes/feeManagementRoutes'
import { analyticsRoutes } from './routes/analyticsRoutes'
import { settlementRoutes } from './routes/settlementRoutes'
import { integrationRoutes } from './routes/integrationRoutes'
import uexIntegrationRoutes from './routes/uexIntegrationRoutes'
import { MarketplaceOrchestrationService } from './services/MarketplaceOrchestrationService'
import { BillingEngine } from './services/BillingEngine'
import { SettlementService } from './services/SettlementService'
import paymentRoutes from './routes/paymentRoutes';


// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));
app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'marketplace-management-tier'
  })
})

// API Routes
app.use('/api/fees', feeManagementRoutes)
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/management/integration', integrationRoutes)
app.use('/api/uex', uexIntegrationRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Management client connected: ${socket.id}`)

  socket.on('subscribe:analytics', () => {
    socket.join('analytics')
    logger.info(`Client ${socket.id} subscribed to analytics`)
  })

  socket.on('subscribe:fees', () => {
    socket.join('fees')
    logger.info(`Client ${socket.id} subscribed to fee updates`)
  })

  socket.on('subscribe:uex', () => {
    socket.join('uex')
    logger.info(`Client ${socket.id} subscribed to UEX updates`)
  })

  socket.on('disconnect', () => {
    logger.info(`Management client disconnected: ${socket.id}`)
  })
})

// Initialize services
const marketplaceOrchestration = new MarketplaceOrchestrationService()
const billingEngine = new BillingEngine()
const settlementService = new SettlementService()

// Start services
marketplaceOrchestration.start()
billingEngine.start()
settlementService.start()

// Export io instance for use in other modules
export { io }

const PORT = process.env['PORT'] || 9000

server.listen(PORT, () => {
  logger.info(`Management tier server running on port ${PORT}`)
  logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}) 