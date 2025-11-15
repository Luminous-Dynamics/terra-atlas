/**
 * API Response Builders
 *
 * Type-safe response builders for standardized API responses.
 */

import { NextResponse } from 'next/server'
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  ResponseMeta,
  ErrorDetails,
  PaginationInfo,
} from './types'
import { handleError } from '../errors/error-handler'
import { isTerraAtlasError, ValidationError } from '../errors/error-types'

/**
 * Generate response metadata
 */
function createMeta(requestId?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId,
    version: process.env.npm_package_version || '1.0.0',
  }
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { status = 200, requestId, headers = {} } = options || {}

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  }

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Create an error response
 */
export function errorResponse(
  messageOrError: string | Error | unknown,
  options?: {
    status?: number
    code?: string
    details?: unknown
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  const { status, code, details, requestId, headers = {} } = options || {}

  let errorDetails: ErrorDetails

  // Handle different error types
  if (typeof messageOrError === 'string') {
    // Simple string message
    errorDetails = {
      code: code || 'ERROR',
      message: messageOrError,
      details,
    }
  } else {
    // Error object - use error handler
    const handled = handleError(messageOrError)
    errorDetails = {
      code: handled.code,
      message: handled.message,
      details: handled.details || details,
      errors: handled.errors,
    }

    // Use status from handled error if not provided
    if (!status) {
      return errorResponse(messageOrError, {
        ...options,
        status: handled.statusCode,
      })
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    if (messageOrError instanceof Error) {
      errorDetails.stack = messageOrError.stack
    }
  }

  const response: ApiErrorResponse = {
    success: false,
    error: errorDetails,
    meta: createMeta(requestId),
  }

  return NextResponse.json(response, {
    status: status || 500,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: string[] | Record<string, string | string[]>,
  options?: {
    message?: string
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  const { message = 'Validation failed', requestId, headers = {} } = options || {}

  // Convert errors to array format
  const errorArray = Array.isArray(errors)
    ? errors
    : Object.entries(errors).flatMap(([field, fieldErrors]) => {
        const errorList = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors]
        return errorList.map((err) => `${field}: ${err}`)
      })

  const errorDetails: ErrorDetails = {
    code: 'VALIDATION_ERROR',
    message,
    errors: errorArray,
  }

  const response: ApiErrorResponse = {
    success: false,
    error: errorDetails,
    meta: createMeta(requestId),
  }

  return NextResponse.json(response, {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    total: number
    limit: number
    offset: number
  },
  options?: {
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<PaginatedResponse<T>> {
  const { total, limit, offset } = pagination
  const { requestId, headers = {} } = options || {}

  const paginationInfo: PaginationInfo = {
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
  }

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: paginationInfo,
    meta: createMeta(requestId),
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Create a 404 not found response
 */
export function notFoundResponse(
  resource: string,
  id?: string | number,
  options?: {
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`

  return errorResponse(message, {
    status: 404,
    code: 'NOT_FOUND',
    ...options,
  })
}

/**
 * Create a 401 unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Authentication required',
  options?: {
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, {
    status: 401,
    code: 'AUTHENTICATION_ERROR',
    ...options,
  })
}

/**
 * Create a 403 forbidden response
 */
export function forbiddenResponse(
  message: string = 'Insufficient permissions',
  options?: {
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, {
    status: 403,
    code: 'AUTHORIZATION_ERROR',
    ...options,
  })
}

/**
 * Create a 409 conflict response
 */
export function conflictResponse(
  message: string,
  options?: {
    requestId?: string
    details?: unknown
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, {
    status: 409,
    code: 'CONFLICT_ERROR',
    ...options,
  })
}

/**
 * Create a 429 rate limit response
 */
export function rateLimitResponse(
  retryAfter?: number,
  options?: {
    message?: string
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  const { message = 'Too many requests', requestId } = options || {}

  const headers: Record<string, string> = {}
  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter)
  }

  return errorResponse(message, {
    status: 429,
    code: 'RATE_LIMIT_ERROR',
    details: { retryAfter },
    requestId,
    headers,
  })
}

/**
 * Create a 201 created response
 */
export function createdResponse<T>(
  data: T,
  options?: {
    location?: string
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { location, requestId, headers = {} } = options || {}

  if (location) {
    headers['Location'] = location
  }

  return successResponse(data, {
    status: 201,
    requestId,
    headers,
  })
}

/**
 * Create a 204 no content response
 */
export function noContentResponse(
  options?: {
    headers?: Record<string, string>
  }
): NextResponse {
  const { headers = {} } = options || {}

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}
