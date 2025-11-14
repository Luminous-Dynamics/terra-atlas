/**
 * Terra Atlas Logger Utility
 *
 * Provides environment-aware logging that:
 * - Only logs debug messages in development
 * - Always logs warnings and errors
 * - Can be easily extended with external logging services
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Debug logging - only outputs in development mode
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info logging - only outputs in development mode
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Warning logging - always outputs
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Error logging - always outputs
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Log API requests in development
   */
  api: (method: string, url: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${method} ${url}`, data || '')
    }
  },

  /**
   * Log database queries in development
   */
  db: (query: string, params?: any) => {
    if (isDevelopment) {
      console.log('[DB]', query, params || '')
    }
  }
}

/**
 * Usage examples:
 *
 * import { logger } from '@/lib/logger'
 *
 * logger.debug('This only shows in development')
 * logger.info('User logged in:', userId)
 * logger.warn('Deprecated API usage')
 * logger.error('Failed to fetch data:', error)
 * logger.api('POST', '/api/auth/login', { email })
 * logger.db('SELECT * FROM users WHERE id = ?', [userId])
 */
