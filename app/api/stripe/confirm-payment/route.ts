import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Temporary auth solution for testing (replace with proper auth later)
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    const session = {
      user: {
        id: userId || 'test-user-123',
        email: userEmail || 'test@terra-atlas.com',
        name: request.headers.get('x-user-name') || 'Test User'
      }
    }
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide x-user-email header' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Verify payment belongs to authenticated user
    if (paymentIntent.metadata.userEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Payment does not belong to user' },
        { status: 403 }
      )
    }

    // Check payment status
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { 
          error: 'Payment not completed',
          status: paymentIntent.status,
          requiresAction: paymentIntent.status === 'requires_action'
        },
        { status: 400 }
      )
    }

    // Payment successful - Create investment record in database
    const investmentData = {
      user_id: session.user.id,
      user_email: session.user.email,
      project_id: parseInt(paymentIntent.metadata.projectId),
      project_name: paymentIntent.metadata.projectName,
      project_type: paymentIntent.metadata.projectType,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      investment_term_months: parseInt(paymentIntent.metadata.investmentTermMonths || '12'),
      payment_method: 'stripe',
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer as string,
      metadata: {
        ...paymentIntent.metadata,
        confirmedAt: new Date().toISOString()
      }
    }

    // Insert investment record
    const { data: investment, error: dbError } = await supabase
      .from('investments')
      .insert([investmentData])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Payment succeeded but database failed - log for manual reconciliation
      await logFailedInvestmentRecord(paymentIntent, investmentData, dbError)
      
      return NextResponse.json({
        success: true,
        paymentStatus: 'succeeded',
        investmentRecorded: false,
        message: 'Payment successful. Investment record pending.',
        paymentIntentId: paymentIntent.id
      })
    }

    // Update project funding totals
    await updateProjectFunding(
      parseInt(paymentIntent.metadata.projectId),
      paymentIntent.amount / 100
    )

    // Send confirmation email (async - don't wait)
    sendInvestmentConfirmationEmail(session.user.email, investmentData).catch(console.error)

    return NextResponse.json({
      success: true,
      paymentStatus: 'succeeded',
      investmentRecorded: true,
      investmentId: investment.id,
      amount: paymentIntent.amount / 100,
      projectName: paymentIntent.metadata.projectName,
      message: 'Investment successful!'
    })
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

// Helper function to update project funding totals
async function updateProjectFunding(projectId: number, amount: number) {
  try {
    // Get current project funding
    const { data: project } = await supabase
      .from('projects')
      .select('total_raised, investors_count')
      .eq('id', projectId)
      .single()

    if (project) {
      // Update funding totals
      await supabase
        .from('projects')
        .update({
          total_raised: (project.total_raised || 0) + amount,
          investors_count: (project.investors_count || 0) + 1
        })
        .eq('id', projectId)
    }
  } catch (error) {
    console.error('Failed to update project funding:', error)
  }
}

// Helper function to log failed investment records for manual reconciliation
async function logFailedInvestmentRecord(
  paymentIntent: any,
  investmentData: any,
  error: any
) {
  try {
    await supabase
      .from('failed_investment_records')
      .insert([{
        payment_intent_id: paymentIntent.id,
        investment_data: investmentData,
        error_details: error,
        created_at: new Date().toISOString()
      }])
  } catch (logError) {
    console.error('Failed to log investment record failure:', logError)
  }
}

// Helper function to send confirmation email
async function sendInvestmentConfirmationEmail(email: string, investmentData: any) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, just log it
  console.log('Sending investment confirmation email to:', email, investmentData)
}