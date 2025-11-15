/**
 * Structured Logging
 *
 * Enhanced logging with structured metadata and request context.
 */

import { logger } from '../logger'
import { getRequestContext, getRequestId } from './context'

/**
 * Log context interface
 */
export interface LogContext {
  requestId?: string
  userId?: string | number
  operation?: string
  duration?: number
  [key: string]: unknown
}

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Environment check
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Merge request context with provided context
 */
function mergeContext(context?: LogContext): LogContext {
  const requestContext = getRequestContext()

  return {
    requestId: getRequestId(),
    ...requestContext,
    ...context,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Log with structured context
 */
export function logWithContext(
  level: LogLevel,
  message: string,
  context?: LogContext
): void {
  const fullContext = mergeContext(context)

  // Format message with request ID
  const formattedMessage = fullContext.requestId
    ? `[${fullContext.requestId}] ${message}`
    : message

  // Log based on level
  switch (level) {
    case 'debug':
      logger.debug(formattedMessage, fullContext)
      break
    case 'info':
      logger.info(formattedMessage, fullContext)
      break
    case 'warn':
      logger.warn(formattedMessage, fullContext)
      break
    case 'error':
      logger.error(formattedMessage, fullContext)
      break
  }
}

/**
 * Convenience methods for each log level
 */
export const structuredLogger = {
  debug: (message: string, context?: LogContext) => logWithContext('debug', message, context),
  info: (message: string, context?: LogContext) => logWithContext('info', message, context),
  warn: (message: string, context?: LogContext) => logWithContext('warn', message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorContext = error instanceof Error
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error: String(error) }

    logWithContext('error', message, errorContext)
  },
}

/**
 * Log API request
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  logWithContext(
    level,
    `${method} ${path} ${statusCode} - ${duration}ms`,
    {
      ...context,
      method,
      path,
      statusCode,
      duration,
    }
  )
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  context?: LogContext
): void {
  // Only log slow queries in production
  const slowQueryThreshold = isProduction() ? 1000 : 100 // 1s in prod, 100ms in dev

  if (duration > slowQueryThreshold) {
    logWithContext(
      'warn',
      `Slow database query: ${operation} on ${table} took ${duration}ms`,
      {
        ...context,
        operation,
        table,
        duration,
        slow: true,
      }
    )
  } else if (isDevelopment()) {
    logWithContext(
      'debug',
      `Database query: ${operation} on ${table} (${duration}ms)`,
      {
        ...context,
        operation,
        table,
        duration,
      }
    )
  }
}

/**
 * Log external API call
 */
export function logExternalAPI(
  service: string,
  endpoint: string,
  duration: number,
  success: boolean,
  context?: LogContext
): void {
  const level = success ? 'info' : 'error'

  logWithContext(
    level,
    `External API: ${service} ${endpoint} ${success ? 'succeeded' : 'failed'} (${duration}ms)`,
    {
      ...context,
      service,
      endpoint,
      duration,
      success,
    }
  )
}

/**
 * Log authentication event
 */
export function logAuth(
  event: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
  userId?: string | number,
  success: boolean = true,
  context?: LogContext
): void {
  const level = success ? 'info' : 'warn'

  logWithContext(
    level,
    `Auth event: ${event} ${success ? 'succeeded' : 'failed'}${userId ? ` for user ${userId}` : ''}`,
    {
      ...context,
      event,
      userId,
      success,
      category: 'authentication',
    }
  )
}

/**
 * Log security event
 */
export function logSecurity(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: LogContext
): void {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'

  logWithContext(
    level,
    `Security event [${severity.toUpperCase()}]: ${event}`,
    {
      ...context,
      event,
      severity,
      category: 'security',
    }
  )
}

/**
 * Log business event
 */
export function logBusiness(
  event: string,
  metadata?: Record<string, unknown>,
  context?: LogContext
): void {
  logWithContext(
    'info',
    `Business event: ${event}`,
    {
      ...context,
      event,
      ...metadata,
      category: 'business',
    }
  )
}
