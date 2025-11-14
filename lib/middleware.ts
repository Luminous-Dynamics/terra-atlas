/**
 * Terra Atlas API Middleware Utilities
 *
 * Provides reusable middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

// ============================================================================
// Rate Limiting (In-Memory)
// ============================================================================

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 *
 * @param key - Unique identifier (usually IP address or user ID)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore[key]

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore()
  }

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }

  // Increment existing record
  record.count++

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  const keys = Object.keys(rateLimitStore)

  for (const key of keys) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: {
    maxRequests?: number
    windowMs?: number
    keyGenerator?: (req: NextRequest) => string
  } = {}
): Promise<NextResponse> {
  const {
    maxRequests = 10,
    windowMs = 60000,
    keyGenerator = (req) => getClientIp(req)
  } = options

  const key = keyGenerator(request)
  const { allowed, remaining, resetTime } = checkRateLimit(key, maxRequests, windowMs)

  if (!allowed) {
    logger.warn(`Rate limit exceeded for ${key}`)

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  const response = await handler()

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

  return response
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Extract JWT token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Verify JWT token (requires JWT_SECRET to be set)
 */
export async function verifyToken(token: string): Promise<any> {
  const JWT_SECRET = process.env.JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }

  try {
    const jwt = await import('jsonwebtoken')
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    logger.error('Token verification failed:', error)
    return null
  }
}

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
  request: NextRequest,
  handler: (userId: string, tokenData: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractBearerToken(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required', message: 'No token provided' },
      { status: 401 }
    )
  }

  const decoded = await verifyToken(token)

  if (!decoded || !decoded.userId) {
    return NextResponse.json(
      { error: 'Invalid token', message: 'Authentication failed' },
      { status: 401 }
    )
  }

  return handler(decoded.userId, decoded)
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  logger.error(`API Error: ${message}`, details)

  return NextResponse.json(
    {
      error: true,
      message,
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {})
    },
    { status }
  )
}

/**
 * Standardized success response
 */
export function successResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      data
    },
    { status }
  )
}

/**
 * Catch-all error handler for API routes
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error: any) {
    logger.error('Unhandled API error:', error)

    return errorResponse(
      error.message || 'Internal server error',
      error.status || 500,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    )
  }
}

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002')
  }

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Authorization'
  )

  return response
}

// ============================================================================
// Request Validation
// ============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing: string[] = []

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field)
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing }
  }

  return { valid: true }
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}
