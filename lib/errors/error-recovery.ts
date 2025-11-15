/**
 * Error Recovery Strategies
 *
 * Provides mechanisms for recovering from errors gracefully.
 */

import {
  TerraAtlasError,
  isTerraAtlasError,
  ExternalServiceError,
  RateLimitError,
  DatabaseError,
  AuthenticationError,
} from './error-types'

/**
 * Recovery action types
 */
export type RecoveryActionType =
  | 'retry' // Retry the operation
  | 'refresh' // Refresh authentication
  | 'redirect' // Redirect to another page
  | 'fallback' // Use fallback data/UI
  | 'ignore' // Ignore the error
  | 'report' // Report to user and stop

/**
 * Recovery action definition
 */
export interface RecoveryAction {
  type: RecoveryActionType
  delay?: number // Delay before action (ms)
  maxRetries?: number // Maximum retry attempts
  redirectPath?: string // Path to redirect to
  fallbackData?: unknown // Fallback data to use
  message?: string // User-facing message
}

/**
 * Check if an error can be recovered from
 */
export function canRecover(error: unknown): boolean {
  if (!isTerraAtlasError(error)) {
    // Unknown errors cannot be recovered
    return false
  }

  // Non-operational errors (programming errors) cannot be recovered
  if (!error.isOperational) {
    return false
  }

  // Check specific error types
  if (error instanceof ExternalServiceError && error.isRetryable) {
    return true
  }

  if (error instanceof RateLimitError) {
    return true
  }

  if (error instanceof DatabaseError) {
    // Database errors might be recoverable (e.g., connection timeout)
    return true
  }

  if (error instanceof AuthenticationError) {
    // Auth errors can be recovered by refreshing token
    return true
  }

  return false
}

/**
 * Get recommended recovery action for an error
 */
export function getRecoveryAction(error: unknown): RecoveryAction {
  if (!isTerraAtlasError(error)) {
    return {
      type: 'report',
      message: 'An unexpected error occurred. Please try again.',
    }
  }

  // External service errors - retry with backoff
  if (error instanceof ExternalServiceError) {
    if (error.isRetryable) {
      return {
        type: 'retry',
        delay: 1000,
        maxRetries: 3,
        message: `${error.service} is temporarily unavailable. Retrying...`,
      }
    }
    return {
      type: 'fallback',
      message: `${error.service} is currently unavailable. Using cached data.`,
    }
  }

  // Rate limit errors - retry after delay
  if (error instanceof RateLimitError) {
    return {
      type: 'retry',
      delay: error.retryAfter || 60000,
      maxRetries: 1,
      message: 'Too many requests. Please wait a moment and try again.',
    }
  }

  // Database errors - retry with exponential backoff
  if (error instanceof DatabaseError) {
    return {
      type: 'retry',
      delay: 500,
      maxRetries: 2,
      message: 'Database is temporarily busy. Retrying...',
    }
  }

  // Authentication errors - redirect to login
  if (error instanceof AuthenticationError) {
    return {
      type: 'redirect',
      redirectPath: '/login',
      message: 'Your session has expired. Please log in again.',
    }
  }

  // Default: report to user
  return {
    type: 'report',
    message: error.message,
  }
}

/**
 * Execute recovery action
 */
export async function executeRecovery<T>(
  operation: () => Promise<T>,
  error: unknown,
  attemptNumber: number = 0
): Promise<T> {
  const action = getRecoveryAction(error)

  switch (action.type) {
    case 'retry':
      if (action.maxRetries && attemptNumber >= action.maxRetries) {
        throw error // Max retries exceeded
      }

      // Wait before retrying
      if (action.delay) {
        const delay = calculateBackoff(action.delay, attemptNumber)
        await sleep(delay)
      }

      // Retry the operation
      try {
        return await operation()
      } catch (retryError) {
        return executeRecovery(operation, retryError, attemptNumber + 1)
      }

    case 'fallback':
      // Return fallback data if available
      if (action.fallbackData !== undefined) {
        return action.fallbackData as T
      }
      throw error

    default:
      // Cannot recover, re-throw
      throw error
  }
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(baseDelay: number, attemptNumber: number): number {
  // Exponential backoff: baseDelay * 2^attemptNumber
  // With jitter to avoid thundering herd
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber)
  const jitter = Math.random() * 0.3 * exponentialDelay // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry an operation with automatic recovery
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, shouldRetry = canRecover } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error)) {
        const delay = calculateBackoff(baseDelay, attempt)
        await sleep(delay)
        continue
      }

      // Max retries exceeded or error not recoverable
      throw error
    }
  }

  throw lastError
}

/**
 * Circuit breaker state
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should try again (half-open)
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()

      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      // Trip circuit breaker if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = 'open'
      }

      throw error
    }
  }

  reset(): void {
    this.state = 'closed'
    this.failures = 0
    this.lastFailureTime = 0
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }
}

/**
 * Create a circuit breaker for an operation
 */
export function createCircuitBreaker(threshold = 5, timeout = 60000): CircuitBreaker {
  return new CircuitBreaker(threshold, timeout)
}
