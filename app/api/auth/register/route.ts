import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../../../../lib/drizzle/db'
import { users, sessions } from '../../../../lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { withRateLimit, withErrorHandling, errorResponse, successResponse, getClientIp } from '../../../../lib/middleware'
import { logger } from '../../../../lib/logger'

// JWT secret - must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// Email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Username regex (alphanumeric, underscore, dash, 3-20 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export async function POST(request: NextRequest) {
  // Apply rate limiting: 3 registration attempts per minute per IP
  return withRateLimit(
    request,
    async () => withErrorHandling(async () => {
      const body = await request.json()
      const { email, username, password, fullName } = body

      logger.api('POST', '/api/auth/register', { email, username })

      // Validation
      if (!email || !username || !password) {
        return errorResponse('Email, username, and password are required', 400)
      }

      // Email validation
      if (!EMAIL_REGEX.test(email)) {
        return errorResponse('Invalid email format', 400)
      }

      // Username validation
      if (!USERNAME_REGEX.test(username)) {
        return errorResponse('Username must be 3-20 characters, alphanumeric, underscore, or dash only', 400)
      }

      // Password strength validation
      if (password.length < 8) {
        return errorResponse('Password must be at least 8 characters long', 400)
      }

    // Check if email already exists
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

      if (existingEmail) {
        return errorResponse('Email already registered', 409)
      }

      // Check if username already exists
      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username.toLowerCase()))
        .limit(1)

      if (existingUsername) {
        return errorResponse('Username already taken', 409)
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash,
          fullName,
          // Generate default avatar using initials or service like Gravatar
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName || username
          )}&background=random`,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Generate refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex')
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

      // Create session
      await db
        .insert(sessions)
        .values({
          userId: user.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || null
        })

      logger.info('New user registered successfully', { userId: user.id, username: user.username })

      // Return user data and tokens
      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          trustLevel: user.trustLevel,
          reputationScore: user.reputationScore
        },
        token,
        refreshToken,
        expiresIn: 604800 // 7 days in seconds
      }, 'User registered successfully')
    }),
    { maxRequests: 3, windowMs: 60000 } // 3 registrations per minute
  )
}