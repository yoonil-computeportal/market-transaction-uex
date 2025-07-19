import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import itemsRoutes from './routes/items';
import transactionsRoutes from './routes/transactions';
import payoutsRoutes from './routes/payouts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3004;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // allow 1000 requests per minute for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined'));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/items', itemsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/payouts', payoutsRoutes);

// Root route
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'Cloud Provider B - Seller Dashboard',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      items: '/api/items',
      transactions: '/api/transactions',
      payouts: '/api/payouts',
      dashboard: '/dashboard'
    }
  });
});

// Dashboard route
app.get('/dashboard', (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Health check route
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Cloud Provider B Seller Dashboard',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
          availableEndpoints: {
        root: '/',
        health: '/health',
        dashboard: '/dashboard',
        items: '/api/items',
        transactions: '/api/transactions',
        payouts: '/api/payouts'
      }
  });
});

// Global error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'production' 
      ? 'Something went wrong' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cloud Provider B Seller Dashboard running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📋 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 