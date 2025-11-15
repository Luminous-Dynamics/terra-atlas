/**
 * Environment Variable Validation
 *
 * Runtime validation of all environment variables with type safety
 * Catches missing/invalid env vars at startup instead of runtime
 */

import { z } from 'zod'

// ============================================================================
// Environment Schema
// ============================================================================

/**
 * Complete environment variable schema
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Application
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:3002'),
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3002))
    .pipe(z.number().int().positive()),

  // Database
  DATABASE_URL: z
    .string()
    .optional(), // Optional because we use SQLite locally

  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional(), // Optional for client-only usage

  // Authentication (Required)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters for security'),

  // Stripe (Optional - for payment features)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .optional(),
  STRIPE_SECRET_KEY: z
    .string()
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional(),

  // Email (Optional)
  EMAIL_FROM: z
    .string()
    .email()
    .optional(),
  EMAIL_API_KEY: z
    .string()
    .optional(),

  // Analytics (Optional)
  NEXT_PUBLIC_GA_ID: z
    .string()
    .optional(),
  NEXT_PUBLIC_GTM_ID: z
    .string()
    .optional(),

  // Monitoring (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  SENTRY_AUTH_TOKEN: z
    .string()
    .optional(),

  // Vercel (Auto-populated in Vercel environment)
  VERCEL: z
    .string()
    .optional(),
  VERCEL_ENV: z
    .enum(['development', 'preview', 'production'])
    .optional(),
  VERCEL_URL: z
    .string()
    .optional(),
  VERCEL_GIT_COMMIT_SHA: z
    .string()
    .optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validate environment variables
 *
 * @throws {Error} If validation fails with detailed error messages
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.join('.')
      return `  ❌ ${path}: ${err.message}`
    })

    console.error('\n🚨 Environment Variable Validation Failed:\n')
    console.error(errors.join('\n'))
    console.error('\n💡 Please check your .env.local file\n')

    throw new Error('Invalid environment variables')
  }

  return result.data
}

/**
 * Validate environment variables (silent mode)
 *
 * @returns {object} Validation result with success flag and errors
 */
export function validateEnvSilent(): {
  success: boolean
  data?: Env
  errors?: string[]
} {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

// ============================================================================
// Environment Helpers
// ============================================================================

/**
 * Validated environment variables
 * Call validateEnv() at app startup to ensure all required vars are set
 */
let _env: Env | null = null

/**
 * Get validated environment variables
 *
 * @throws {Error} If env hasn't been validated yet
 */
export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv()
  }
  return _env
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return process.env.VERCEL === '1'
}

/**
 * Get current environment name
 */
export function getEnvironmentName(): string {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV
  }
  return process.env.NODE_ENV || 'development'
}

// ============================================================================
// Required Environment Variables Check
// ============================================================================

/**
 * Check for required environment variables
 *
 * @returns {object} Object with missing and optional vars
 */
export function checkRequiredEnvVars(): {
  missing: string[]
  optional: string[]
  hasAllRequired: boolean
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ]

  const optional = [
    'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'EMAIL_FROM',
    'EMAIL_API_KEY',
    'NEXT_PUBLIC_GA_ID',
    'NEXT_PUBLIC_SENTRY_DSN',
  ]

  const missing = required.filter((key) => !process.env[key])
  const missingOptional = optional.filter((key) => !process.env[key])

  return {
    missing,
    optional: missingOptional,
    hasAllRequired: missing.length === 0,
  }
}

/**
 * Print environment status
 */
export function printEnvStatus(): void {
  const status = checkRequiredEnvVars()
  const envName = getEnvironmentName()

  console.log('\n📋 Environment Status:')
  console.log(`   Environment: ${envName}`)
  console.log(`   Node Version: ${process.version}`)
  console.log(`   Platform: ${process.platform}`)

  if (status.hasAllRequired) {
    console.log('   ✅ All required environment variables are set')
  } else {
    console.log('   ❌ Missing required environment variables:')
    status.missing.forEach((key) => {
      console.log(`      - ${key}`)
    })
  }

  if (status.optional.length > 0) {
    console.log('   ⚠️  Optional environment variables not set:')
    status.optional.forEach((key) => {
      console.log(`      - ${key}`)
    })
  }

  console.log('')
}

// ============================================================================
// Auto-validation (Development Only)
// ============================================================================

/**
 * Automatically validate environment in development
 * Disabled in production to avoid startup delays
 */
if (isDevelopment() && !isTest()) {
  try {
    validateEnv()
    console.log('✅ Environment variables validated successfully\n')
  } catch (error) {
    // Error already logged by validateEnv()
    // Don't exit in development, just warn
  }
}
