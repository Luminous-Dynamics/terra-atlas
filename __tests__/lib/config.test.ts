/**
 * Tests for lib/config.ts
 *
 * Testing configuration validation and structure
 */

import {
  ENV,
  APP_CONFIG,
  RATE_LIMITS,
  CACHE_DURATIONS,
  AUTH_CONFIG,
  PAGINATION,
  API_LIMITS,
  SECURITY_CONFIG,
  FEATURES,
  validateConfig,
  getConfigSummary,
} from '../../lib/config'

describe('Environment Configuration', () => {
  it('should have valid environment detection', () => {
    expect(ENV).toHaveProperty('isDevelopment')
    expect(ENV).toHaveProperty('isProduction')
    expect(ENV).toHaveProperty('isTest')
    expect(ENV).toHaveProperty('nodeEnv')
    expect(typeof ENV.isDevelopment).toBe('boolean')
    expect(typeof ENV.isProduction).toBe('boolean')
    expect(typeof ENV.isTest).toBe('boolean')
  })

  it('should be in test mode during tests', () => {
    expect(ENV.isTest).toBe(true)
    expect(ENV.nodeEnv).toBe('test')
  })
})

describe('Application Configuration', () => {
  it('should have required app config fields', () => {
    expect(APP_CONFIG).toHaveProperty('name')
    expect(APP_CONFIG).toHaveProperty('version')
    expect(APP_CONFIG).toHaveProperty('url')
    expect(APP_CONFIG).toHaveProperty('port')
    expect(APP_CONFIG).toHaveProperty('apiPrefix')
  })

  it('should have valid app name', () => {
    expect(APP_CONFIG.name).toBe('Terra Atlas')
  })

  it('should have valid API prefix', () => {
    expect(APP_CONFIG.apiPrefix).toBe('/api')
  })
})

describe('Rate Limits Configuration', () => {
  it('should have auth rate limits', () => {
    expect(RATE_LIMITS.auth).toBeDefined()
    expect(RATE_LIMITS.auth.login).toHaveProperty('maxRequests')
    expect(RATE_LIMITS.auth.login).toHaveProperty('windowMs')
    expect(RATE_LIMITS.auth.register).toHaveProperty('maxRequests')
    expect(RATE_LIMITS.auth.register).toHaveProperty('windowMs')
  })

  it('should have API rate limits', () => {
    expect(RATE_LIMITS.api).toBeDefined()
    expect(RATE_LIMITS.api.projects).toHaveProperty('maxRequests')
    expect(RATE_LIMITS.api.stats).toHaveProperty('maxRequests')
    expect(RATE_LIMITS.api.investments).toHaveProperty('maxRequests')
  })

  it('should have default rate limit', () => {
    expect(RATE_LIMITS.default).toHaveProperty('maxRequests')
    expect(RATE_LIMITS.default).toHaveProperty('windowMs')
  })

  it('should have higher limits in development', () => {
    // In test mode (which extends development), limits should be high
    expect(RATE_LIMITS.auth.login.maxRequests).toBeGreaterThan(5)
  })
})

describe('Cache Durations Configuration', () => {
  it('should have all cache duration keys', () => {
    expect(CACHE_DURATIONS).toHaveProperty('stats')
    expect(CACHE_DURATIONS).toHaveProperty('projects')
    expect(CACHE_DURATIONS).toHaveProperty('user_profile')
    expect(CACHE_DURATIONS).toHaveProperty('investments')
    expect(CACHE_DURATIONS).toHaveProperty('static_data')
    expect(CACHE_DURATIONS).toHaveProperty('metadata')
    expect(CACHE_DURATIONS).toHaveProperty('default')
  })

  it('should have numeric cache durations', () => {
    expect(typeof CACHE_DURATIONS.stats).toBe('number')
    expect(typeof CACHE_DURATIONS.projects).toBe('number')
    expect(typeof CACHE_DURATIONS.default).toBe('number')
  })

  it('should have reasonable cache durations', () => {
    expect(CACHE_DURATIONS.stats).toBeGreaterThan(0)
    expect(CACHE_DURATIONS.stats).toBeLessThan(24 * 60 * 60 * 1000) // Less than 24 hours
  })
})

describe('Authentication Configuration', () => {
  it('should have JWT configuration', () => {
    expect(AUTH_CONFIG.jwt).toHaveProperty('secret')
    expect(AUTH_CONFIG.jwt).toHaveProperty('accessTokenExpiry')
    expect(AUTH_CONFIG.jwt).toHaveProperty('refreshTokenExpiry')
    expect(AUTH_CONFIG.jwt).toHaveProperty('algorithm')
  })

  it('should have password requirements', () => {
    expect(AUTH_CONFIG.password).toHaveProperty('minLength')
    expect(AUTH_CONFIG.password).toHaveProperty('maxLength')
    expect(AUTH_CONFIG.password).toHaveProperty('requireUppercase')
    expect(AUTH_CONFIG.password).toHaveProperty('requireLowercase')
    expect(AUTH_CONFIG.password).toHaveProperty('requireNumbers')
    expect(AUTH_CONFIG.password).toHaveProperty('requireSpecialChars')
  })

  it('should have reasonable password requirements', () => {
    expect(AUTH_CONFIG.password.minLength).toBeGreaterThanOrEqual(8)
    expect(AUTH_CONFIG.password.maxLength).toBeGreaterThan(AUTH_CONFIG.password.minLength)
  })

  it('should have session configuration', () => {
    expect(AUTH_CONFIG.session).toHaveProperty('cookieName')
    expect(AUTH_CONFIG.session).toHaveProperty('maxAge')
    expect(AUTH_CONFIG.session).toHaveProperty('secure')
    expect(AUTH_CONFIG.session).toHaveProperty('httpOnly')
    expect(AUTH_CONFIG.session).toHaveProperty('sameSite')
  })
})

describe('Pagination Configuration', () => {
  it('should have pagination defaults', () => {
    expect(PAGINATION).toHaveProperty('defaultLimit')
    expect(PAGINATION).toHaveProperty('maxLimit')
    expect(PAGINATION).toHaveProperty('defaultOffset')
  })

  it('should have reasonable pagination limits', () => {
    expect(PAGINATION.defaultLimit).toBeLessThanOrEqual(PAGINATION.maxLimit)
    expect(PAGINATION.defaultOffset).toBe(0)
  })
})

describe('API Limits Configuration', () => {
  it('should have API limits', () => {
    expect(API_LIMITS).toHaveProperty('maxProjectsPerPage')
    expect(API_LIMITS).toHaveProperty('maxInvestmentsPerPage')
    expect(API_LIMITS).toHaveProperty('maxSearchResults')
    expect(API_LIMITS).toHaveProperty('maxBulkOperations')
  })

  it('should have reasonable API limits', () => {
    expect(API_LIMITS.maxProjectsPerPage).toBeGreaterThan(0)
    expect(API_LIMITS.maxProjectsPerPage).toBeLessThanOrEqual(100)
  })
})

describe('Security Configuration', () => {
  it('should have CORS configuration', () => {
    expect(SECURITY_CONFIG.cors).toHaveProperty('origin')
    expect(SECURITY_CONFIG.cors).toHaveProperty('methods')
    expect(SECURITY_CONFIG.cors).toHaveProperty('allowedHeaders')
    expect(SECURITY_CONFIG.cors).toHaveProperty('credentials')
  })

  it('should have CSP configuration', () => {
    expect(SECURITY_CONFIG.csp).toHaveProperty('defaultSrc')
    expect(SECURITY_CONFIG.csp).toHaveProperty('scriptSrc')
    expect(SECURITY_CONFIG.csp).toHaveProperty('styleSrc')
  })

  it('should have security headers', () => {
    expect(SECURITY_CONFIG.headers).toHaveProperty('X-Frame-Options')
    expect(SECURITY_CONFIG.headers).toHaveProperty('X-Content-Type-Options')
  })

  it('should deny frame embedding', () => {
    expect(SECURITY_CONFIG.headers['X-Frame-Options']).toBe('DENY')
  })
})

describe('Feature Flags', () => {
  it('should have feature flags', () => {
    expect(FEATURES).toHaveProperty('enable3DGlobe')
    expect(FEATURES).toHaveProperty('enableMapView')
    expect(FEATURES).toHaveProperty('enableInvestments')
    expect(FEATURES).toHaveProperty('enableUserProfiles')
    expect(FEATURES).toHaveProperty('enableAdminPanel')
  })

  it('should have boolean feature flags', () => {
    expect(typeof FEATURES.enable3DGlobe).toBe('boolean')
    expect(typeof FEATURES.enableMapView).toBe('boolean')
  })
})

describe('Configuration Validation', () => {
  it('should validate configuration', () => {
    const result = validateConfig()
    expect(result).toHaveProperty('valid')
    expect(result).toHaveProperty('missing')
    expect(typeof result.valid).toBe('boolean')
    expect(Array.isArray(result.missing)).toBe(true)
  })

  it('should pass validation in test environment', () => {
    const result = validateConfig()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })
})

describe('Configuration Summary', () => {
  it('should generate config summary', () => {
    const summary = getConfigSummary()
    expect(summary).toHaveProperty('environment')
    expect(summary).toHaveProperty('version')
    expect(summary).toHaveProperty('features')
    expect(summary).toHaveProperty('database')
    expect(summary).toHaveProperty('monitoring')
  })

  it('should include environment in summary', () => {
    const summary = getConfigSummary()
    expect(summary.environment).toBe('test')
  })

  it('should include version in summary', () => {
    const summary = getConfigSummary()
    expect(summary.version).toBe(APP_CONFIG.version)
  })
})
