/**
 * Authentication Validation Schemas
 *
 * Zod schemas for all auth-related API endpoints
 */

import { z } from 'zod'
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from './common.schemas'

// ============================================================================
// Login Schemas
// ============================================================================

/**
 * Login request body
 */
export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(3, 'Email or username must be at least 3 characters')
    .max(100, 'Email or username must be at most 100 characters')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Login response
 */
export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    user: z.object({
      id: z.number(),
      email: z.string(),
      username: z.string(),
      fullName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      bio: z.string().nullable(),
      trustLevel: z.number(),
      reputationScore: z.number(),
      validationsCount: z.number(),
      validationAccuracy: z.number().nullable(),
      isAdmin: z.boolean(),
      isModerator: z.boolean(),
      emailVerified: z.boolean(),
      createdAt: z.date(),
    }),
    token: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

// ============================================================================
// Register Schemas
// ============================================================================

/**
 * Register request body
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters')
    .optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Register with password confirmation
 */
export const registerWithConfirmSchema = registerSchema.extend({
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
})

export type RegisterWithConfirmInput = z.infer<typeof registerWithConfirmSchema>

// ============================================================================
// Refresh Token Schemas
// ============================================================================

/**
 * Refresh token request
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .max(512, 'Invalid refresh token'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

// ============================================================================
// Password Reset Schemas
// ============================================================================

/**
 * Request password reset
 */
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
})

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>

/**
 * Reset password with token
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ============================================================================
// Change Password Schemas
// ============================================================================

/**
 * Change password (requires current password)
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: passwordSchema,
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'New passwords do not match',
  path: ['newPasswordConfirm'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ============================================================================
// Profile Update Schemas
// ============================================================================

/**
 * Update user profile
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name must be at least 1 character')
    .max(100, 'Full name must be at most 100 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .max(2048, 'Avatar URL too long')
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ============================================================================
// Email Verification Schemas
// ============================================================================

/**
 * Verify email with token
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required'),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

/**
 * Resend verification email
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
})

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>

// ============================================================================
// Session Management Schemas
// ============================================================================

/**
 * Logout request
 */
export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .optional(),
}).optional()

export type LogoutInput = z.infer<typeof logoutSchema>

/**
 * Get active sessions
 */
export const getSessionsSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .optional(),
})

export type GetSessionsInput = z.infer<typeof getSessionsSchema>

/**
 * Revoke session
 */
export const revokeSessionSchema = z.object({
  sessionId: z
    .number()
    .int()
    .positive(),
})

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate email or username
 */
export function validateEmailOrUsername(value: string): {
  type: 'email' | 'username'
  value: string
} {
  const trimmed = value.toLowerCase().trim()

  // Try to parse as email first
  const emailResult = emailSchema.safeParse(trimmed)
  if (emailResult.success) {
    return { type: 'email', value: trimmed }
  }

  // Try to parse as username
  const usernameResult = usernameSchema.safeParse(trimmed)
  if (usernameResult.success) {
    return { type: 'username', value: trimmed }
  }

  // If neither, treat as email (will fail validation later)
  return { type: 'email', value: trimmed }
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // Feedback
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters')
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters')
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters')
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers')
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters')
  }

  // Cap score at 4
  score = Math.min(score, 4)

  return { score, feedback }
}
