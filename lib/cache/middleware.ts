/**
 * HTTP Caching Middleware
 *
 * Provides ETag generation, Cache-Control headers, and conditional request handling
 * for optimizing HTTP caching and reducing bandwidth usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { HttpCacheOptions } from './types'

/**
 * Generate ETag from data
 *
 * Creates a hash-based ETag for cache validation
 *
 * @param data - Data to generate ETag from
 * @param weak - Use weak ETag (W/"...") for semantic equivalence
 * @returns ETag string
 *
 * @example
 * const etag = generateETag(project) // "a3f2b1c..."
 * const weakEtag = generateETag(project, true) // W/"a3f2b1c..."
 */
export function generateETag(data: any, weak: boolean = false): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 16)

  return weak ? `W/"${hash}"` : `"${hash}"`
}

/**
 * Generate ETag from timestamp
 *
 * Useful when you have an updated_at or modified_at timestamp
 *
 * @param timestamp - Date or timestamp
 * @returns ETag string
 *
 * @example
 * const etag = generateETagFromTimestamp(project.updated_at)
 */
export function generateETagFromTimestamp(
  timestamp: Date | string | number
): string {
  const time =
    timestamp instanceof Date
      ? timestamp.getTime()
      : new Date(timestamp).getTime()
  return `"${time}"`
}

/**
 * Check if request has matching ETag (304 Not Modified check)
 *
 * @param request - Next.js request
 * @param etag - Current ETag
 * @returns True if client has current version
 *
 * @example
 * if (hasMatchingETag(request, etag)) {
 *   return new Response(null, { status: 304, headers: { 'ETag': etag } })
 * }
 */
export function hasMatchingETag(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  if (!ifNoneMatch) return false

  // Handle multiple ETags in if-none-match
  const clientETags = ifNoneMatch.split(',').map((tag) => tag.trim())

  return clientETags.includes(etag) || clientETags.includes('*')
}

/**
 * Check if resource has been modified since given date
 *
 * @param request - Next.js request
 * @param lastModified - Last modification date
 * @returns True if resource was modified
 *
 * @example
 * if (!isModifiedSince(request, project.updated_at)) {
 *   return new Response(null, { status: 304 })
 * }
 */
export function isModifiedSince(
  request: NextRequest,
  lastModified: Date
): boolean {
  const ifModifiedSince = request.headers.get('if-modified-since')
  if (!ifModifiedSince) return true

  const clientDate = new Date(ifModifiedSince)
  return lastModified > clientDate
}

/**
 * Build Cache-Control header value
 *
 * @param options - Cache control options
 * @returns Cache-Control header value
 *
 * @example
 * const header = buildCacheControl({
 *   maxAge: 300,
 *   visibility: 'public',
 *   mustRevalidate: true
 * })
 * // "public, max-age=300, must-revalidate"
 */
export function buildCacheControl(options: HttpCacheOptions): string {
  const parts: string[] = []

  // Visibility
  if (options.visibility) {
    parts.push(options.visibility)
  }

  // Max age
  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`)
  }

  // Revalidation
  if (options.mustRevalidate) {
    parts.push('must-revalidate')
  }

  return parts.join(', ')
}

/**
 * Add ETag header to response
 *
 * @param response - Next.js response
 * @param data - Data to generate ETag from
 * @param options - ETag options
 * @returns Response with ETag header
 *
 * @example
 * return addETagHeader(response, project, { weak: true })
 */
export function addETagHeader(
  response: NextResponse,
  data: any,
  options: { weak?: boolean; customGenerator?: (data: any) => string } = {}
): NextResponse {
  const etag = options.customGenerator
    ? options.customGenerator(data)
    : generateETag(data, options.weak)

  response.headers.set('ETag', etag)
  return response
}

/**
 * Add Cache-Control header to response
 *
 * @param response - Next.js response
 * @param options - Cache control options
 * @returns Response with Cache-Control header
 *
 * @example
 * return addCacheControlHeader(response, {
 *   maxAge: 300,
 *   visibility: 'public'
 * })
 */
export function addCacheControlHeader(
  response: NextResponse,
  options: HttpCacheOptions
): NextResponse {
  const cacheControl = buildCacheControl(options)
  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Add HTTP caching headers to response
 *
 * Adds both ETag and Cache-Control headers
 *
 * @param response - Next.js response
 * @param data - Data to generate ETag from
 * @param options - HTTP cache options
 * @returns Response with caching headers
 *
 * @example
 * return addHttpCacheHeaders(response, project, {
 *   maxAge: 600,
 *   visibility: 'public',
 *   useETag: true
 * })
 */
export function addHttpCacheHeaders(
  response: NextResponse,
  data: any,
  options: HttpCacheOptions
): NextResponse {
  // Add ETag if enabled
  if (options.useETag !== false) {
    const etag = options.etagGenerator
      ? options.etagGenerator(data)
      : generateETag(data)
    response.headers.set('ETag', etag)
  }

  // Add Cache-Control
  const cacheControl = buildCacheControl(options)
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl)
  }

  return response
}

/**
 * Handle conditional request
 *
 * Checks ETag and Last-Modified headers and returns 304 if not modified
 *
 * @param request - Next.js request
 * @param etag - Current ETag
 * @param lastModified - Last modification date (optional)
 * @returns 304 response if not modified, null otherwise
 *
 * @example
 * const notModified = handleConditionalRequest(request, etag, updated_at)
 * if (notModified) return notModified
 */
export function handleConditionalRequest(
  request: NextRequest,
  etag: string,
  lastModified?: Date
): NextResponse | null {
  // Check ETag
  if (hasMatchingETag(request, etag)) {
    const response = new NextResponse(null, { status: 304 })
    response.headers.set('ETag', etag)
    if (lastModified) {
      response.headers.set('Last-Modified', lastModified.toUTCString())
    }
    return response
  }

  // Check Last-Modified
  if (lastModified && !isModifiedSince(request, lastModified)) {
    const response = new NextResponse(null, { status: 304 })
    response.headers.set('ETag', etag)
    response.headers.set('Last-Modified', lastModified.toUTCString())
    return response
  }

  return null
}

/**
 * Middleware wrapper for ETag support
 *
 * Automatically handles ETag generation and conditional requests
 *
 * @param handler - Request handler function
 * @param options - HTTP cache options
 * @returns Wrapped handler with ETag support
 *
 * @example
 * export const GET = withETag(
 *   async (request) => {
 *     const project = await getProject(id)
 *     return NextResponse.json(project)
 *   },
 *   { maxAge: 600 }
 * )
 */
export function withETag(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: HttpCacheOptions = {}
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Execute handler
    const response = await handler(request, ...args)

    // Only add caching for successful responses
    if (response.status !== 200) {
      return response
    }

    try {
      // Get response body
      const data = await response.json()

      // Generate ETag
      const etag = options.etagGenerator
        ? options.etagGenerator(data)
        : generateETag(data)

      // Check if client has current version
      if (hasMatchingETag(request, etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: etag },
        })
      }

      // Create new response with caching headers
      const newResponse = NextResponse.json(data, { status: 200 })
      newResponse.headers.set('ETag', etag)

      // Add Cache-Control if configured
      if (options.maxAge !== undefined) {
        const cacheControl = buildCacheControl(options)
        newResponse.headers.set('Cache-Control', cacheControl)
      }

      return newResponse
    } catch {
      // If can't parse JSON, return original response
      return response
    }
  }
}

/**
 * Middleware wrapper for Cache-Control headers
 *
 * Automatically adds Cache-Control headers to responses
 *
 * @param handler - Request handler function
 * @param options - Cache control options
 * @returns Wrapped handler with Cache-Control headers
 *
 * @example
 * export const GET = withCacheControl(
 *   async (request) => {
 *     const projects = await getProjects()
 *     return NextResponse.json(projects)
 *   },
 *   { maxAge: 300, visibility: 'public' }
 * )
 */
export function withCacheControl(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: HttpCacheOptions
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(request, ...args)

    // Only add caching for successful responses
    if (response.status === 200) {
      const cacheControl = buildCacheControl(options)
      if (cacheControl) {
        response.headers.set('Cache-Control', cacheControl)
      }
    }

    return response
  }
}

/**
 * Complete HTTP caching middleware
 *
 * Combines ETag generation, conditional requests, and Cache-Control headers
 *
 * @param handler - Request handler function
 * @param options - HTTP cache options
 * @returns Wrapped handler with full HTTP caching support
 *
 * @example
 * export const GET = withHttpCache(
 *   async (request) => {
 *     const projects = await getProjects()
 *     return NextResponse.json(projects)
 *   },
 *   {
 *     maxAge: 300,
 *     visibility: 'public',
 *     useETag: true,
 *     mustRevalidate: true
 *   }
 * )
 */
export function withHttpCache(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: HttpCacheOptions = {}
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Execute handler
    const response = await handler(request, ...args)

    // Only add caching for successful responses
    if (response.status !== 200) {
      return response
    }

    try {
      // Get response body
      const data = await response.json()

      // Generate ETag if enabled
      if (options.useETag !== false) {
        const etag = options.etagGenerator
          ? options.etagGenerator(data)
          : generateETag(data)

        // Check if client has current version
        if (hasMatchingETag(request, etag)) {
          const notModifiedResponse = new NextResponse(null, { status: 304 })
          notModifiedResponse.headers.set('ETag', etag)
          return notModifiedResponse
        }

        // Create new response with ETag
        const newResponse = NextResponse.json(data, { status: 200 })
        newResponse.headers.set('ETag', etag)

        // Add Cache-Control
        const cacheControl = buildCacheControl(options)
        if (cacheControl) {
          newResponse.headers.set('Cache-Control', cacheControl)
        }

        return newResponse
      } else {
        // No ETag, just add Cache-Control
        const cacheControl = buildCacheControl(options)
        if (cacheControl) {
          response.headers.set('Cache-Control', cacheControl)
        }
        return response
      }
    } catch {
      // If can't parse JSON, return original response
      return response
    }
  }
}

/**
 * Helper to create 304 Not Modified response
 *
 * @param etag - ETag value
 * @param lastModified - Last modification date (optional)
 * @returns 304 response
 *
 * @example
 * return notModifiedResponse(etag, project.updated_at)
 */
export function notModifiedResponse(
  etag: string,
  lastModified?: Date
): NextResponse {
  const response = new NextResponse(null, { status: 304 })
  response.headers.set('ETag', etag)
  if (lastModified) {
    response.headers.set('Last-Modified', lastModified.toUTCString())
  }
  return response
}

/**
 * Export all HTTP caching utilities as a namespace
 */
export const HttpCache = {
  // ETag utilities
  generateETag,
  generateETagFromTimestamp,
  hasMatchingETag,

  // Last-Modified utilities
  isModifiedSince,

  // Cache-Control utilities
  buildCacheControl,

  // Response helpers
  addETagHeader,
  addCacheControlHeader,
  addHttpCacheHeaders,
  handleConditionalRequest,
  notModifiedResponse,

  // Middleware wrappers
  withETag,
  withCacheControl,
  withHttpCache,
}
