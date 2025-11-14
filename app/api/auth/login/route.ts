import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../../../../lib/drizzle/db'
import { users, sessions } from '../../../../lib/drizzle/schema'
import { eq, or, and } from 'drizzle-orm'
import crypto from 'crypto'
import { withRateLimit, withErrorHandling, errorResponse, successResponse, getClientIp } from '../../../../lib/middleware'
import { logger } from '../../../../lib/logger'

// JWT secret - must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export async function POST(request: NextRequest) {
  // Apply rate limiting: 5 login attempts per minute per IP
  return withRateLimit(
    request,
    async () => withErrorHandling(async () => {
      const body = await request.json()
      const { emailOrUsername, password } = body

      logger.api('POST', '/api/auth/login', { emailOrUsername })

      // Validation
      if (!emailOrUsername || !password) {
        return errorResponse('Email/username and password are required', 400)
      }

      // Find user by email or username
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            or(
              eq(users.email, emailOrUsername.toLowerCase()),
              eq(users.username, emailOrUsername.toLowerCase())
            ),
            eq(users.isActive, true)
          )
        )
        .limit(1)

      if (!user) {
        // Don't reveal whether email/username exists
        logger.warn('Login attempt failed: user not found', { emailOrUsername })
        return errorResponse('Invalid credentials', 401)
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      if (!isValidPassword) {
        logger.warn('Login attempt failed: invalid password', { userId: user.id })
        return errorResponse('Invalid credentials', 401)
      }

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id))

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          trustLevel: user.trustLevel,
          isAdmin: user.isAdmin,
          isModerator: user.isModerator
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Generate refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex')
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

      // Create new session
      await db
        .insert(sessions)
        .values({
          userId: user.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || null
        })

      logger.info('User logged in successfully', { userId: user.id, username: user.username })

      // Return user data and tokens
      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          trustLevel: user.trustLevel,
          reputationScore: user.reputationScore,
          validationsCount: user.validationsCount,
          validationAccuracy: user.validationAccuracy,
          isAdmin: user.isAdmin,
          isModerator: user.isModerator,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
        token,
        refreshToken,
        expiresIn: 604800 // 7 days in seconds
      }, 'Login successful')
    }),
    { maxRequests: 5, windowMs: 60000 } // 5 attempts per minute
  )
}