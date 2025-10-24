/**
 * Error Tracking Service with Sentry Integration
 * Centralized error tracking and logging for production monitoring
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  /**
   * Initialize Sentry
   */
  public initialize(options?: {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
  }): void {
    if (this.isInitialized) {
      console.warn('[ErrorTracking] Already initialized');
      return;
    }

    const dsn = options?.dsn || process.env.SENTRY_DSN;

    if (!dsn) {
      console.warn('[ErrorTracking] Sentry DSN not configured, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: options?.environment || process.env.NODE_ENV || 'development',

        // Performance Monitoring
        tracesSampleRate: options?.tracesSampleRate || 1.0,

        // Profiling
        profilesSampleRate: options?.profilesSampleRate || 1.0,
        integrations: [
          new ProfilingIntegration(),
        ],

        // Release tracking
        release: process.env.RELEASE_VERSION,

        // Enhanced error context
        beforeSend(event, hint) {
          // Sanitize sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }

            // Mask sensitive data in URL
            if (event.request.url) {
              event.request.url = event.request.url.replace(
                /api[_-]?key=[^&]*/gi,
                'api_key=***REDACTED***'
              );
            }
          }

          // Mask sensitive data in extra context
          if (event.extra) {
            if (event.extra.api_key) {
              event.extra.api_key = '***REDACTED***';
            }
            if (event.extra.secret_key) {
              event.extra.secret_key = '***REDACTED***';
            }
          }

          return event;
        },
      });

      this.isInitialized = true;
      console.log('[ErrorTracking] Sentry initialized successfully');
    } catch (error) {
      console.error('[ErrorTracking] Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  public captureException(
    error: Error,
    context?: {
      level?: Sentry.SeverityLevel;
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      user?: {
        id?: string;
        email?: string;
        username?: string;
      };
    }
  ): string | undefined {
    if (!this.isInitialized) {
      console.error('[ErrorTracking] Not initialized, logging error:', error);
      return undefined;
    }

    return Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });
  }

  /**
   * Capture a message
   */
  public captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): string | undefined {
    if (!this.isInitialized) {
      console.log(`[ErrorTracking] Not initialized, message: ${message}`);
      return undefined;
    }

    return Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      extra: context?.extra,
    });
  }

  /**
   * Set user context
   */
  public setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }): void {
    if (!this.isInitialized) return;

    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  public clearUser(): void {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
  }

  /**
   * Set custom context
   */
  public setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.setContext(name, context);
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  public addBreadcrumb(breadcrumb: {
    message: string;
    level?: Sentry.SeverityLevel;
    category?: string;
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      category: breadcrumb.category || 'custom',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Start a transaction for performance monitoring
   */
  public startTransaction(
    name: string,
    op: string,
    description?: string
  ): Sentry.Transaction | undefined {
    if (!this.isInitialized) return undefined;

    return Sentry.startTransaction({
      name,
      op,
      description,
    });
  }

  /**
   * Capture payment processing errors with enhanced context
   */
  public capturePaymentError(
    error: Error,
    context: {
      transactionId?: string;
      clientId?: string;
      sellerId?: string;
      amount?: number;
      currency?: string;
      paymentMethod?: string;
      stage?: 'validation' | 'processing' | 'completion';
    }
  ): string | undefined {
    return this.captureException(error, {
      level: 'error',
      tags: {
        payment_error: 'true',
        stage: context.stage || 'unknown',
        payment_method: context.paymentMethod || 'unknown',
        currency: context.currency || 'unknown',
      },
      extra: {
        transaction_id: context.transactionId,
        client_id: context.clientId,
        seller_id: context.sellerId,
        amount: context.amount,
      },
    });
  }

  /**
   * Capture UEX API errors
   */
  public captureUEXAPIError(
    error: Error,
    context: {
      endpoint?: string;
      method?: string;
      statusCode?: number;
      orderId?: string;
    }
  ): string | undefined {
    return this.captureException(error, {
      level: 'error',
      tags: {
        api_error: 'uex',
        endpoint: context.endpoint || 'unknown',
        method: context.method || 'unknown',
        status_code: context.statusCode?.toString() || 'unknown',
      },
      extra: {
        order_id: context.orderId,
      },
    });
  }

  /**
   * Capture database errors
   */
  public captureDatabaseError(
    error: Error,
    context: {
      operation?: string;
      table?: string;
      transactionId?: string;
    }
  ): string | undefined {
    return this.captureException(error, {
      level: 'error',
      tags: {
        database_error: 'true',
        operation: context.operation || 'unknown',
        table: context.table || 'unknown',
      },
      extra: {
        transaction_id: context.transactionId,
      },
    });
  }

  /**
   * Close Sentry connection (for graceful shutdown)
   */
  public async close(timeout: number = 2000): Promise<boolean> {
    if (!this.isInitialized) return true;

    try {
      await Sentry.close(timeout);
      console.log('[ErrorTracking] Sentry closed successfully');
      return true;
    } catch (error) {
      console.error('[ErrorTracking] Error closing Sentry:', error);
      return false;
    }
  }
}

// Export singleton instance
export const errorTracking = ErrorTrackingService.getInstance();
