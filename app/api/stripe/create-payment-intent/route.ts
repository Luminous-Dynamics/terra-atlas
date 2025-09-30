import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Temporary auth solution for testing (replace with proper auth later)
    // In production, use NextAuth or similar auth solution
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    // For testing, allow auth via headers or use test user
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
    const { 
      amount, 
      projectId, 
      projectName, 
      projectType,
      investmentTermMonths,
      metadata = {}
    } = body

    // Validate input
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum investment is $10' },
        { status: 400 }
      )
    }

    if (!projectId || !projectName) {
      return NextResponse.json(
        { error: 'Project information is required' },
        { status: 400 }
      )
    }

    // Equal opportunity: Same minimum for ALL projects including SMR
    // Everyone deserves access to clean energy investment, regardless of wealth

    // Create or retrieve Stripe customer
    let customerId = null
    
    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id || '',
          platform: 'terra-atlas'
        }
      })
      customerId = customer.id
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: 'usd',
      customer: customerId,
      metadata: {
        projectId: projectId.toString(),
        projectName,
        projectType: projectType || 'standard',
        investmentTermMonths: investmentTermMonths?.toString() || '12',
        userEmail: session.user.email,
        userId: session.user.id || '',
        ...metadata
      },
      description: `Investment in ${projectName}`,
      automatic_payment_methods: {
        enabled: true,
      },
      // For large SMR investments, allow manual confirmation
      confirmation_method: amount >= 100000 ? 'manual' : 'automatic',
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      customerId: customerId
    })
  } catch (error: any) {
    console.error('Stripe payment intent error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}