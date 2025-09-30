import { loadStripe } from '@stripe/stripe-js'

// Client-side Stripe instance
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

if (!stripePublishableKey && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// Lazy-load Stripe on client side
let stripePromise: ReturnType<typeof loadStripe> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey || 'pk_test_placeholder')
  }
  return stripePromise
}