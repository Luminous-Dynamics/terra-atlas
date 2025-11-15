/**
 * API Response Types
 *
 * Standardized type definitions for all API responses.
 */

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string
  requestId?: string
  version?: string
}

/**
 * Success response
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta: ResponseMeta
}

/**
 * Error details
 */
export interface ErrorDetails {
  code: string
  message: string
  details?: unknown
  errors?: string[] // For validation errors
  stack?: string // Only in development
}

/**
 * Error response
 */
export interface ApiErrorResponse {
  success: false
  error: ErrorDetails
  meta: ResponseMeta
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  page?: number
  totalPages?: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: PaginationInfo
  meta: ResponseMeta
}

/**
 * Union type for all possible responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version?: string
  checks?: {
    database?: 'ok' | 'error'
    cache?: 'ok' | 'error'
    externalServices?: Record<string, 'ok' | 'error'>
  }
}

/**
 * Stats response
 */
export interface StatsResponse {
  users?: number
  projects?: number
  investments?: number
  totalInvested?: number
  [key: string]: number | undefined
}
