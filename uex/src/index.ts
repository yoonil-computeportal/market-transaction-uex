import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import monitoringRoutes, { metricsMiddleware } from './routes/monitoringRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware - allow iframe embedding for presentation dashboard
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["*"]  // Allow iframe embedding from any origin
    }
  },
  frameguard: false  // Disable X-Frame-Options to allow iframe embedding
}));

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

// Metrics middleware - track all API requests
app.use('/api/', metricsMiddleware);

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Root route
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'UEX Backend - Multi-Currency Payment Processing',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      payments: '/api/payments',
      health: '/api/payments/health',
      reports: {
        transactions: '/api/reports/transactions',
        metrics: '/api/reports/metrics',
        analytics: '/api/reports/analytics',
        topSellers: '/api/reports/top-sellers',
        sellerPayouts: '/api/reports/seller/:sellerId/payouts',
        sellerSummary: '/api/reports/seller/:sellerId/summary',
        sellerEarnings: '/api/reports/seller/:sellerId/earnings',
        export: '/api/reports/transactions/export'
      },
      monitoring: {
        health: '/api/monitoring/health',
        stats: '/api/monitoring/stats',
        alerts: '/api/monitoring/alerts',
        performance: '/api/monitoring/performance',
        services: '/api/monitoring/services/:service'
      }
    }
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: {
      root: '/',
      payments: '/api/payments',
      reports: '/api/reports',
      monitoring: '/api/monitoring',
      health: '/api/payments/health'
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
  console.log(`🚀 UEX Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📋 Health Check: http://localhost:${PORT}/api/monitoring/health`);
  console.log(`📈 Monitoring Dashboard: http://localhost:${PORT}/api/monitoring/stats`);
  console.log(`📊 Reports: http://localhost:${PORT}/api/reports/transactions`);
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