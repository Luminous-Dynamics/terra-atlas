/**
 * Investment Validation Schemas
 *
 * Zod schemas for all investment-related API endpoints
 */

import { z } from 'zod'
import {
  paginationQuerySchema,
  dbIdSchema,
  dbIdStringSchema,
  currencySchema,
  sortOrderSchema,
} from './common.schemas'
import {
  INVESTMENT_STATUSES,
  INVESTMENT_TYPES,
  INVESTMENT_LIMITS,
} from '../constants'

// ============================================================================
// Investment Query Schemas
// ============================================================================

/**
 * Get investments query parameters
 */
export const getInvestmentsQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum([
      INVESTMENT_STATUSES.PENDING,
      INVESTMENT_STATUSES.CONFIRMED,
      INVESTMENT_STATUSES.ACTIVE,
      INVESTMENT_STATUSES.COMPLETED,
      INVESTMENT_STATUSES.CANCELLED,
      INVESTMENT_STATUSES.REFUNDED,
    ])
    .or(z.literal('all'))
    .default('all')
    .optional(),
  projectId: dbIdStringSchema.optional(),
  sortBy: z
    .enum(['amount', 'createdAt', 'status'])
    .default('createdAt')
    .optional(),
  sortOrder: sortOrderSchema.default('desc').optional(),
})

export type GetInvestmentsQuery = z.infer<typeof getInvestmentsQuerySchema>

/**
 * Get investment by ID parameter
 */
export const getInvestmentByIdSchema = z.object({
  id: dbIdStringSchema,
})

export type GetInvestmentById = z.infer<typeof getInvestmentByIdSchema>

// ============================================================================
// Investment Creation Schemas
// ============================================================================

/**
 * Create investment request body
 */
export const createInvestmentSchema = z.object({
  project_id: dbIdSchema,
  project_name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(200, 'Project name must be at most 200 characters'),
  project_type: z
    .string()
    .min(2, 'Project type must be at least 2 characters')
    .max(100, 'Project type must be at most 100 characters'),
  amount: z
    .number()
    .min(INVESTMENT_LIMITS.MIN_AMOUNT, `Minimum investment is $${INVESTMENT_LIMITS.MIN_AMOUNT}`)
    .max(INVESTMENT_LIMITS.MAX_AMOUNT, `Maximum investment is $${INVESTMENT_LIMITS.MAX_AMOUNT}`),
  investment_term_months: z
    .number()
    .int('Investment term must be an integer')
    .min(1, 'Investment term must be at least 1 month')
    .max(360, 'Investment term must be at most 360 months (30 years)')
    .default(12),
  investment_type: z
    .enum([
      INVESTMENT_TYPES.EQUITY,
      INVESTMENT_TYPES.DEBT,
      INVESTMENT_TYPES.HYBRID,
      INVESTMENT_TYPES.GRANT,
    ])
    .default(INVESTMENT_TYPES.EQUITY)
    .optional(),
  payment_method: z
    .enum(['card', 'bank_transfer', 'crypto', 'other'])
    .default('card'),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>

// ============================================================================
// Investment Update Schemas
// ============================================================================

/**
 * Update investment status
 */
export const updateInvestmentStatusSchema = z.object({
  investment_id: dbIdSchema,
  status: z.enum([
    INVESTMENT_STATUSES.PENDING,
    INVESTMENT_STATUSES.CONFIRMED,
    INVESTMENT_STATUSES.ACTIVE,
    INVESTMENT_STATUSES.COMPLETED,
    INVESTMENT_STATUSES.CANCELLED,
    INVESTMENT_STATUSES.REFUNDED,
  ]),
  payment_id: z
    .string()
    .max(200, 'Payment ID too long')
    .optional(),
  transaction_hash: z
    .string()
    .max(200, 'Transaction hash too long')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
})

export type UpdateInvestmentStatusInput = z.infer<typeof updateInvestmentStatusSchema>

/**
 * Cancel investment
 */
export const cancelInvestmentSchema = z.object({
  investment_id: dbIdSchema,
  reason: z
    .string()
    .min(10, 'Cancellation reason must be at least 10 characters')
    .max(500, 'Cancellation reason must be at most 500 characters'),
})

export type CancelInvestmentInput = z.infer<typeof cancelInvestmentSchema>

// ============================================================================
// Investment Portfolio Schemas
// ============================================================================

/**
 * Get portfolio summary
 */
export const getPortfolioSummarySchema = z.object({
  userId: dbIdSchema.optional(), // Optional for getting own portfolio
  timeRange: z
    .enum(['7d', '30d', '90d', '1y', 'all'])
    .default('all')
    .optional(),
})

export type GetPortfolioSummaryInput = z.infer<typeof getPortfolioSummarySchema>

/**
 * Portfolio performance metrics
 */
export const getPortfolioPerformanceSchema = z.object({
  userId: dbIdSchema.optional(),
  startDate: z
    .string()
    .datetime()
    .optional(),
  endDate: z
    .string()
    .datetime()
    .optional(),
  groupBy: z
    .enum(['day', 'week', 'month', 'quarter', 'year'])
    .default('month')
    .optional(),
})

export type GetPortfolioPerformanceInput = z.infer<typeof getPortfolioPerformanceSchema>

// ============================================================================
// Investment Transaction Schemas
// ============================================================================

/**
 * Create investment transaction
 */
export const createInvestmentTransactionSchema = z.object({
  investment_id: dbIdSchema,
  type: z.enum(['deposit', 'withdrawal', 'return', 'refund', 'fee']),
  amount: z
    .number()
    .positive('Amount must be positive'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must be at most 500 characters'),
  metadata: z
    .record(z.any())
    .optional(),
})

export type CreateInvestmentTransactionInput = z.infer<typeof createInvestmentTransactionSchema>

/**
 * Get investment transactions
 */
export const getInvestmentTransactionsSchema = paginationQuerySchema.extend({
  investment_id: dbIdSchema,
  type: z
    .enum(['deposit', 'withdrawal', 'return', 'refund', 'fee'])
    .optional(),
})

export type GetInvestmentTransactionsInput = z.infer<typeof getInvestmentTransactionsSchema>

// ============================================================================
// Investment Pledge Schemas (For Future Use)
// ============================================================================

/**
 * Create investment pledge (commitment before payment)
 */
export const createPledgeSchema = z.object({
  project_id: dbIdSchema,
  amount: z
    .number()
    .min(INVESTMENT_LIMITS.MIN_AMOUNT, `Minimum pledge is $${INVESTMENT_LIMITS.MIN_AMOUNT}`)
    .max(INVESTMENT_LIMITS.MAX_AMOUNT, `Maximum pledge is $${INVESTMENT_LIMITS.MAX_AMOUNT}`),
  expires_at: z
    .string()
    .datetime()
    .optional(),
})

export type CreatePledgeInput = z.infer<typeof createPledgeSchema>

/**
 * Convert pledge to investment
 */
export const convertPledgeSchema = z.object({
  pledge_id: dbIdSchema,
  payment_method: z
    .enum(['card', 'bank_transfer', 'crypto', 'other'])
    .default('card'),
  payment_id: z
    .string()
    .max(200, 'Payment ID too long')
    .optional(),
})

export type ConvertPledgeInput = z.infer<typeof convertPledgeSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate investment amount against project requirements
 */
export function validateInvestmentAmount(
  amount: number,
  projectMinInvestment?: number,
  projectMaxInvestment?: number
): { valid: boolean; error?: string } {
  // Check global limits
  if (amount < INVESTMENT_LIMITS.MIN_AMOUNT) {
    return {
      valid: false,
      error: `Amount must be at least $${INVESTMENT_LIMITS.MIN_AMOUNT}`,
    }
  }

  if (amount > INVESTMENT_LIMITS.MAX_AMOUNT) {
    return {
      valid: false,
      error: `Amount must be at most $${INVESTMENT_LIMITS.MAX_AMOUNT}`,
    }
  }

  // Check project-specific limits
  if (projectMinInvestment && amount < projectMinInvestment) {
    return {
      valid: false,
      error: `Amount must be at least $${projectMinInvestment} for this project`,
    }
  }

  if (projectMaxInvestment && amount > projectMaxInvestment) {
    return {
      valid: false,
      error: `Amount must be at most $${projectMaxInvestment} for this project`,
    }
  }

  return { valid: true }
}

/**
 * Calculate expected return
 */
export function calculateExpectedReturn(
  amount: number,
  annualReturnRate: number,
  termMonths: number
): number {
  const years = termMonths / 12
  return amount * annualReturnRate * years
}

/**
 * Calculate share percentage
 */
export function calculateSharePercentage(
  investmentAmount: number,
  projectTotalCost: number
): number {
  if (projectTotalCost <= 0) return 0
  return (investmentAmount / projectTotalCost) * 100
}

/**
 * Validate investment term
 */
export function validateInvestmentTerm(
  termMonths: number,
  projectDuration?: number
): { valid: boolean; error?: string; warning?: string } {
  if (termMonths < 1) {
    return {
      valid: false,
      error: 'Investment term must be at least 1 month',
    }
  }

  if (termMonths > 360) {
    return {
      valid: false,
      error: 'Investment term must be at most 360 months (30 years)',
    }
  }

  // Warning if term exceeds project duration
  if (projectDuration && termMonths > projectDuration) {
    return {
      valid: true,
      warning: `Investment term (${termMonths} months) exceeds project duration (${projectDuration} months)`,
    }
  }

  return { valid: true }
}

/**
 * Check if investment can be cancelled
 */
export function canCancelInvestment(
  status: string,
  createdAt: Date,
  maxCancellationDays: number = 7
): { can: boolean; reason?: string } {
  // Can only cancel pending or confirmed investments
  if (status !== INVESTMENT_STATUSES.PENDING && status !== INVESTMENT_STATUSES.CONFIRMED) {
    return {
      can: false,
      reason: `Cannot cancel ${status} investments`,
    }
  }

  // Check cancellation window
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation > maxCancellationDays) {
    return {
      can: false,
      reason: `Cancellation period of ${maxCancellationDays} days has expired`,
    }
  }

  return { can: true }
}
