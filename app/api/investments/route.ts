import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fyyszjyixenujgbjaqkd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Supabase with service key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Execute query with pagination
    const { data: investments, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching investments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get portfolio summary
    const { data: summary } = await supabase
      .from('portfolio_summary')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
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
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

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
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Minimum investment is $10' },
        { status: 400 }
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
        user_id: user.id,
        project_id,
        project_name,
        project_type,
        amount,
        status: 'pending',
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
      console.error('Error creating investment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create initial transaction record
    await supabase
      .from('investment_transactions')
      .insert({
        investment_id: investment.id,
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        balance_after: amount,
        description: `Initial investment in ${project_name}`
      })

    return NextResponse.json({
      success: true,
      investment,
      message: 'Investment created successfully. Please complete payment to confirm.'
    }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { investment_id, status, payment_id, transaction_hash } = body

    if (!investment_id) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
        { status: 400 }
      )
    }

    // Get the investment
    const { data: existingInvestment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investment_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingInvestment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      )
    }

    // Only allow updates to pending investments
    if (existingInvestment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only update pending investments' },
        { status: 400 }
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
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating investment:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log transaction for status changes
    if (status === 'completed') {
      await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment_id,
          user_id: user.id,
          type: 'deposit',
          amount: existingInvestment.amount,
          balance_after: existingInvestment.amount,
          description: `Investment confirmed for ${existingInvestment.project_name}`
        })
    } else if (status === 'cancelled' || status === 'refunded') {
      await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment_id,
          user_id: user.id,
          type: 'refund',
          amount: existingInvestment.amount,
          balance_after: 0,
          description: `Investment ${status} for ${existingInvestment.project_name}`
        })
    }

    return NextResponse.json({
      success: true,
      investment: updatedInvestment,
      message: `Investment ${status} successfully`
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}