/**
 * Error Handler Utilities
 *
 * Centralized error handling, logging, and reporting for Terra Atlas.
 */

import { logger } from '../logger'
import {
  TerraAtlasError,
  isTerraAtlasError,
  isOperationalError,
  getStatusCode,
  getErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
} from './error-types'

/**
 * Error context for logging and reporting
 */
export interface ErrorContext {
  requestId?: string
  userId?: string
  path?: string
  method?: string
  ip?: string
  userAgent?: string
  [key: string]: unknown
}

/**
 * Error report for external error tracking services (e.g., Sentry)
 */
export interface ErrorReport {
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  fingerprint?: string[]
}

/**
 * Handle error and return appropriate response data
 */
export function handleError(error: unknown, context?: ErrorContext): {
  statusCode: number
  code: string
  message: string
  details?: unknown
  errors?: string[]
} {
  // Log the error
  logError(error, context)

  // Report to error tracking service if configured
  if (shouldReportError(error)) {
    reportError(error, context)
  }

  // Convert to appropriate response
  if (isTerraAtlasError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.context,
      errors: error instanceof ValidationError ? error.errors : undefined,
    }
  }

  // Handle known error types
  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: isDevelopment() ? error.message : 'An unexpected error occurred',
      details: isDevelopment() ? { stack: error.stack } : undefined,
    }
  }

  // Unknown error type
  return {
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: isDevelopment() ? { error } : undefined,
  }
}

/**
 * Log error with appropriate level and context
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const errorInfo = {
    ...context,
    timestamp: new Date().toISOString(),
  }

  if (isTerraAtlasError(error)) {
    const level = getLogLevel(error)

    if (level === 'error') {
      logger.error(
        `[${error.code}] ${error.message}`,
        error,
        errorInfo
      )
    } else {
      logger.warn(
        `[${error.code}] ${error.message}`,
        errorInfo
      )
    }
  } else if (error instanceof Error) {
    logger.error(
      `Unexpected error: ${error.message}`,
      error,
      errorInfo
    )
  } else {
    logger.error(
      'Unknown error occurred',
      errorInfo
    )
  }
}

/**
 * Determine log level based on error type
 */
function getLogLevel(error: TerraAtlasError): 'error' | 'warn' | 'info' {
  // Client errors (4xx) are warnings
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return 'warn'
  }

  // Server errors (5xx) are errors
  if (error.statusCode >= 500) {
    return 'error'
  }

  return 'info'
}

/**
 * Report error to external error tracking service
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  // Only report in production
  if (!isProduction()) {
    return
  }

  // TODO: Integrate with Sentry or other error tracking service
  // Example:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureException(error, { contexts: { custom: context } })

  const report: ErrorReport = {
    error: error instanceof Error ? error : new Error(String(error)),
    context: context || {},
    severity: getErrorSeverity(error),
    timestamp: new Date().toISOString(),
    fingerprint: getErrorFingerprint(error),
  }

  // Log that we would report this error
  logger.info('Error report would be sent to tracking service', report)
}

/**
 * Determine if error should be reported to external service
 */
function shouldReportError(error: unknown): boolean {
  // Don't report operational errors (expected errors)
  if (isOperationalError(error)) {
    return false
  }

  // Don't report client errors (4xx) except auth failures
  if (isTerraAtlasError(error)) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return error instanceof AuthenticationError || error instanceof AuthorizationError
    }
  }

  return true
}

/**
 * Get error severity for reporting
 */
function getErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
  if (isTerraAtlasError(error)) {
    // Configuration errors are critical
    if (!error.isOperational) {
      return 'critical'
    }

    // Database and external service errors are high
    if (error instanceof DatabaseError || error instanceof ExternalServiceError) {
      return 'high'
    }

    // Auth errors are medium
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return 'medium'
    }

    // Validation and not found errors are low
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return 'low'
    }

    // Server errors (5xx) are high
    if (error.statusCode >= 500) {
      return 'high'
    }
  }

  return 'medium'
}

/**
 * Generate fingerprint for error grouping
 */
function getErrorFingerprint(error: unknown): string[] | undefined {
  if (isTerraAtlasError(error)) {
    return [error.code, error.constructor.name]
  }

  if (error instanceof Error) {
    return [error.name, error.message]
  }

  return undefined
}

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Create error from unknown value
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value
  }

  if (typeof value === 'string') {
    return new Error(value)
  }

  return new Error(String(value))
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unknown error occurred'
}

/**
 * Extract all error messages from nested errors
 */
export function getAllErrorMessages(error: unknown): string[] {
  const messages: string[] = []

  if (isTerraAtlasError(error) && error instanceof ValidationError) {
    messages.push(error.message)
    messages.push(...error.errors)
  } else if (error instanceof Error) {
    messages.push(error.message)

    // Check for nested errors
    const cause = (error as any).cause
    if (cause) {
      messages.push(...getAllErrorMessages(cause))
    }
  } else if (typeof error === 'string') {
    messages.push(error)
  }

  return messages
}
