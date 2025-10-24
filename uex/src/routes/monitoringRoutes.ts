/**
 * Monitoring Dashboard Routes
 *
 * Provides API endpoints for system monitoring and health checks
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { getMonitoringService, AlertConfig } from '../services/MonitoringService';
import { errorTracking } from '../services/ErrorTrackingService';

const router = Router();
const dbService = new DatabaseService();
const monitoringService = getMonitoringService(dbService);

/**
 * GET /api/monitoring/health
 * Get comprehensive system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await monitoringService.getSystemHealth();

    // Set appropriate HTTP status code based on health
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 200; // Still operational
    } else if (health.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    res.status(statusCode).json({
      success: true,
      data: health,
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'monitoring_health' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health status',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/monitoring/stats
 * Get dashboard metrics and statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const metrics = await monitoringService.getDashboardMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'monitoring_stats' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard metrics',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Check for system alerts based on thresholds
 *
 * Query parameters:
 * - enabled: boolean (default: true)
 * - errorRateThreshold: number (default: 5)
 * - responseTimeThreshold: number (default: 5000)
 * - failedTransactionThreshold: number (default: 10)
 * - diskSpaceThreshold: number (default: 90)
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const config: AlertConfig = {
      enabled: req.query.enabled !== 'false',
      errorRateThreshold: parseFloat((req.query.errorRateThreshold as string) || '5'),
      responseTimeThreshold: parseInt((req.query.responseTimeThreshold as string) || '5000'),
      failedTransactionThreshold: parseInt((req.query.failedTransactionThreshold as string) || '10'),
      diskSpaceThreshold: parseFloat((req.query.diskSpaceThreshold as string) || '90'),
    };

    const alerts = await monitoringService.checkAlerts(config);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        config,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'monitoring_alerts' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to check alerts',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/monitoring/services/:service
 * Get detailed status for a specific service
 *
 * Services: database | uexAPI | errorTracking | email
 */
router.get('/services/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;

    if (!['database', 'uexAPI', 'errorTracking', 'email'].includes(service)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name',
        message: 'Service must be one of: database, uexAPI, errorTracking, email',
      });
    }

    const health = await monitoringService.getSystemHealth();
    const serviceStatus = health.services[service as keyof typeof health.services];

    res.json({
      success: true,
      data: {
        service,
        ...serviceStatus,
      },
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'monitoring_service_status' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service status',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/monitoring/performance
 * Get performance metrics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const metrics = await monitoringService.getDashboardMetrics();

    res.json({
      success: true,
      data: metrics.performance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorTracking.captureException(error as Error, {
      level: 'error',
      tags: { route: 'monitoring_performance' },
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      message: (error as Error).message,
    });
  }
});

/**
 * Middleware to record request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();

  // Record response time when request finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoringService.recordRequest(req.path, responseTime);

    // Record errors
    if (res.statusCode >= 400) {
      monitoringService.recordError();
    }
  });

  next();
};

export default router;
