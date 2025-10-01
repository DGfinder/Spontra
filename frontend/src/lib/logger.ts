/**
 * Centralized Logging Service with Correlation IDs
 * Provides structured logging across the application with distributed tracing support
 */

import { getTraceContext, addCorrelationIds } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogContext {
  correlationId?: string
  requestId?: string
  sessionId?: string
  userId?: string
  adminId?: string
  operation?: string
  component?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context: LogContext
  trace?: {
    traceId?: string
    spanId?: string
  }
  environment: string
  service: string
  version: string
}

class CentralizedLogger {
  private service: string
  private version: string
  private environment: string

  constructor() {
    this.service = 'spontra-frontend'
    this.version = process.env.npm_package_version || '1.0.0'
    this.environment = process.env.NODE_ENV || 'development'
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {}
  ): LogEntry {
    const traceContext = getTraceContext()
    
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        // Auto-generate correlation IDs if not provided
        correlationId: context.correlationId || crypto.randomUUID(),
        requestId: context.requestId || crypto.randomUUID()
      },
      trace: {
        traceId: traceContext.traceId,
        spanId: traceContext.spanId
      },
      environment: this.environment,
      service: this.service,
      version: this.version
    }
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(logEntry: LogEntry): void {
    const logOutput = {
      ...logEntry,
      '@timestamp': logEntry.timestamp, // ELK Stack compatibility
      level: logEntry.level.toUpperCase(),
      source: logEntry.service,
      fields: {
        service: logEntry.service,
        version: logEntry.version,
        environment: logEntry.environment,
        ...logEntry.context,
        ...logEntry.trace
      }
    }

    // Console output for development
    if (this.environment === 'development') {
      const color = this.getLogLevelColor(logEntry.level)
      console.log(
        `${color}[${logEntry.level.toUpperCase()}]${'\x1b[0m'} ${logEntry.timestamp} ${logEntry.message}`,
        logEntry.context
      )
    }

    // Structured JSON output for production
    if (this.environment === 'production') {
      console.log(JSON.stringify(logOutput))
    }

    // Send to external logging service (e.g., DataDog, LogDNA, CloudWatch)
    if (process.env.LOGGING_ENDPOINT) {
      this.sendToExternalService(logOutput).catch(error => {
        console.error('Failed to send log to external service:', error)
      })
    }

    // Send errors to Sentry
    if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.FATAL) {
      const error = logEntry.context.metadata?.error || new Error(logEntry.message)
      sentryHelpers.captureError(error, 'error', {
        logger: logEntry.context,
        trace: logEntry.trace
      })
    }
  }

  /**
   * Get console color for log level
   */
  private getLogLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m' // Cyan
      case LogLevel.INFO: return '\x1b[32m'  // Green
      case LogLevel.WARN: return '\x1b[33m'  // Yellow
      case LogLevel.ERROR: return '\x1b[31m' // Red
      case LogLevel.FATAL: return '\x1b[35m' // Magenta
      default: return '\x1b[0m'             // Reset
    }
  }

  /**
   * Send log to external logging service
   */
  private async sendToExternalService(logEntry: any): Promise<void> {
    if (!process.env.LOGGING_ENDPOINT) return

    try {
      await fetch(process.env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_API_KEY || ''}`
        },
        body: JSON.stringify(logEntry),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
    } catch (error) {
      // Silent fail to prevent logging loops
      if (this.environment === 'development') {
        console.warn('Failed to send log to external service:', error)
      }
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: LogContext = {}): void {
    if (this.environment === 'production') return // Skip debug logs in production
    
    const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.output(logEntry)
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}): void {
    const logEntry = this.createLogEntry(LogLevel.INFO, message, context)
    this.output(logEntry)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}): void {
    const logEntry = this.createLogEntry(LogLevel.WARN, message, context)
    this.output(logEntry)
  }

  /**
   * Error level logging
   */
  error(message: string, context: LogContext = {}): void {
    const logEntry = this.createLogEntry(LogLevel.ERROR, message, context)
    this.output(logEntry)
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, context: LogContext = {}): void {
    const logEntry = this.createLogEntry(LogLevel.FATAL, message, context)
    this.output(logEntry)
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry = this.createLogEntry(level, message, context)
    this.output(logEntry)
  }

  /**
   * Create a child logger with predefined context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  /**
   * Log HTTP request/response
   */
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`
    
    this.log(level, message, {
      ...context,
      component: 'http',
      metadata: {
        method,
        url,
        statusCode,
        responseTime,
        ...context.metadata
      }
    })
  }

  /**
   * Log database operations
   */
  dbOperation(
    operation: string,
    table: string,
    duration: number,
    context: LogContext = {}
  ): void {
    this.info(`Database ${operation} on ${table} - ${duration}ms`, {
      ...context,
      component: 'database',
      operation,
      metadata: {
        table,
        duration,
        ...context.metadata
      }
    })
  }

  /**
   * Log external API calls
   */
  externalApi(
    provider: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `External API ${provider} ${endpoint} ${statusCode} - ${responseTime}ms`
    
    this.log(level, message, {
      ...context,
      component: 'external_api',
      metadata: {
        provider,
        endpoint,
        statusCode,
        responseTime,
        ...context.metadata
      }
    })
  }

  /**
   * Log business events
   */
  businessEvent(
    event: string,
    data: Record<string, any>,
    context: LogContext = {}
  ): void {
    this.info(`Business event: ${event}`, {
      ...context,
      component: 'business',
      operation: event,
      metadata: {
        eventType: event,
        eventData: data,
        ...context.metadata
      },
      tags: ['business-event', ...(context.tags || [])]
    })
  }

  /**
   * Log security events
   */
  securityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: LogContext = {}
  ): void {
    const level = severity === 'critical' ? LogLevel.FATAL : 
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO

    this.log(level, `Security event: ${event}`, {
      ...context,
      component: 'security',
      operation: event,
      metadata: {
        securityEvent: event,
        severity,
        ...context.metadata
      },
      tags: ['security-event', severity, ...(context.tags || [])]
    })
  }
}

/**
 * Child logger with predefined context
 */
class ChildLogger {
  constructor(
    private parent: CentralizedLogger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context: LogContext = {}): LogContext {
    return {
      ...this.defaultContext,
      ...context,
      metadata: {
        ...this.defaultContext.metadata,
        ...context.metadata
      },
      tags: [
        ...(this.defaultContext.tags || []),
        ...(context.tags || [])
      ]
    }
  }

  debug(message: string, context: LogContext = {}): void {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context: LogContext = {}): void {
    this.parent.info(message, this.mergeContext(context))
  }

  warn(message: string, context: LogContext = {}): void {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, context: LogContext = {}): void {
    this.parent.error(message, this.mergeContext(context))
  }

  fatal(message: string, context: LogContext = {}): void {
    this.parent.fatal(message, this.mergeContext(context))
  }

  log(level: LogLevel, message: string, context: LogContext = {}): void {
    this.parent.log(level, message, this.mergeContext(context))
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this.parent, this.mergeContext(context))
  }
}

// Export singleton logger instance
export const logger = new CentralizedLogger()

// Export convenience functions
export const createLogger = (context: LogContext) => logger.child(context)

export const httpLogger = (req: any, res: any, responseTime: number) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID()
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()
  
  logger.httpRequest(
    req.method,
    req.url,
    res.statusCode,
    responseTime,
    {
      correlationId,
      requestId,
      userId: req.user?.id,
      sessionId: req.session?.id,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for'] || 'unknown',
        referer: req.headers.referer
      }
    }
  )
}

export default logger