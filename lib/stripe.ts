import Stripe from 'stripe'

// Server-side Stripe instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

// Don't throw during build time, only at runtime when actually used
export const stripe = new Stripe(stripeSecretKey || 'sk_test_demo', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Helper function to format amount for Stripe (converts dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100)
}

// Helper function to format amount from Stripe (converts cents to dollars)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100
}