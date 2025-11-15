/**
 * Investment Validation Schemas
 *
 * Zod schemas for validating investment-related API requests
 */

import { z } from 'zod'

/**
 * Investment status values
 */
export const investmentStatuses = [
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
  'refunded',
  'failed',
] as const

/**
 * Payment methods
 */
export const paymentMethods = [
  'credit_card',
  'debit_card',
  'bank_transfer',
  'wire_transfer',
  'crypto',
  'stripe',
  'paypal',
] as const

/**
 * Transaction types
 */
export const transactionTypes = [
  'deposit',
  'withdrawal',
  'refund',
  'fee',
  'interest',
  'dividend',
] as const

/**
 * Query parameters for listing investments
 */
export const listInvestmentsQuerySchema = z.object({
  // Pagination
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Number of results per page'),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of results to skip'),

  // Filters
  status: z
    .enum([...investmentStatuses, 'all' as const])
    .default('all')
    .describe('Filter by investment status'),
  projectId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe('Filter by specific project'),
  minAmount: z.coerce
    .number()
    .positive()
    .optional()
    .describe('Minimum investment amount'),
  maxAmount: z.coerce
    .number()
    .positive()
    .optional()
    .describe('Maximum investment amount'),

  // Date range
  startDate: z.coerce
    .date()
    .optional()
    .describe('Start date for filtering'),
  endDate: z.coerce
    .date()
    .optional()
    .describe('End date for filtering'),

  // Sorting
  sortBy: z
    .enum(['amount', 'created', 'status', 'expected_return'])
    .default('created')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Sort direction'),
})

/**
 * Create investment schema (for POST requests)
 */
export const createInvestmentSchema = z.object({
  // Project information (required)
  project_id: z
    .number()
    .int()
    .positive()
    .describe('ID of the project to invest in'),
  project_name: z
    .string()
    .min(1)
    .max(200)
    .describe('Name of the project'),
  project_type: z
    .string()
    .max(100)
    .describe('Type of the project (Solar, Wind, etc.)'),

  // Investment details (required)
  amount: z
    .number()
    .positive()
    .min(10, 'Minimum investment is $10')
    .max(1000000, 'Maximum investment is $1,000,000')
    .describe('Investment amount in USD'),

  // Optional details
  investment_term_months: z
    .number()
    .int()
    .min(1)
    .max(360)
    .default(12)
    .describe('Investment term in months'),
  payment_method: z
    .enum(paymentMethods)
    .default('credit_card')
    .describe('Payment method to use'),

  // Additional metadata (optional)
  notes: z
    .string()
    .max(1000)
    .optional()
    .describe('Optional notes about this investment'),
  referral_code: z
    .string()
    .max(50)
    .optional()
    .describe('Referral or promo code'),
})

/**
 * Update investment schema (for PATCH requests)
 */
export const updateInvestmentSchema = z.object({
  investment_id: z
    .number()
    .int()
    .positive()
    .describe('ID of the investment to update'),
  status: z
    .enum(investmentStatuses)
    .describe('New status for the investment'),
  payment_id: z
    .string()
    .max(200)
    .optional()
    .describe('Payment provider transaction ID'),
  transaction_hash: z
    .string()
    .max(200)
    .optional()
    .describe('Blockchain transaction hash (for crypto payments)'),
  notes: z
    .string()
    .max(1000)
    .optional()
    .describe('Additional notes'),
})

/**
 * Investment ID parameter schema
 */
export const investmentIdSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .describe('Investment ID'),
})

/**
 * Portfolio summary schema
 */
export const portfolioSummarySchema = z.object({
  total_investments: z.number().int().min(0),
  unique_projects: z.number().int().min(0),
  total_invested: z.number().min(0),
  total_expected_return: z.number().min(0),
  avg_return_percentage: z.number().min(0).max(100),
  active_pledges: z.number().int().min(0),
  total_pledged: z.number().min(0),
})

/**
 * Transaction record schema
 */
export const transactionSchema = z.object({
  investment_id: z.number().int().positive(),
  type: z.enum(transactionTypes),
  amount: z.number().positive(),
  balance_after: z.number(),
  description: z.string().max(500),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Batch investment schema (for bulk operations)
 */
export const batchInvestmentSchema = z.object({
  investments: z
    .array(createInvestmentSchema)
    .min(1)
    .max(10)
    .describe('Array of investments to create (max 10)'),
})

/**
 * Cancel investment schema
 */
export const cancelInvestmentSchema = z.object({
  investment_id: z.number().int().positive(),
  reason: z
    .string()
    .min(10, 'Please provide a reason (minimum 10 characters)')
    .max(500, 'Reason must be less than 500 characters')
    .describe('Reason for cancellation'),
  refund_method: z
    .enum(['original', 'bank_transfer', 'store_credit'])
    .default('original')
    .describe('How to process the refund'),
})

/**
 * Investment analytics schema
 */
export const investmentAnalyticsSchema = z.object({
  period: z
    .enum(['day', 'week', 'month', 'quarter', 'year', 'all'])
    .default('month')
    .describe('Time period for analytics'),
  groupBy: z
    .enum(['project_type', 'status', 'payment_method', 'none'])
    .default('none')
    .describe('How to group the analytics'),
})

/**
 * Type inference helpers
 */
export type ListInvestmentsQuery = z.infer<typeof listInvestmentsQuerySchema>
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>
export type TransactionRecord = z.infer<typeof transactionSchema>
export type BatchInvestmentInput = z.infer<typeof batchInvestmentSchema>
export type CancelInvestmentInput = z.infer<typeof cancelInvestmentSchema>
export type InvestmentAnalytics = z.infer<typeof investmentAnalyticsSchema>

/**
 * Validation helper functions
 */
export function validateInvestmentQuery(query: unknown): ListInvestmentsQuery {
  return listInvestmentsQuerySchema.parse(query)
}

export function validateCreateInvestment(data: unknown): CreateInvestmentInput {
  return createInvestmentSchema.parse(data)
}

export function validateUpdateInvestment(data: unknown): UpdateInvestmentInput {
  return updateInvestmentSchema.parse(data)
}

/**
 * Business rule validators
 */
export function isInvestmentModifiable(status: string): boolean {
  const modifiableStatuses = ['pending', 'processing']
  return modifiableStatuses.includes(status)
}

export function canCancelInvestment(status: string): boolean {
  const cancellableStatuses = ['pending', 'confirmed']
  return cancellableStatuses.includes(status)
}

export function canRefundInvestment(status: string): boolean {
  const refundableStatuses = ['completed', 'confirmed']
  return refundableStatuses.includes(status)
}

/**
 * Calculate expected return based on project type and term
 */
export function calculateExpectedReturn(
  amount: number,
  projectType: string,
  termMonths: number
): number {
  const returnRates: Record<string, number> = {
    Solar: 0.14,
    Wind: 0.16,
    Battery: 0.15,
    Hydro: 0.11,
    Nuclear: 0.12,
    Geothermal: 0.13,
    Biomass: 0.12,
  }

  const annualRate = returnRates[projectType] || 0.13
  return amount * annualRate * (termMonths / 12)
}

/**
 * Calculate share percentage (simplified)
 */
export function calculateSharePercentage(
  investmentAmount: number,
  projectTotalCost: number = 1000000
): number {
  return (investmentAmount / projectTotalCost) * 100
}
