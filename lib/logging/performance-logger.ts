/**
 * Performance Logging
 *
 * Track and log performance metrics for operations, queries, and requests.
 */

import { structuredLogger } from './structured-logger'
import type { LogContext } from './structured-logger'

/**
 * Performance timer
 */
export class PerformanceTimer {
  private startTime: number
  private endTime?: number
  private marks: Map<string, number> = new Map()

  constructor(private operation: string) {
    this.startTime = Date.now()
  }

  /**
   * Mark a checkpoint
   */
  mark(label: string): void {
    const now = Date.now()
    this.marks.set(label, now - this.startTime)
  }

  /**
   * Get duration for a mark
   */
  getMark(label: string): number | undefined {
    return this.marks.get(label)
  }

  /**
   * Get total duration
   */
  getDuration(): number {
    if (this.endTime) {
      return this.endTime - this.startTime
    }
    return Date.now() - this.startTime
  }

  /**
   * End the timer and return duration
   */
  end(): number {
    this.endTime = Date.now()
    return this.getDuration()
  }

  /**
   * End timer and log performance
   */
  endAndLog(context?: LogContext): number {
    const duration = this.end()

    const marks = Object.fromEntries(this.marks)

    structuredLogger.info(`Performance: ${this.operation} completed in ${duration}ms`, {
      ...context,
      operation: this.operation,
      duration,
      marks: Object.keys(marks).length > 0 ? marks : undefined,
    })

    return duration
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    operation: string
    duration: number
    marks: Record<string, number>
  } {
    return {
      operation: this.operation,
      duration: this.getDuration(),
      marks: Object.fromEntries(this.marks),
    }
  }
}

/**
 * Start a performance timer
 */
export function startTimer(operation: string): PerformanceTimer {
  return new PerformanceTimer(operation)
}

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const timer = startTimer(operation)

  try {
    const result = await fn()
    timer.endAndLog({ ...context, success: true })
    return result
  } catch (error) {
    const duration = timer.end()
    structuredLogger.error(
      `Performance: ${operation} failed after ${duration}ms`,
      error,
      {
        ...context,
        operation,
        duration,
        success: false,
      }
    )
    throw error
  }
}

/**
 * Measure synchronous function performance
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  context?: LogContext
): T {
  const timer = startTimer(operation)

  try {
    const result = fn()
    timer.endAndLog({ ...context, success: true })
    return result
  } catch (error) {
    const duration = timer.end()
    structuredLogger.error(
      `Performance: ${operation} failed after ${duration}ms`,
      error,
      {
        ...context,
        operation,
        duration,
        success: false,
      }
    )
    throw error
  }
}

/**
 * Log performance metric
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>,
  context?: LogContext
): void {
  // Determine log level based on duration
  let level: 'debug' | 'info' | 'warn' = 'debug'

  // Warn for slow operations
  if (duration > 5000) {
    level = 'warn'
  } else if (duration > 1000) {
    level = 'info'
  }

  const logMethod = structuredLogger[level]
  logMethod(`Performance: ${operation} (${duration}ms)`, {
    ...context,
    operation,
    duration,
    ...metadata,
  })
}

/**
 * Track slow operations
 */
const slowOperations: Map<string, number[]> = new Map()

export function trackSlowOperation(
  operation: string,
  duration: number,
  threshold: number = 1000
): void {
  if (duration <= threshold) {
    return
  }

  // Track slow operations
  if (!slowOperations.has(operation)) {
    slowOperations.set(operation, [])
  }

  const durations = slowOperations.get(operation)!
  durations.push(duration)

  // Keep only last 100 entries
  if (durations.length > 100) {
    durations.shift()
  }

  // Log if this is consistently slow
  if (durations.length >= 5) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    if (avg > threshold) {
      structuredLogger.warn(
        `Consistently slow operation: ${operation} (avg: ${Math.round(avg)}ms over ${durations.length} calls)`,
        {
          operation,
          average: Math.round(avg),
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length,
        }
      )
    }
  }
}

/**
 * Get slow operation statistics
 */
export function getSlowOperationStats(): Record<string, {
  count: number
  average: number
  min: number
  max: number
}> {
  const stats: Record<string, any> = {}

  for (const [operation, durations] of slowOperations.entries()) {
    if (durations.length === 0) continue

    stats[operation] = {
      count: durations.length,
      average: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
    }
  }

  return stats
}

/**
 * Clear slow operation tracking
 */
export function clearSlowOperationTracking(): void {
  slowOperations.clear()
}

/**
 * Decorator for measuring method performance
 */
export function Measure(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const op = operation || `${target.constructor.name}.${propertyKey}`
      return measurePerformance(op, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}
