/**
 * Request Context Management
 *
 * Provides request-scoped context for logging and tracing.
 */

import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

/**
 * Request context data
 */
export interface RequestContext {
  requestId: string
  userId?: string | number
  path?: string
  method?: string
  ip?: string
  userAgent?: string
  startTime?: number
  [key: string]: unknown
}

/**
 * Async local storage for request context
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Initialize request context
 */
export function initRequestContext(initialContext?: Partial<RequestContext>): RequestContext {
  const context: RequestContext = {
    requestId: initialContext?.requestId || generateRequestId(),
    startTime: Date.now(),
    ...initialContext,
  }

  return context
}

/**
 * Run a function with request context
 */
export function runWithContext<T>(
  context: RequestContext,
  callback: () => T
): T {
  return asyncLocalStorage.run(context, callback)
}

/**
 * Get current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore()
}

/**
 * Get request ID from context or generate new one
 */
export function getRequestId(): string {
  const context = getRequestContext()
  return context?.requestId || generateRequestId()
}

/**
 * Update current request context
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
  const context = getRequestContext()
  if (context) {
    Object.assign(context, updates)
  }
}

/**
 * Set user ID in context
 */
export function setUserId(userId: string | number): void {
  updateRequestContext({ userId })
}

/**
 * Get user ID from context
 */
export function getUserId(): string | number | undefined {
  const context = getRequestContext()
  return context?.userId
}

/**
 * Get request duration in ms
 */
export function getRequestDuration(): number {
  const context = getRequestContext()
  if (!context?.startTime) {
    return 0
  }
  return Date.now() - context.startTime
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '').substring(0, 16)}`
}

/**
 * Extract request context from headers/request
 */
export function extractContextFromRequest(request: {
  headers?: Headers
  method?: string
  url?: string
  ip?: string
}): Partial<RequestContext> {
  const headers = request.headers

  return {
    requestId: headers?.get('x-request-id') || generateRequestId(),
    method: request.method,
    path: request.url ? new URL(request.url).pathname : undefined,
    ip: headers?.get('x-forwarded-for') || headers?.get('x-real-ip') || request.ip,
    userAgent: headers?.get('user-agent') || undefined,
  }
}
