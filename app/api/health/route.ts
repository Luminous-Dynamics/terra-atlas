import { NextRequest } from 'next/server'
import { withMiddleware } from '../../../lib/middleware'
import { successResponse } from '../../../lib/api/responses'
import { APP_CONFIG, SUPABASE_CONFIG } from '../../../lib/config'
import { HTTP_STATUS } from '../../../lib/constants'
import { structuredLogger } from '../../../lib/logging/structured-logger'
import { startTimer } from '../../../lib/logging/performance-logger'
import Database from 'better-sqlite3'
import path from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Enhanced Health Check Endpoint
 *
 * REFACTORED to use new patterns:
 * - withMiddleware for request handling
 * - Structured logging with request context
 * - Performance monitoring
 * - Standardized response format
 *
 * Checks:
 * - Server uptime
 * - Memory usage
 * - Database connectivity
 * - External services (Supabase)
 * - Response time
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('health_check')
      const checks: Record<string, any> = {}
      let allHealthy = true

      structuredLogger.info('Health check initiated', {
        operation: 'health_check',
        requestId: context.requestId,
      })

      // ========================================================================
      // Server Health
      // ========================================================================
      checks.server = {
        status: 'healthy',
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        version: APP_CONFIG.version,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }

      // ========================================================================
      // Memory Health
      // ========================================================================
      const memoryUsage = process.memoryUsage()
      checks.memory = {
        status: 'healthy',
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
      }

      // Warn if memory usage is high
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      if (heapUsedPercent > 90) {
        checks.memory.status = 'degraded'
        checks.memory.warning = 'High memory usage detected'
        allHealthy = false

        structuredLogger.warn('High memory usage detected', {
          heapUsedPercentage: heapUsedPercent,
        })
      }

      // ========================================================================
      // Database Health (SQLite)
      // ========================================================================
      timer.mark('database_check_start')

      try {
        const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
          readonly: true,
        })
        const result = db.prepare('SELECT COUNT(*) as count FROM projects LIMIT 1').get() as any
        db.close()

        checks.database = {
          status: 'healthy',
          type: 'SQLite',
          projectCount: result.count,
          path: 'data/terra-atlas-local.db',
        }

        timer.mark('database_check_complete')
      } catch (error) {
        checks.database = {
          status: 'unhealthy',
          type: 'SQLite',
          error: error instanceof Error ? error.message : 'Unknown database error',
        }
        allHealthy = false

        structuredLogger.error('Database health check failed', error, {
          operation: 'database_health_check',
        })
      }

      // ========================================================================
      // Supabase Health
      // ========================================================================
      if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        timer.mark('supabase_check_start')

        try {
          const supabaseStartTime = Date.now()
          const supabaseHealth = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              apikey: SUPABASE_CONFIG.anonKey,
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })

          const supabaseResponseTime = Date.now() - supabaseStartTime

          checks.supabase = {
            status: supabaseHealth.ok ? 'healthy' : 'degraded',
            url: SUPABASE_CONFIG.url.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co',
            responseTime: `${supabaseResponseTime}ms`,
          }

          if (!supabaseHealth.ok) {
            allHealthy = false
            structuredLogger.warn('Supabase health check degraded', {
              status: supabaseHealth.status,
            })
          }

          timer.mark('supabase_check_complete')
        } catch (error) {
          checks.supabase = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Connection failed',
          }
          allHealthy = false

          structuredLogger.error('Supabase health check failed', error, {
            operation: 'supabase_health_check',
          })
        }
      } else {
        checks.supabase = {
          status: 'not_configured',
          message: 'Supabase environment variables not set',
        }
      }

      // ========================================================================
      // Environment Health
      // ========================================================================
      checks.environment = {
        status: 'healthy',
        nodeEnv: process.env.NODE_ENV || 'development',
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }

      // Check for missing critical env vars
      const criticalEnvVars = ['JWT_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      const missingEnvVars = criticalEnvVars.filter((key) => !process.env[key])

      if (missingEnvVars.length > 0) {
        checks.environment.status = 'degraded'
        checks.environment.missingVars = missingEnvVars
        allHealthy = false

        structuredLogger.warn('Missing critical environment variables', {
          missingVars: missingEnvVars,
        })
      }

      // ========================================================================
      // Overall Status & Response
      // ========================================================================
      const duration = timer.end()
      const overallStatus = allHealthy ? 'healthy' : 'degraded'
      const statusCode = allHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE

      const healthData = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime: `${duration}ms`,
        service: APP_CONFIG.name,
        version: APP_CONFIG.version,
        requestId: context.requestId,
        checks,
        endpoints: {
          projects: '/api/projects',
          stats: '/api/stats',
          investments: '/api/investments',
          auth: {
            login: '/api/auth/login',
            register: '/api/auth/register',
          },
        },
        performance: {
          databaseCheck: timer.getMark('database_check_complete') || 0,
          supabaseCheck: timer.getMark('supabase_check_complete') || 0,
          total: duration,
        },
      }

      // Log health check results
      if (!allHealthy) {
        structuredLogger.warn('Health check completed with degraded status', {
          operation: 'health_check',
          status: overallStatus,
          checks,
          duration,
        })
      } else {
        structuredLogger.info('Health check completed successfully', {
          operation: 'health_check',
          status: overallStatus,
          duration,
        })
      }

      return successResponse(healthData, {
        status: statusCode,
        requestId: context.requestId,
      })
    },
    {
      performanceTracking: true,
    }
  )
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * Format bytes in human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
