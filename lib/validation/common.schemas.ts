/**
 * Common Validation Schemas
 *
 * Reusable validation schemas using Zod
 */

import { z } from 'zod'
import { REGEX } from '../constants'

// ============================================================================
// Primitive Schemas
// ============================================================================

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(3, 'Email must be at least 3 characters')
  .max(100, 'Email must be at most 100 characters')
  .regex(REGEX.EMAIL, 'Invalid email format')
  .email('Invalid email address')

/**
 * Password validation with strong requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

/**
 * Username validation
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be at most 2048 characters')

/**
 * Slug validation
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(REGEX.SLUG, 'Invalid slug format')

// ============================================================================
// Number Schemas
// ============================================================================

/**
 * Positive integer
 */
export const positiveIntSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive')

/**
 * Non-negative integer
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be non-negative')

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100')

/**
 * Currency amount (in cents)
 */
export const currencySchema = z
  .number()
  .int('Currency must be an integer (in cents)')
  .nonnegative('Currency amount must be non-negative')

// ============================================================================
// Date Schemas
// ============================================================================

/**
 * ISO date string
 */
export const isoDateSchema = z
  .string()
  .datetime('Invalid ISO date format')

/**
 * Date in the past
 */
export const pastDateSchema = z
  .date()
  .max(new Date(), 'Date must be in the past')

/**
 * Date in the future
 */
export const futureDateSchema = z
  .date()
  .min(new Date(), 'Date must be in the future')

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must be at most 100')
    .default(20)
    .optional(),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/**
 * Pagination query parameters (from URL)
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
})

// ============================================================================
// Sorting Schemas
// ============================================================================

/**
 * Sort order
 */
export const sortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof sortOrderSchema>

/**
 * Generic sort schema
 */
export function createSortSchema<T extends string>(fields: readonly [T, ...T[]]) {
  return z.object({
    sortBy: z.enum(fields).optional(),
    sortOrder: sortOrderSchema.default('asc'),
  })
}

// ============================================================================
// Search Schemas
// ============================================================================

/**
 * Search query
 */
export const searchQuerySchema = z
  .string()
  .min(1, 'Search query must be at least 1 character')
  .max(100, 'Search query must be at most 100 characters')
  .transform((val) => val.trim())

// ============================================================================
// ID Schemas
// ============================================================================

/**
 * Database ID (numeric)
 */
export const dbIdSchema = z
  .number()
  .int('ID must be an integer')
  .positive('ID must be positive')

/**
 * Database ID from string (URL param)
 */
export const dbIdStringSchema = z
  .string()
  .regex(/^\d+$/, 'ID must be a number')
  .transform((val) => parseInt(val, 10))
  .pipe(dbIdSchema)

// ============================================================================
// Array Schemas
// ============================================================================

/**
 * Non-empty array
 */
export function nonEmptyArraySchema<T extends z.ZodTypeAny>(schema: T) {
  return z.array(schema).nonempty('Array must not be empty')
}

/**
 * Unique array
 */
export function uniqueArraySchema<T extends z.ZodTypeAny>(schema: T) {
  return z.array(schema).refine(
    (arr) => new Set(arr).size === arr.length,
    'Array must contain unique values'
  )
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate data against a schema and return typed result
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
  }
}

/**
 * Validate data and throw on error
 */
export function validateOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data)
}

// ============================================================================
// Type Exports
// ============================================================================

export type Email = z.infer<typeof emailSchema>
export type Password = z.infer<typeof passwordSchema>
export type Username = z.infer<typeof usernameSchema>
export type UUID = z.infer<typeof uuidSchema>
export type URL = z.infer<typeof urlSchema>
export type Slug = z.infer<typeof slugSchema>
