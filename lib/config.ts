/**
 * Terra Atlas Application Configuration
 *
 * Centralized configuration for the entire application.
 * Environment-specific values are loaded from process.env
 */

// ============================================================================
// Environment Detection
// ============================================================================

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  nodeEnv: process.env.NODE_ENV || 'development'
} as const

// ============================================================================
// Application Settings
// ============================================================================

export const APP_CONFIG = {
  name: 'Terra Atlas',
  version: '1.0.0',
  description: 'Global Renewable Energy Investment Platform',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002',
  port: process.env.PORT || 3002,
  apiPrefix: '/api'
} as const

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    login: {
      maxRequests: ENV.isDevelopment ? 100 : 5,
      windowMs: 60000 // 1 minute
    },
    register: {
      maxRequests: ENV.isDevelopment ? 100 : 3,
      windowMs: 60000 // 1 minute
    },
    refresh: {
      maxRequests: ENV.isDevelopment ? 100 : 10,
      windowMs: 60000
    },
    logout: {
      maxRequests: ENV.isDevelopment ? 100 : 20,
      windowMs: 60000
    }
  },

  // Public API endpoints
  api: {
    projects: {
      maxRequests: ENV.isDevelopment ? 1000 : 60,
      windowMs: 60000
    },
    stats: {
      maxRequests: ENV.isDevelopment ? 1000 : 30,
      windowMs: 60000
    },
    investments: {
      maxRequests: ENV.isDevelopment ? 1000 : 30,
      windowMs: 60000
    }
  },

  // Default rate limit for undefined endpoints
  default: {
    maxRequests: ENV.isDevelopment ? 1000 : 100,
    windowMs: 60000
  }
} as const

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_DURATIONS = {
  // Short-lived caches
  stats: 5 * 60 * 1000,        // 5 minutes
  projects: 10 * 60 * 1000,    // 10 minutes

  // Medium-lived caches
  user_profile: 15 * 60 * 1000,  // 15 minutes
  investments: 15 * 60 * 1000,   // 15 minutes

  // Long-lived caches
  static_data: 60 * 60 * 1000,   // 1 hour
  metadata: 24 * 60 * 60 * 1000, // 24 hours

  // API response caching
  default: 5 * 60 * 1000  // 5 minutes
} as const

// ============================================================================
// Authentication Configuration
// ============================================================================

export const AUTH_CONFIG = {
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || '',
    accessTokenExpiry: '7d',      // 7 days
    refreshTokenExpiry: '30d',    // 30 days
    algorithm: 'HS256' as const
  },

  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  },

  // Session settings
  session: {
    cookieName: 'terra_atlas_session',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: ENV.isProduction,
    httpOnly: true,
    sameSite: 'lax' as const
  }
} as const

// ============================================================================
// Database Configuration
// ============================================================================

export const DB_CONFIG = {
  url: process.env.DATABASE_URL || '',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  connectionTimeout: 10000, // 10 seconds
  queryTimeout: 30000,      // 30 seconds
  ssl: ENV.isProduction
} as const

// ============================================================================
// Supabase Configuration
// ============================================================================

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  schema: 'public'
} as const

// ============================================================================
// Stripe Configuration
// ============================================================================

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'USD',
  enabled: !!process.env.STRIPE_SECRET_KEY
} as const

// ============================================================================
// Email Configuration
// ============================================================================

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@luminousdynamics.io',
  support: 'support@luminousdynamics.io',
  enabled: !!process.env.EMAIL_API_KEY
} as const

// ============================================================================
// Pagination Configuration
// ============================================================================

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0
} as const

// ============================================================================
// File Upload Configuration
// ============================================================================

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  imagePath: '/uploads/images',
  documentPath: '/uploads/documents'
} as const

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  enablePayments: STRIPE_CONFIG.enabled,
  enableEmailNotifications: EMAIL_CONFIG.enabled,
  enableAnalytics: !!process.env.NEXT_PUBLIC_GA_ID,
  enableSentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  enable3DGlobe: true,
  enableMapView: true,
  enableInvestments: true,
  enableUserProfiles: true,
  enableAdminPanel: true,

  // Development-only features
  enableDebugMode: ENV.isDevelopment,
  enableMockData: ENV.isDevelopment && process.env.USE_MOCK_DATA === 'true'
} as const

// ============================================================================
// API Response Limits
// ============================================================================

export const API_LIMITS = {
  maxProjectsPerPage: 50,
  maxInvestmentsPerPage: 50,
  maxSearchResults: 100,
  maxBulkOperations: 100
} as const

// ============================================================================
// Security Configuration
// ============================================================================

export const SECURITY_CONFIG = {
  // CORS settings
  cors: {
    origin: ENV.isProduction
      ? [APP_CONFIG.url]
      : ['http://localhost:3002', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", SUPABASE_CONFIG.url],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
} as const

// ============================================================================
// Monitoring Configuration
// ============================================================================

export const MONITORING = {
  // Sentry
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: ENV.nodeEnv,
    tracesSampleRate: ENV.isProduction ? 0.1 : 1.0,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_GA_ID
  },

  // Performance monitoring
  performance: {
    enableWebVitals: true,
    sampleRate: ENV.isProduction ? 0.1 : 1.0
  }
} as const

// ============================================================================
// Logging Configuration
// ============================================================================

export const LOGGING = {
  level: ENV.isDevelopment ? 'debug' : 'info',
  enableConsole: true,
  enableFile: ENV.isProduction,
  enableRemote: ENV.isProduction,

  // What to log
  logAPI: true,
  logErrors: true,
  logPerformance: ENV.isProduction,
  logDatabase: ENV.isDevelopment
} as const

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate that all required environment variables are set
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Get configuration summary for health checks
 */
export function getConfigSummary() {
  return {
    environment: ENV.nodeEnv,
    version: APP_CONFIG.version,
    features: FEATURES,
    database: {
      connected: !!DB_CONFIG.url,
      provider: 'PostgreSQL (Supabase)'
    },
    stripe: {
      enabled: STRIPE_CONFIG.enabled
    },
    monitoring: {
      sentry: MONITORING.sentry.enabled,
      analytics: MONITORING.analytics.enabled
    }
  }
}
