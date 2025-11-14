/**
 * Terra Atlas Authentication Utilities
 *
 * Reusable functions for authentication in API routes and components
 */

import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// ============================================================================
// Token Management
// ============================================================================

export interface TokenPayload {
  userId: string
  email: string
  username: string
  trustLevel?: number
  isAdmin?: boolean
  isModerator?: boolean
  iat?: number
  exp?: number
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
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
 * Get authenticated user from request
 */
export function getAuthenticatedUser(request: NextRequest): TokenPayload | null {
  const token = extractToken(request)

  if (!token) {
    return null
  }

  return verifyToken(token)
}

// ============================================================================
// Password Utilities
// ============================================================================

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''

  // Ensure at least one of each required type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]

  // Fill the rest randomly
  for (let i = 3; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// ============================================================================
// Email/Username Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' }
  }

  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }

  return { valid: true }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
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
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: TokenPayload | null): boolean {
  return user?.isAdmin === true
}

/**
 * Check if user has moderator privileges
 */
export function isModerator(user: TokenPayload | null): boolean {
  return user?.isModerator === true || user?.isAdmin === true
}

/**
 * Check if user has required trust level
 */
export function hasTrustLevel(user: TokenPayload | null, requiredLevel: number): boolean {
  return (user?.trustLevel || 0) >= requiredLevel
}

// ============================================================================
// Error Messages
// ============================================================================

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email/username or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_IN_USE: 'Email already registered',
  USERNAME_TAKEN: 'Username already taken',
  WEAK_PASSWORD: 'Password does not meet strength requirements',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_USERNAME: 'Invalid username format',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  SESSION_EXPIRED: 'Session has expired',
} as const
