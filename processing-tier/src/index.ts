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
import { resourceRoutes } from './routes/resourceRoutes'
import { orderRoutes } from './routes/orderRoutes'
import { transactionRoutes } from './routes/transactionRoutes'
import { paymentRoutes } from './routes/paymentRoutes'
import { ResourceRegistryAgent } from './services/ResourceRegistryAgent'
import { TransactionProcessor } from './services/TransactionProcessor'
import { PaymentGateway } from './services/PaymentGateway'

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
app.use(helmet())
app.use(  cors({
    origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
    credentials: true
  }))
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'marketplace-processing-tier'
  })
})

// API Routes
app.use('/api/resources', resourceRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/payments', paymentRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('subscribe:resource', (resourceId: string) => {
    socket.join(`resource:${resourceId}`)
    logger.info(`Client ${socket.id} subscribed to resource ${resourceId}`)
  })

  socket.on('subscribe:order', (orderId: string) => {
    socket.join(`order:${orderId}`)
    logger.info(`Client ${socket.id} subscribed to order ${orderId}`)
  })

  socket.on('subscribe:transaction', (transactionId: string) => {
    socket.join(`transaction:${transactionId}`)
    logger.info(`Client ${socket.id} subscribed to transaction ${transactionId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Initialize services
const resourceRegistryAgent = new ResourceRegistryAgent()
const transactionProcessor = new TransactionProcessor()
const paymentGateway = new PaymentGateway()

// Start services
resourceRegistryAgent.start()
transactionProcessor.start()
paymentGateway.start()

// Export io instance for use in other modules
export { io }

const PORT = process.env['PORT'] || 8000

server.listen(PORT, () => {
  logger.info(`Processing tier server running on port ${PORT}`)
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