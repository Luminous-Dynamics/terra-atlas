import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, withErrorHandling, withAuth, successResponse, errorResponse } from '../../../lib/middleware'
import { logger } from '../../../lib/logger'
import { RATE_LIMITS, PAGINATION, API_LIMITS, SUPABASE_CONFIG, INVESTMENT_LIMITS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../lib/config'
import { HTTP_STATUS, INVESTMENT_STATUSES } from '../../../lib/constants'

// Validate Supabase configuration
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceRoleKey) {
  throw new Error('Missing required Supabase environment variables')
}

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withAuth(request, async (user) => withErrorHandling(async () => {
      logger.api('GET', '/api/investments', { userId: user.userId })

      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const status = searchParams.get('status') || 'all'
      const limit = Math.min(
        parseInt(searchParams.get('limit') || String(API_LIMITS.maxInvestmentsPerPage)),
        API_LIMITS.maxInvestmentsPerPage
      )
      const offset = parseInt(searchParams.get('offset') || String(PAGINATION.defaultOffset))

  try {
    // Initialize Supabase with service key for admin operations
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)

    // Build query
    let query = supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Execute query with pagination
    const { data: investments, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Error fetching investments:', error)
      return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Get portfolio summary
    const { data: summary } = await supabase
      .from('portfolio_summary')
      .select('*')
      .eq('user_id', user.userId)
      .single()

    logger.info('Investments fetched successfully', { userId: user.userId, count: investments?.length || 0 })

    return successResponse({
      investments: investments || [],
      summary: summary || {
        total_investments: 0,
        unique_projects: 0,
        total_invested: 0,
        total_expected_return: 0,
        avg_return_percentage: 0,
        active_pledges: 0,
        total_pledged: 0
      },
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    logger.error('API Error in investments GET:', error)
    return errorResponse(ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
    })),
    RATE_LIMITS.api.investments
  )
}

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withAuth(request, async (user) => withErrorHandling(async () => {
      logger.api('POST', '/api/investments', { userId: user.userId })

      // Initialize Supabase
      const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)

      // Parse request body
      const body = await request.json()
      const {
        project_id,
        project_name,
        project_type,
        amount,
        investment_term_months,
        payment_method
      } = body

      // Validate amount
      if (!amount || amount < INVESTMENT_LIMITS.MIN_AMOUNT) {
        return errorResponse(
          `Minimum investment is $${INVESTMENT_LIMITS.MIN_AMOUNT}`,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      if (amount > INVESTMENT_LIMITS.MAX_AMOUNT) {
        return errorResponse(
          ERROR_MESSAGES.INVESTMENT_LIMIT_EXCEEDED,
          HTTP_STATUS.BAD_REQUEST
        )
      }

    // Calculate expected return based on project type
    const returnRates: { [key: string]: number } = {
      'Solar': 0.14,
      'Wind': 0.16,
      'Battery': 0.15,
      'Hydro': 0.11,
      'Nuclear': 0.12,
      'default': 0.13
    }
    
    const returnRate = returnRates[project_type] || returnRates.default
    const expected_return = amount * returnRate * (investment_term_months || 12) / 12

    // Create investment record
    const { data: investment, error } = await supabase
      .from('investments')
      .insert({
        user_id: user.userId,
        project_id,
        project_name,
        project_type,
        amount,
        status: INVESTMENT_STATUSES.PENDING,
        payment_method,
        investment_term_months: investment_term_months || 12,
        expected_return,
        share_percentage: amount / 1000000, // Simplified calculation
        metadata: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
          created_from: 'web_app'
        }
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating investment:', error)
      return errorResponse(ERROR_MESSAGES.INVESTMENT_CREATE_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Create initial transaction record
    await supabase
      .from('investment_transactions')
      .insert({
        investment_id: investment.id,
        user_id: user.userId,
        type: 'deposit',
        amount: amount,
        balance_after: amount,
        description: `Initial investment in ${project_name}`
      })

    logger.info('Investment created successfully', { userId: user.userId, investmentId: investment.id, amount })

    return successResponse(
      { investment },
      SUCCESS_MESSAGES.INVESTMENT_CREATED,
      HTTP_STATUS.CREATED
    )
    })),
    RATE_LIMITS.api.investments
  )
}

export async function PATCH(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withAuth(request, async (user) => withErrorHandling(async () => {
      logger.api('PATCH', '/api/investments', { userId: user.userId })

      // Initialize Supabase
      const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey)

      // Parse request body
      const body = await request.json()
      const { investment_id, status, payment_id, transaction_hash } = body

      if (!investment_id) {
        return errorResponse(
          ERROR_MESSAGES.REQUIRED_FIELD('Investment ID'),
          HTTP_STATUS.BAD_REQUEST
        )
      }

    // Get the investment
    const { data: existingInvestment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investment_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !existingInvestment) {
      return errorResponse(
        ERROR_MESSAGES.INVESTMENT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    // Only allow updates to pending investments
    if (existingInvestment.status !== INVESTMENT_STATUSES.PENDING) {
      return errorResponse(
        'Can only update pending investments',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Prepare update data
    const updateData: any = { status }
    
    if (payment_id) updateData.payment_id = payment_id
    if (transaction_hash) updateData.transaction_hash = transaction_hash
    
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    // Update the investment
    const { data: updatedInvestment, error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', investment_id)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating investment:', updateError)
      return errorResponse(ERROR_MESSAGES.INVESTMENT_UPDATE_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Log transaction for status changes
    if (status === INVESTMENT_STATUSES.COMPLETED) {
      await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment_id,
          user_id: user.userId,
          type: 'deposit',
          amount: existingInvestment.amount,
          balance_after: existingInvestment.amount,
          description: `Investment confirmed for ${existingInvestment.project_name}`
        })
    } else if (status === INVESTMENT_STATUSES.CANCELLED || status === INVESTMENT_STATUSES.REFUNDED) {
      await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment_id,
          user_id: user.userId,
          type: 'refund',
          amount: existingInvestment.amount,
          balance_after: 0,
          description: `Investment ${status} for ${existingInvestment.project_name}`
        })
    }

    logger.info('Investment updated successfully', { userId: user.userId, investmentId: investment_id, status })

    return successResponse(
      { investment: updatedInvestment },
      SUCCESS_MESSAGES.INVESTMENT_UPDATED
    )
    })),
    RATE_LIMITS.api.investments
  )
}