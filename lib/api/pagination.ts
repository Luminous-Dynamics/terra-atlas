/**
 * Pagination Helpers
 *
 * Utilities for handling pagination in API responses.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number
  offset: number
  page?: number
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  defaultLimit?: number
  maxLimit?: number
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(
  request: NextRequest,
  options?: PaginationOptions
): PaginationParams {
  const { defaultLimit = 20, maxLimit = 100 } = options || {}

  const { searchParams } = new URL(request.url)

  // Parse limit
  const limitParam = searchParams.get('limit')
  let limit = defaultLimit
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit)
    }
  }

  // Parse offset
  const offsetParam = searchParams.get('offset')
  let offset = 0
  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed
    }
  }

  // Parse page (alternative to offset)
  const pageParam = searchParams.get('page')
  let page: number | undefined
  if (pageParam) {
    const parsed = parseInt(pageParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed
      offset = (page - 1) * limit
    }
  }

  return { limit, offset, page }
}

/**
 * Parse pagination from query parameters object
 */
export function parsePaginationFromQuery(
  query: Record<string, string | string[] | undefined>,
  options?: PaginationOptions
): PaginationParams {
  const { defaultLimit = 20, maxLimit = 100 } = options || {}

  // Parse limit
  const limitParam = Array.isArray(query.limit) ? query.limit[0] : query.limit
  let limit = defaultLimit
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit)
    }
  }

  // Parse offset
  const offsetParam = Array.isArray(query.offset) ? query.offset[0] : query.offset
  let offset = 0
  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed
    }
  }

  // Parse page
  const pageParam = Array.isArray(query.page) ? query.page[0] : query.page
  let page: number | undefined
  if (pageParam) {
    const parsed = parseInt(pageParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed
      offset = (page - 1) * limit
    }
  }

  return { limit, offset, page }
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  limit: number,
  offset: number
): {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  page: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  startIndex: number
  endIndex: number
} {
  const totalPages = Math.ceil(total / limit) || 1
  const page = Math.floor(offset / limit) + 1
  const startIndex = offset
  const endIndex = Math.min(offset + limit, total)

  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    page,
    totalPages,
    hasPrevious: offset > 0,
    hasNext: offset + limit < total,
    startIndex,
    endIndex,
  }
}

/**
 * Generate pagination links
 */
export function generatePaginationLinks(
  baseUrl: string,
  pagination: {
    page: number
    totalPages: number
    limit: number
  }
): {
  first?: string
  previous?: string
  next?: string
  last?: string
} {
  const { page, totalPages, limit } = pagination

  const links: {
    first?: string
    previous?: string
    next?: string
    last?: string
  } = {}

  // First page
  links.first = `${baseUrl}?page=1&limit=${limit}`

  // Previous page
  if (page > 1) {
    links.previous = `${baseUrl}?page=${page - 1}&limit=${limit}`
  }

  // Next page
  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`
  }

  // Last page
  if (totalPages > 1) {
    links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`
  }

  return links
}

/**
 * Zod schema for pagination query parameters
 */
export const paginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().nonnegative()),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
})

/**
 * Apply pagination to an array
 */
export function paginateArray<T>(
  items: T[],
  params: PaginationParams
): {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
} {
  const { limit, offset } = params
  const total = items.length
  const data = items.slice(offset, offset + limit)

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  }
}

/**
 * Convert page number to offset
 */
export function pageToOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Convert offset to page number
 */
export function offsetToPage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1
}
