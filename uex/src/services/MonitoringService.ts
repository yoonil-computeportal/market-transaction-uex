/**
 * Monitoring Service
 *
 * Provides real-time system monitoring and health metrics including:
 * - System health status
 * - Transaction metrics (pending, completed, failed counts)
 * - Performance metrics (response times, throughput)
 * - Database metrics (connection pool, query performance)
 * - UEX API metrics (uptime, response times)
 * - Error rates and alerts
 */

import { DatabaseService } from './DatabaseService';
import { errorTracking } from './ErrorTrackingService';
import * as os from 'os';

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    uexAPI: ServiceStatus;
    errorTracking: ServiceStatus;
    email: ServiceStatus;
  };
  system: {
    platform: string;
    cpuUsage: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    loadAverage: number[];
  };
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
}

export interface DashboardMetrics {
  realTimeStats: {
    pendingTransactions: number;
    processingTransactions: number;
    completedLast24h: number;
    failedLast24h: number;
    averageProcessingTime: number;
    successRate: number;
  };
  revenueStats: {
    totalFeesLast24h: number;
    totalFeesLast7d: number;
    totalFeesLast30d: number;
    totalVolumeProcessed: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    cacheHitRate: number;
  };
  recentTransactions: Array<{
    transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: Date;
  }>;
  recentErrors: Array<{
    error_id: string;
    message: string;
    timestamp: Date;
    severity: string;
  }>;
}

export interface AlertConfig {
  enabled: boolean;
  errorRateThreshold: number; // Percentage
  responseTimeThreshold: number; // Milliseconds
  failedTransactionThreshold: number;
  diskSpaceThreshold: number; // Percentage
}

export class MonitoringService {
  private startTime: Date;
  private requestCounts: Map<string, number[]> = new Map();
  private responseTimes: number[] = [];
  private errorCounts: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(private dbService: DatabaseService) {
    this.startTime = new Date();
    this.startMetricsCollection();
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const [databaseStatus, uexAPIStatus] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkUEXAPIHealth(),
      ]);

      const errorTrackingStatus = this.checkErrorTrackingHealth();
      const emailStatus = this.checkEmailServiceHealth();

      // Calculate memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;

      // Determine overall status
      const services = {
        database: databaseStatus,
        uexAPI: uexAPIStatus,
        errorTracking: errorTrackingStatus,
        email: emailStatus,
      };

      const allServicesUp = Object.values(services).every((s) => s.status === 'up');
      const anyServiceDegraded = Object.values(services).some((s) => s.status === 'degraded');
      const anyServiceDown = Object.values(services).some((s) => s.status === 'down');

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (anyServiceDown) {
        overallStatus = 'unhealthy';
      } else if (anyServiceDegraded) {
        overallStatus = 'degraded';
      }

      const healthStatus: SystemHealthStatus = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        version: process.env.RELEASE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services,
        system: {
          platform: os.platform(),
          cpuUsage: Math.round(cpuUsage * 100) / 100,
          memoryUsage: {
            used: Math.round(usedMemory / 1024 / 1024),
            total: Math.round(totalMemory / 1024 / 1024),
            percentage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100,
          },
          loadAverage: os.loadavg(),
        },
      };

      return healthStatus;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'system_health_check' },
      });

      throw error;
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const db = this.dbService.getDatabase();
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Real-time stats
      const [
        pendingCount,
        processingCount,
        completedLast24h,
        failedLast24h,
      ] = await Promise.all([
        db('payment_transactions').where('status', 'pending').count('* as count').first(),
        db('payment_transactions').where('status', 'processing').count('* as count').first(),
        db('payment_transactions')
          .where('status', 'completed')
          .where('updated_at', '>=', last24h)
          .count('* as count')
          .first(),
        db('payment_transactions')
          .where('status', 'failed')
          .where('updated_at', '>=', last24h)
          .count('* as count')
          .first(),
      ]);

      // Calculate success rate
      const completedCount = (completedLast24h as any)?.count || 0;
      const failedCount = (failedLast24h as any)?.count || 0;
      const totalCount = completedCount + failedCount;
      const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 100;

      // Calculate average processing time
      const avgProcessingTime = await this.calculateAverageProcessingTime();

      // Revenue stats
      const [feesLast24h, feesLast7d, feesLast30d, totalVolume] = await Promise.all([
        this.calculateTotalFees(last24h),
        this.calculateTotalFees(last7d),
        this.calculateTotalFees(last30d),
        this.calculateTotalVolume(),
      ]);

      // Recent transactions
      const recentTransactions = await db('payment_transactions')
        .select('transaction_id', 'amount', 'currency', 'status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(10);

      // Performance metrics
      const averageResponseTime = this.calculateAverageResponseTime();
      const requestsPerMinute = this.calculateRequestsPerMinute();
      const errorRate = this.calculateErrorRate();
      const cacheHitRate = this.calculateCacheHitRate();

      const metrics: DashboardMetrics = {
        realTimeStats: {
          pendingTransactions: (pendingCount as any)?.count || 0,
          processingTransactions: (processingCount as any)?.count || 0,
          completedLast24h: completedCount,
          failedLast24h: failedCount,
          averageProcessingTime: avgProcessingTime,
          successRate: Math.round(successRate * 100) / 100,
        },
        revenueStats: {
          totalFeesLast24h: feesLast24h,
          totalFeesLast7d: feesLast7d,
          totalFeesLast30d: feesLast30d,
          totalVolumeProcessed: totalVolume,
        },
        performance: {
          averageResponseTime,
          requestsPerMinute,
          errorRate,
          cacheHitRate,
        },
        recentTransactions,
        recentErrors: [], // Would be populated from Sentry or error logs
      };

      return metrics;
    } catch (error) {
      errorTracking.captureException(error as Error, {
        level: 'error',
        tags: { operation: 'dashboard_metrics' },
      });

      throw error;
    }
  }

  /**
   * Record a request for metrics
   */
  recordRequest(endpoint: string, responseTime: number): void {
    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Record request count
    const minute = Math.floor(Date.now() / 60000);
    const key = `${endpoint}-${minute}`;
    const counts = this.requestCounts.get(key) || [];
    counts.push(Date.now());
    this.requestCounts.set(key, counts);

    // Clean up old entries
    this.cleanupOldMetrics();
  }

  /**
   * Record an error for metrics
   */
  recordError(): void {
    this.errorCounts++;
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      const db = this.dbService.getDatabase();
      await db.raw('SELECT 1');

      return {
        status: 'up',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * Check UEX API health
   */
  private async checkUEXAPIHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
      // This would make an actual API call to UEX health endpoint
      // For now, we'll assume it's up
      return {
        status: 'up',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * Check error tracking health
   */
  private checkErrorTrackingHealth(): ServiceStatus {
    try {
      const isEnabled = !!process.env.SENTRY_DSN;
      return {
        status: isEnabled ? 'up' : 'degraded',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastChecked: new Date(),
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * Check email service health
   */
  private checkEmailServiceHealth(): ServiceStatus {
    try {
      const isConfigured =
        !!process.env.SENDGRID_API_KEY ||
        !!process.env.AWS_ACCESS_KEY_ID ||
        !!process.env.SMTP_HOST;

      return {
        status: isConfigured ? 'up' : 'degraded',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastChecked: new Date(),
        errorMessage: (error as Error).message,
      };
    }
  }

  /**
   * Calculate average processing time
   */
  private async calculateAverageProcessingTime(): Promise<number> {
    try {
      const db = this.dbService.getDatabase();
      const result = await db('payment_transactions')
        .where('status', 'completed')
        .whereNotNull('updated_at')
        .select(
          db.raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time')
        )
        .first();

      return Math.round((result as any)?.avg_time || 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate total fees
   */
  private async calculateTotalFees(since: Date): Promise<number> {
    try {
      const db = this.dbService.getDatabase();
      const result = await db('payment_transactions')
        .where('status', 'completed')
        .where('created_at', '>=', since)
        .sum({
          total_fees: db.raw('uex_buyer_fee + uex_seller_fee + platform_fee'),
        })
        .first();

      return (result as any)?.total_fees || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate total volume
   */
  private async calculateTotalVolume(): Promise<number> {
    try {
      const db = this.dbService.getDatabase();
      const result = await db('payment_transactions')
        .where('status', 'completed')
        .sum('amount as total_volume')
        .first();

      return (result as any)?.total_volume || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.responseTimes.length) * 100) / 100;
  }

  /**
   * Calculate requests per minute
   */
  private calculateRequestsPerMinute(): number {
    const currentMinute = Math.floor(Date.now() / 60000);
    let total = 0;

    this.requestCounts.forEach((counts, key) => {
      const minute = parseInt(key.split('-').pop() || '0');
      if (minute === currentMinute) {
        total += counts.length;
      }
    });

    return total;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const totalRequests = this.responseTimes.length;
    if (totalRequests === 0) return 0;

    return Math.round((this.errorCounts / totalRequests) * 100 * 100) / 100;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;

    return Math.round((this.cacheHits / total) * 100 * 100) / 100;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const currentMinute = Math.floor(Date.now() / 60000);
    const keysToDelete: string[] = [];

    this.requestCounts.forEach((counts, key) => {
      const minute = parseInt(key.split('-').pop() || '0');
      if (currentMinute - minute > 60) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.requestCounts.delete(key));
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Reset metrics every hour
    setInterval(() => {
      this.errorCounts = 0;
      this.cacheHits = 0;
      this.cacheMisses = 0;
    }, 60 * 60 * 1000);
  }

  /**
   * Check if alert should be triggered
   */
  async checkAlerts(config: AlertConfig): Promise<Array<{ type: string; message: string; severity: string }>> {
    if (!config.enabled) {
      return [];
    }

    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    // Check error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > config.errorRateThreshold) {
      alerts.push({
        type: 'error_rate',
        message: `Error rate (${errorRate}%) exceeds threshold (${config.errorRateThreshold}%)`,
        severity: 'high',
      });
    }

    // Check response time
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > config.responseTimeThreshold) {
      alerts.push({
        type: 'response_time',
        message: `Average response time (${avgResponseTime}ms) exceeds threshold (${config.responseTimeThreshold}ms)`,
        severity: 'medium',
      });
    }

    // Check failed transactions
    const db = this.dbService.getDatabase();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedCount = await db('payment_transactions')
      .where('status', 'failed')
      .where('created_at', '>=', last24h)
      .count('* as count')
      .first();

    if ((failedCount as any)?.count > config.failedTransactionThreshold) {
      alerts.push({
        type: 'failed_transactions',
        message: `Failed transactions (${(failedCount as any)?.count}) exceed threshold (${config.failedTransactionThreshold})`,
        severity: 'high',
      });
    }

    return alerts;
  }
}

// Singleton instance
let monitoringServiceInstance: MonitoringService | null = null;

export function getMonitoringService(dbService: DatabaseService): MonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new MonitoringService(dbService);
  }
  return monitoringServiceInstance;
}
