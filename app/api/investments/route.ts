/**
 * Investments API Endpoints
 *
 * Handles investment listing, creation, and updates
 * Migrated to Phase 3 patterns with enhanced error handling,
 * structured logging, performance tracking, and standardized responses
 *
 * Requires authentication for all operations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware } from '@/lib/middleware'
import { successResponse, createdResponse, paginatedResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  BusinessLogicError,
} from '@/lib/errors'
import {
  listInvestmentsQuerySchema,
  createInvestmentSchema,
  updateInvestmentSchema,
  calculateExpectedReturn,
  calculateSharePercentage,
  isInvestmentModifiable,
} from '@/lib/validation/investment.schemas'
import { RATE_LIMITS, SUPABASE_CONFIG } from '@/lib/config'

// Validate Supabase configuration at module load
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceRoleKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * GET /api/investments
 *
 * List user's investments with portfolio summary
 * Requires authentication
 *
 * @param request - Next.js request object
 * @returns Paginated list of investments with portfolio summary
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_investments')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      const validated = listInvestmentsQuerySchema.parse(queryParams)
      const { limit, offset, status, projectId, minAmount, maxAmount, sortBy, sortOrder } = validated

      structuredLogger.info('Investments list requested', {
        operation: 'list_investments',
        userId: context.userId,
        params: { status, projectId, limit, offset },
      })

      timer.mark('validation_complete')

      try {
        // Initialize Supabase client
        timer.mark('supabase_init_start')
        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)
        timer.mark('supabase_init_complete')

        // Build investments query
        let query = supabase
          .from('investments')
          .select('*', { count: 'exact' })
          .eq('user_id', context.userId!)

        // Apply filters
        if (status !== 'all') {
          query = query.eq('status', status)
        }

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        if (minAmount !== undefined) {
          query = query.gte('amount', minAmount)
        }

        if (maxAmount !== undefined) {
          query = query.lte('amount', maxAmount)
        }

        // Apply sorting
        const sortColumn = {
          amount: 'amount',
          created: 'created_at',
          status: 'status',
          expected_return: 'expected_return',
        }[sortBy] || 'created_at'

        query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        // Execute query
        timer.mark('investments_query_start')
        const { data: investments, error: investmentsError, count } = await query
        timer.mark('investments_query_complete')

        if (investmentsError) {
          throw new DatabaseError('Failed to fetch investments', {
            operation: 'list_investments',
            userId: context.userId,
            originalError: investmentsError.message,
          })
        }

        // Fetch portfolio summary
        timer.mark('portfolio_query_start')
        const { data: summary, error: summaryError } = await supabase
          .from('portfolio_summary')
          .select('*')
          .eq('user_id', context.userId!)
          .single()
        timer.mark('portfolio_query_complete')

        // Portfolio summary is optional, don't fail if it doesn't exist
        const portfolioSummary = summary || {
          total_investments: 0,
          unique_projects: 0,
          total_invested: 0,
          total_expected_return: 0,
          avg_return_percentage: 0,
          active_pledges: 0,
          total_pledged: 0,
        }

        const duration = timer.endAndLog({
          operation: 'list_investments',
          userId: context.userId,
          count: investments?.length || 0,
          total: count || 0,
        })

        // Return paginated response with summary
        return paginatedResponse(
          investments || [],
          {
            total: count || 0,
            limit,
            offset,
          },
          {
            requestId: context.requestId,
            metadata: {
              summary: portfolioSummary,
              performance: {
                validation: timer.getMark('validation_complete'),
                supabase_init:
                  timer.getMark('supabase_init_complete')! -
                  timer.getMark('supabase_init_start')!,
                investments_query:
                  timer.getMark('investments_query_complete')! -
                  timer.getMark('investments_query_start')!,
                portfolio_query:
                  timer.getMark('portfolio_query_complete')! -
                  timer.getMark('portfolio_query_start')!,
                total: duration,
              },
            },
          }
        )
      } catch (error) {
        const duration = timer.end()

        // Re-throw known errors
        if (error instanceof DatabaseError || error instanceof ValidationError) {
          throw error
        }

        structuredLogger.error('Unexpected error in investments GET', error, {
          operation: 'list_investments',
          userId: context.userId,
          duration,
        })

        throw new DatabaseError('Failed to fetch investments')
      }
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.investments || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * POST /api/investments
 *
 * Create a new investment
 * Requires authentication
 *
 * @param request - Next.js request object
 * @returns Created investment
 */
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('create_investment')

      // Parse and validate request body
      const body = await request.json()
      const validated = createInvestmentSchema.parse(body)

      const {
        project_id,
        project_name,
        project_type,
        amount,
        investment_term_months,
        payment_method,
        notes,
        referral_code,
      } = validated

      structuredLogger.info('Investment creation requested', {
        operation: 'create_investment',
        userId: context.userId,
        projectId: project_id,
        amount,
      })

      timer.mark('validation_complete')

      try {
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)

        // Calculate expected return
        timer.mark('calculations_start')
        const expected_return = calculateExpectedReturn(
          amount,
          project_type,
          investment_term_months
        )
        const share_percentage = calculateSharePercentage(amount)
        timer.mark('calculations_complete')

        // Create investment record
        timer.mark('investment_insert_start')
        const { data: investment, error: insertError } = await supabase
          .from('investments')
          .insert({
            user_id: context.userId!,
            project_id,
            project_name,
            project_type,
            amount,
            status: 'pending',
            payment_method,
            investment_term_months,
            expected_return,
            share_percentage,
            notes,
            referral_code,
            metadata: {
              ip_address:
                request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
              created_from: 'web_app',
              request_id: context.requestId,
            },
          })
          .select()
          .single()
        timer.mark('investment_insert_complete')

        if (insertError) {
          throw new DatabaseError('Failed to create investment', {
            operation: 'create_investment',
            userId: context.userId,
            originalError: insertError.message,
          })
        }

        // Create initial transaction record
        timer.mark('transaction_insert_start')
        const { error: transactionError } = await supabase
          .from('investment_transactions')
          .insert({
            investment_id: investment.id,
            user_id: context.userId!,
            type: 'deposit',
            amount: amount,
            balance_after: amount,
            description: `Initial investment in ${project_name}`,
          })
        timer.mark('transaction_insert_complete')

        if (transactionError) {
          structuredLogger.warn('Failed to create transaction record', {
            operation: 'create_investment',
            investmentId: investment.id,
            error: transactionError.message,
          })
          // Don't fail the whole request if transaction logging fails
        }

        const duration = timer.endAndLog({
          operation: 'create_investment',
          userId: context.userId,
          investmentId: investment.id,
          amount,
        })

        // Log business event
        structuredLogger.logBusiness('investment_created', {
          investmentId: investment.id,
          userId: context.userId,
          projectId: project_id,
          projectType: project_type,
          amount,
          expectedReturn: expected_return,
        })

        return createdResponse(investment, {
          location: `/api/investments/${investment.id}`,
          requestId: context.requestId,
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              calculations:
                timer.getMark('calculations_complete')! - timer.getMark('calculations_start')!,
              investment_insert:
                timer.getMark('investment_insert_complete')! -
                timer.getMark('investment_insert_start')!,
              transaction_insert:
                timer.getMark('transaction_insert_complete')! -
                timer.getMark('transaction_insert_start')!,
              total: duration,
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        // Re-throw known errors
        if (
          error instanceof DatabaseError ||
          error instanceof ValidationError ||
          error instanceof BusinessLogicError
        ) {
          throw error
        }

        structuredLogger.error('Unexpected error in investment creation', error, {
          operation: 'create_investment',
          userId: context.userId,
          duration,
        })

        throw new DatabaseError('Failed to create investment')
      }
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.investments || { maxRequests: 10, windowMs: 60000 }, // Stricter for writes
      performanceTracking: true,
    }
  )
}

/**
 * PATCH /api/investments
 *
 * Update an existing investment
 * Requires authentication and ownership
 *
 * @param request - Next.js request object
 * @returns Updated investment
 */
export async function PATCH(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('update_investment')

      // Parse and validate request body
      const body = await request.json()
      const validated = updateInvestmentSchema.parse(body)

      const { investment_id, status, payment_id, transaction_hash, notes } = validated

      structuredLogger.info('Investment update requested', {
        operation: 'update_investment',
        userId: context.userId,
        investmentId: investment_id,
        newStatus: status,
      })

      timer.mark('validation_complete')

      try {
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)

        // Fetch existing investment
        timer.mark('fetch_investment_start')
        const { data: existingInvestment, error: fetchError } = await supabase
          .from('investments')
          .select('*')
          .eq('id', investment_id)
          .eq('user_id', context.userId!) // Ensure ownership
          .single()
        timer.mark('fetch_investment_complete')

        if (fetchError || !existingInvestment) {
          throw new NotFoundError('Investment', investment_id)
        }

        // Check if investment can be modified
        if (!isInvestmentModifiable(existingInvestment.status)) {
          throw new BusinessLogicError(
            `Cannot update investment with status: ${existingInvestment.status}. Only pending and processing investments can be updated.`
          )
        }

        // Prepare update data
        const updateData: any = { status }

        if (payment_id) updateData.payment_id = payment_id
        if (transaction_hash) updateData.transaction_hash = transaction_hash
        if (notes) updateData.notes = notes

        // Add timestamp based on status
        const timestamp = new Date().toISOString()
        if (status === 'confirmed') {
          updateData.confirmed_at = timestamp
        } else if (status === 'completed') {
          updateData.completed_at = timestamp
        } else if (status === 'cancelled') {
          updateData.cancelled_at = timestamp
        } else if (status === 'refunded') {
          updateData.refunded_at = timestamp
        }

        // Update the investment
        timer.mark('update_investment_start')
        const { data: updatedInvestment, error: updateError } = await supabase
          .from('investments')
          .update(updateData)
          .eq('id', investment_id)
          .eq('user_id', context.userId!) // Double-check ownership
          .select()
          .single()
        timer.mark('update_investment_complete')

        if (updateError) {
          throw new DatabaseError('Failed to update investment', {
            operation: 'update_investment',
            investmentId: investment_id,
            originalError: updateError.message,
          })
        }

        // Create transaction record for status changes
        timer.mark('transaction_log_start')
        if (status === 'completed') {
          await supabase.from('investment_transactions').insert({
            investment_id: investment_id,
            user_id: context.userId!,
            type: 'deposit',
            amount: existingInvestment.amount,
            balance_after: existingInvestment.amount,
            description: `Investment confirmed for ${existingInvestment.project_name}`,
          })
        } else if (status === 'cancelled' || status === 'refunded') {
          await supabase.from('investment_transactions').insert({
            investment_id: investment_id,
            user_id: context.userId!,
            type: 'refund',
            amount: existingInvestment.amount,
            balance_after: 0,
            description: `Investment ${status} for ${existingInvestment.project_name}`,
          })
        }
        timer.mark('transaction_log_complete')

        const duration = timer.endAndLog({
          operation: 'update_investment',
          userId: context.userId,
          investmentId: investment_id,
          oldStatus: existingInvestment.status,
          newStatus: status,
        })

        // Log business event
        structuredLogger.logBusiness('investment_updated', {
          investmentId: investment_id,
          userId: context.userId,
          oldStatus: existingInvestment.status,
          newStatus: status,
        })

        return successResponse(updatedInvestment, {
          requestId: context.requestId,
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              fetch_investment:
                timer.getMark('fetch_investment_complete')! -
                timer.getMark('fetch_investment_start')!,
              update_investment:
                timer.getMark('update_investment_complete')! -
                timer.getMark('update_investment_start')!,
              transaction_log:
                timer.getMark('transaction_log_complete')! -
                timer.getMark('transaction_log_start')!,
              total: duration,
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        // Re-throw known errors
        if (
          error instanceof NotFoundError ||
          error instanceof AuthorizationError ||
          error instanceof BusinessLogicError ||
          error instanceof DatabaseError ||
          error instanceof ValidationError
        ) {
          throw error
        }

        structuredLogger.error('Unexpected error in investment update', error, {
          operation: 'update_investment',
          userId: context.userId,
          investmentId: investment_id,
          duration,
        })

        throw new DatabaseError('Failed to update investment')
      }
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.investments || { maxRequests: 20, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}
