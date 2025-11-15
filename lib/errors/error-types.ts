/**
 * Custom Error Types for Terra Atlas
 *
 * Provides specialized error classes for different error scenarios
 * to enable better error handling, logging, and user feedback.
 */

/**
 * Base error class for all Terra Atlas errors
 */
export class TerraAtlasError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Validation errors - invalid input data
 * HTTP 400 Bad Request
 */
export class ValidationError extends TerraAtlasError {
  public readonly errors: string[]

  constructor(message: string, errors: string[] = [], context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context)
    this.errors = errors
  }
}

/**
 * Authentication errors - missing or invalid credentials
 * HTTP 401 Unauthorized
 */
export class AuthenticationError extends TerraAtlasError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context)
  }
}

/**
 * Authorization errors - insufficient permissions
 * HTTP 403 Forbidden
 */
export class AuthorizationError extends TerraAtlasError {
  constructor(
    message: string = 'Insufficient permissions',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
  }
}

/**
 * Not found errors - resource doesn't exist
 * HTTP 404 Not Found
 */
export class NotFoundError extends TerraAtlasError {
  constructor(resource: string, id?: string | number, context?: Record<string, unknown>) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`
    super(message, 'NOT_FOUND', 404, true, context)
  }
}

/**
 * Conflict errors - resource already exists or state conflict
 * HTTP 409 Conflict
 */
export class ConflictError extends TerraAtlasError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, true, context)
  }
}

/**
 * Rate limit errors - too many requests
 * HTTP 429 Too Many Requests
 */
export class RateLimitError extends TerraAtlasError {
  public readonly retryAfter?: number

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, { retryAfter })
    this.retryAfter = retryAfter
  }
}

/**
 * Database errors - database operation failures
 * HTTP 500 Internal Server Error
 */
export class DatabaseError extends TerraAtlasError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, context)
  }
}

/**
 * External service errors - third-party API failures
 * HTTP 502 Bad Gateway / 503 Service Unavailable
 */
export class ExternalServiceError extends TerraAtlasError {
  public readonly service: string
  public readonly isRetryable: boolean

  constructor(
    service: string,
    message: string,
    isRetryable: boolean = true,
    context?: Record<string, unknown>
  ) {
    const statusCode = isRetryable ? 503 : 502
    super(message, 'EXTERNAL_SERVICE_ERROR', statusCode, true, { ...context, service })
    this.service = service
    this.isRetryable = isRetryable
  }
}

/**
 * Configuration errors - missing or invalid configuration
 * HTTP 500 Internal Server Error
 */
export class ConfigurationError extends TerraAtlasError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, false, context)
  }
}

/**
 * Payment errors - payment processing failures
 * HTTP 402 Payment Required
 */
export class PaymentError extends TerraAtlasError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, true, context)
  }
}

/**
 * Business logic errors - domain-specific errors
 * HTTP 422 Unprocessable Entity
 */
export class BusinessLogicError extends TerraAtlasError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, true, context)
  }
}

/**
 * Type guard to check if error is a TerraAtlasError
 */
export function isTerraAtlasError(error: unknown): error is TerraAtlasError {
  return error instanceof TerraAtlasError
}

/**
 * Type guard to check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isTerraAtlasError(error)) {
    return error.isOperational
  }
  return false
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: unknown): number {
  if (isTerraAtlasError(error)) {
    return error.statusCode
  }
  return 500
}

/**
 * Get error code from error
 */
export function getErrorCode(error: unknown): string {
  if (isTerraAtlasError(error)) {
    return error.code
  }
  return 'INTERNAL_ERROR'
}
