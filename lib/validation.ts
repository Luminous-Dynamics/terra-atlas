/**
 * Terra Atlas Input Validation Library
 *
 * Provides Zod schemas for validating API requests
 * Prevents injection attacks and ensures data integrity
 *
 * SETUP REQUIRED:
 * Install Zod: npm install zod
 * Then uncomment the code below to use validation
 */

// IMPORTANT: Install zod first with: npm install zod
// import { z } from 'zod'

/**
 * TODO: Uncomment this entire file after installing Zod
 *
 * This validation library is ready to use once Zod is installed.
 * It provides type-safe validation for all API endpoints.
 */

export const VALIDATION_NOT_READY = true

/*
// Uncomment after installing Zod:

import { z } from 'zod'

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3).max(100).trim(),
  password: z.string().min(8).max(100)
})

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  username: z.string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  fullName: z.string().min(2).max(100).trim().optional()
})

export const passwordResetSchema = z.object({
  email: z.string().email().toLowerCase().trim()
})

export const updatePasswordSchema = z.object({
  newPassword: z.string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// ============================================================================
// Investment Schemas
// ============================================================================

export const investmentPledgeSchema = z.object({
  projectId: z.string().uuid(),
  amountUsd: z.number().min(10).max(10000000),
  investmentType: z.enum([
    'equity',
    'debt',
    'revenue_share',
    'crowdfunding',
    'green_bond',
    'ppa'
  ]),
  expectedReturn: z.number().min(0).max(100).optional(),
  investmentPeriodYears: z.number().min(1).max(30).optional(),
  notes: z.string().max(1000).optional()
})

// ============================================================================
// Project Schemas
// ============================================================================

export const projectQuerySchema = z.object({
  type: z.enum(['solar', 'wind', 'hydro', 'nuclear', 'storage']).optional(),
  minCapacity: z.number().min(0).optional(),
  maxCapacity: z.number().max(10000).optional(),
  minIrr: z.number().min(0).max(100).optional(),
  location: z.string().max(100).optional(),
  status: z.enum(['planning', 'funding', 'construction', 'operational']).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
})

export const projectCreateSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  type: z.enum(['solar', 'wind', 'hydro', 'nuclear', 'storage']),
  location: z.string().min(3).max(200).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity_mw: z.number().min(0.1).max(10000),
  total_cost: z.number().min(1000).max(10000000000),
  irr: z.number().min(0).max(100),
  description: z.string().max(5000).optional()
})

// ============================================================================
// Validation Schemas
// ============================================================================

export const dataValidationSchema = z.object({
  dataPointId: z.string().uuid(),
  isValid: z.boolean(),
  confidence: z.enum(['low', 'medium', 'high']),
  notes: z.string().max(1000).optional()
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data)
}

/**
 * Safely validate request body
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationError(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }

  return formatted
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

// ============================================================================
// Type Exports
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type InvestmentPledgeInput = z.infer<typeof investmentPledgeSchema>
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type DataValidationInput = z.infer<typeof dataValidationSchema>

// End of Zod validation code - uncomment after npm install zod
*/
