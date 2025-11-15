/**
 * Tests for lib/constants.ts
 *
 * Testing application-wide constants for completeness and correctness
 */

import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  INVESTMENT_STATUSES,
  INVESTMENT_STATUS_LABELS,
  INVESTMENT_TYPES,
  INVESTMENT_LIMITS,
  USER_ROLES,
  USER_ROLE_LABELS,
  HTTP_STATUS,
  HTTP_METHODS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  API_ENDPOINTS,
  FINANCIAL_METRICS,
  REGEX,
} from '../../lib/constants'

describe('Project Constants', () => {
  describe('PROJECT_TYPES', () => {
    it('should have all project types', () => {
      expect(PROJECT_TYPES).toHaveProperty('SOLAR')
      expect(PROJECT_TYPES).toHaveProperty('WIND')
      expect(PROJECT_TYPES).toHaveProperty('HYDRO')
      expect(PROJECT_TYPES).toHaveProperty('GEOTHERMAL')
      expect(PROJECT_TYPES).toHaveProperty('BIOMASS')
    })

    it('should have consistent values', () => {
      expect(PROJECT_TYPES.SOLAR).toBe('solar')
      expect(PROJECT_TYPES.WIND).toBe('wind')
    })
  })

  describe('PROJECT_TYPE_LABELS', () => {
    it('should have labels for all project types', () => {
      Object.values(PROJECT_TYPES).forEach(type => {
        expect(PROJECT_TYPE_LABELS[type]).toBeDefined()
        expect(typeof PROJECT_TYPE_LABELS[type]).toBe('string')
      })
    })
  })

  describe('PROJECT_STATUSES', () => {
    it('should have all project statuses', () => {
      expect(PROJECT_STATUSES).toHaveProperty('PLANNING')
      expect(PROJECT_STATUSES).toHaveProperty('FUNDING')
      expect(PROJECT_STATUSES).toHaveProperty('CONSTRUCTION')
      expect(PROJECT_STATUSES).toHaveProperty('OPERATIONAL')
    })
  })

  describe('PROJECT_STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      Object.values(PROJECT_STATUSES).forEach(status => {
        expect(PROJECT_STATUS_LABELS[status]).toBeDefined()
      })
    })
  })
})

describe('Investment Constants', () => {
  describe('INVESTMENT_STATUSES', () => {
    it('should have all investment statuses', () => {
      expect(INVESTMENT_STATUSES).toHaveProperty('PENDING')
      expect(INVESTMENT_STATUSES).toHaveProperty('CONFIRMED')
      expect(INVESTMENT_STATUSES).toHaveProperty('ACTIVE')
      expect(INVESTMENT_STATUSES).toHaveProperty('COMPLETED')
      expect(INVESTMENT_STATUSES).toHaveProperty('CANCELLED')
    })

    it('should have consistent status values', () => {
      expect(INVESTMENT_STATUSES.PENDING).toBe('pending')
      expect(INVESTMENT_STATUSES.CONFIRMED).toBe('confirmed')
    })
  })

  describe('INVESTMENT_STATUS_LABELS', () => {
    it('should have labels for all investment statuses', () => {
      Object.values(INVESTMENT_STATUSES).forEach(status => {
        expect(INVESTMENT_STATUS_LABELS[status]).toBeDefined()
      })
    })
  })

  describe('INVESTMENT_TYPES', () => {
    it('should have all investment types', () => {
      expect(INVESTMENT_TYPES).toHaveProperty('EQUITY')
      expect(INVESTMENT_TYPES).toHaveProperty('DEBT')
      expect(INVESTMENT_TYPES).toHaveProperty('HYBRID')
      expect(INVESTMENT_TYPES).toHaveProperty('GRANT')
    })
  })

  describe('INVESTMENT_LIMITS', () => {
    it('should have investment limits', () => {
      expect(INVESTMENT_LIMITS).toHaveProperty('MIN_AMOUNT')
      expect(INVESTMENT_LIMITS).toHaveProperty('MAX_AMOUNT')
      expect(INVESTMENT_LIMITS).toHaveProperty('DEFAULT_AMOUNT')
    })

    it('should have reasonable limits', () => {
      expect(INVESTMENT_LIMITS.MIN_AMOUNT).toBeGreaterThan(0)
      expect(INVESTMENT_LIMITS.MAX_AMOUNT).toBeGreaterThan(INVESTMENT_LIMITS.MIN_AMOUNT)
      expect(INVESTMENT_LIMITS.DEFAULT_AMOUNT).toBeGreaterThanOrEqual(INVESTMENT_LIMITS.MIN_AMOUNT)
      expect(INVESTMENT_LIMITS.DEFAULT_AMOUNT).toBeLessThanOrEqual(INVESTMENT_LIMITS.MAX_AMOUNT)
    })
  })
})

describe('User Constants', () => {
  describe('USER_ROLES', () => {
    it('should have all user roles', () => {
      expect(USER_ROLES).toHaveProperty('ADMIN')
      expect(USER_ROLES).toHaveProperty('INVESTOR')
      expect(USER_ROLES).toHaveProperty('PROJECT_DEVELOPER')
    })

    it('should have consistent role values', () => {
      expect(USER_ROLES.ADMIN).toBe('admin')
      expect(USER_ROLES.INVESTOR).toBe('investor')
    })
  })

  describe('USER_ROLE_LABELS', () => {
    it('should have labels for all roles', () => {
      Object.values(USER_ROLES).forEach(role => {
        expect(USER_ROLE_LABELS[role]).toBeDefined()
      })
    })
  })
})

describe('HTTP Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have common success codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
    })

    it('should have common client error codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
    })

    it('should have common server error codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('HTTP_METHODS', () => {
    it('should have all standard HTTP methods', () => {
      expect(HTTP_METHODS.GET).toBe('GET')
      expect(HTTP_METHODS.POST).toBe('POST')
      expect(HTTP_METHODS.PUT).toBe('PUT')
      expect(HTTP_METHODS.PATCH).toBe('PATCH')
      expect(HTTP_METHODS.DELETE).toBe('DELETE')
    })
  })
})

describe('Message Constants', () => {
  describe('ERROR_MESSAGES', () => {
    it('should have authentication error messages', () => {
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined()
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined()
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined()
    })

    it('should have validation error messages', () => {
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBeDefined()
      expect(typeof ERROR_MESSAGES.REQUIRED_FIELD).toBe('function')
    })

    it('should have project error messages', () => {
      expect(ERROR_MESSAGES.PROJECT_NOT_FOUND).toBeDefined()
    })

    it('should have investment error messages', () => {
      expect(ERROR_MESSAGES.INVESTMENT_NOT_FOUND).toBeDefined()
      expect(ERROR_MESSAGES.INVESTMENT_LIMIT_EXCEEDED).toBeDefined()
    })

    it('should have REQUIRED_FIELD function', () => {
      const message = ERROR_MESSAGES.REQUIRED_FIELD('Email')
      expect(message).toContain('Email')
      expect(message).toContain('required')
    })
  })

  describe('SUCCESS_MESSAGES', () => {
    it('should have authentication success messages', () => {
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBeDefined()
      expect(SUCCESS_MESSAGES.REGISTER_SUCCESS).toBeDefined()
    })

    it('should have project success messages', () => {
      expect(SUCCESS_MESSAGES.PROJECT_CREATED).toBeDefined()
    })

    it('should have investment success messages', () => {
      expect(SUCCESS_MESSAGES.INVESTMENT_CREATED).toBeDefined()
    })
  })
})

describe('API Endpoints', () => {
  describe('API_ENDPOINTS', () => {
    it('should have authentication endpoints', () => {
      expect(API_ENDPOINTS.LOGIN).toBe('/api/auth/login')
      expect(API_ENDPOINTS.REGISTER).toBe('/api/auth/register')
      expect(API_ENDPOINTS.LOGOUT).toBe('/api/auth/logout')
    })

    it('should have project endpoints', () => {
      expect(API_ENDPOINTS.PROJECTS).toBe('/api/projects')
      expect(typeof API_ENDPOINTS.PROJECT_BY_ID).toBe('function')
    })

    it('should have investment endpoints', () => {
      expect(API_ENDPOINTS.INVESTMENTS).toBe('/api/investments')
      expect(typeof API_ENDPOINTS.INVESTMENT_BY_ID).toBe('function')
    })

    it('should have stats endpoint', () => {
      expect(API_ENDPOINTS.STATS).toBe('/api/stats')
      expect(API_ENDPOINTS.HEALTH).toBe('/api/health')
    })

    it('should generate dynamic endpoints', () => {
      expect(API_ENDPOINTS.PROJECT_BY_ID('123')).toBe('/api/projects/123')
      expect(API_ENDPOINTS.INVESTMENT_BY_ID('456')).toBe('/api/investments/456')
    })
  })
})

describe('Financial Metrics', () => {
  describe('FINANCIAL_METRICS', () => {
    it('should have IRR thresholds', () => {
      expect(FINANCIAL_METRICS.IRR).toHaveProperty('EXCELLENT')
      expect(FINANCIAL_METRICS.IRR).toHaveProperty('GOOD')
      expect(FINANCIAL_METRICS.IRR).toHaveProperty('FAIR')
      expect(FINANCIAL_METRICS.IRR).toHaveProperty('POOR')
    })

    it('should have logical IRR progression', () => {
      expect(FINANCIAL_METRICS.IRR.EXCELLENT).toBeGreaterThan(FINANCIAL_METRICS.IRR.GOOD)
      expect(FINANCIAL_METRICS.IRR.GOOD).toBeGreaterThan(FINANCIAL_METRICS.IRR.FAIR)
      expect(FINANCIAL_METRICS.IRR.FAIR).toBeGreaterThan(FINANCIAL_METRICS.IRR.POOR)
    })

    it('should have payback period thresholds', () => {
      expect(FINANCIAL_METRICS.PAYBACK_PERIOD).toHaveProperty('EXCELLENT')
      expect(FINANCIAL_METRICS.PAYBACK_PERIOD).toHaveProperty('GOOD')
      expect(FINANCIAL_METRICS.PAYBACK_PERIOD).toHaveProperty('FAIR')
      expect(FINANCIAL_METRICS.PAYBACK_PERIOD).toHaveProperty('POOR')
    })

    it('should have ROI thresholds', () => {
      expect(FINANCIAL_METRICS.ROI).toHaveProperty('EXCELLENT')
      expect(FINANCIAL_METRICS.ROI).toHaveProperty('GOOD')
      expect(FINANCIAL_METRICS.ROI).toHaveProperty('FAIR')
      expect(FINANCIAL_METRICS.ROI).toHaveProperty('POOR')
    })
  })
})

describe('Regex Patterns', () => {
  describe('REGEX', () => {
    it('should have email regex', () => {
      expect(REGEX.EMAIL).toBeInstanceOf(RegExp)
      expect(REGEX.EMAIL.test('test@example.com')).toBe(true)
      expect(REGEX.EMAIL.test('invalid-email')).toBe(false)
    })

    it('should have URL regex', () => {
      expect(REGEX.URL).toBeInstanceOf(RegExp)
      expect(REGEX.URL.test('https://example.com')).toBe(true)
      expect(REGEX.URL.test('not-a-url')).toBe(false)
    })

    it('should have slug regex', () => {
      expect(REGEX.SLUG).toBeInstanceOf(RegExp)
      expect(REGEX.SLUG.test('hello-world')).toBe(true)
      expect(REGEX.SLUG.test('Hello World')).toBe(false)
    })

    it('should have UUID regex', () => {
      expect(REGEX.UUID).toBeInstanceOf(RegExp)
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      expect(REGEX.UUID.test(validUUID)).toBe(true)
      expect(REGEX.UUID.test('not-a-uuid')).toBe(false)
    })
  })
})
