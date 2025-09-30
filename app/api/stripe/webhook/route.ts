import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Stripe webhook secret for verifying the webhook signature
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Update investment record status if needed
        await supabase
          .from('investments')
          .update({ 
            payment_status: 'completed',
            stripe_status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any
        console.log('Payment failed:', paymentIntent.id)
        
        // Update investment record with failure
        await supabase
          .from('investments')
          .update({ 
            payment_status: 'failed',
            stripe_status: 'failed',
            failure_reason: paymentIntent.last_payment_error?.message,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as any
        console.log('Charge refunded:', charge.id)
        
        // Handle refund - update investment record
        await supabase
          .from('investments')
          .update({ 
            payment_status: 'refunded',
            refund_amount: charge.amount_refunded / 100,
            refunded_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', charge.payment_intent)
        
        break
      }

      case 'customer.subscription.created': {
        // Handle subscription creation for recurring investments
        const subscription = event.data.object as any
        console.log('Subscription created:', subscription.id)
        
        // Create subscription record
        await supabase
          .from('investment_subscriptions')
          .insert([{
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            metadata: subscription.metadata
          }])
        
        break
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as any
        console.log('Subscription cancelled:', subscription.id)
        
        // Update subscription record
        await supabase
          .from('investment_subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      case 'invoice.payment_succeeded': {
        // Handle successful recurring payment
        const invoice = event.data.object as any
        console.log('Invoice paid:', invoice.id)
        
        // Record recurring payment
        if (invoice.subscription) {
          await supabase
            .from('recurring_payments')
            .insert([{
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription,
              amount: invoice.amount_paid / 100,
              paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            }])
        }
        
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhooks (we need the raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}