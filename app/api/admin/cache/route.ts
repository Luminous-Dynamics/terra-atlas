/**
 * Admin Cache Management Endpoints
 *
 * Provides administrative operations for cache management:
 * - View detailed cache statistics
 * - Clear entire cache or specific patterns
 * - Inspect cache entries
 * - Manual cache warming
 *
 * Requires authentication (in production, should require admin role)
 */

import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { ValidationError } from '@/lib/errors'
import { RATE_LIMITS } from '@/lib/config'
import {
  getCacheStats,
  getGlobalCache,
  invalidatePattern,
  invalidateTags,
  invalidateAll,
  warmCache,
} from '@/lib/cache'

/**
 * GET /api/admin/cache
 *
 * Get detailed cache statistics and entries
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('admin_cache_stats')

      structuredLogger.info('Admin cache stats requested', {
        operation: 'admin_cache_stats',
        userId: context.userId,
      })

      // Get cache instance
      const cache = getGlobalCache()
      const stats = cache.getStats()

      // Get all cache keys for inspection
      const keys = 'getKeys' in cache ? (cache as any).getKeys() : []
      const entries =
        'getEntries' in cache ? (cache as any).getEntries().slice(0, 50) : [] // Limit to 50 for performance

      // Analyze cache usage by prefix
      const keysByPrefix: Record<string, number> = {}
      keys.forEach((key: string) => {
        const prefix = key.split(':')[0]
        keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1
      })

      const duration = timer.endAndLog({
        operation: 'admin_cache_stats',
        cacheSize: stats.size,
      })

      return successResponse(
        {
          stats: {
            ...stats,
            hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
            memoryUsageMB: (stats.memoryUsage / 1024 / 1024).toFixed(2),
          },
          distribution: keysByPrefix,
          totalKeys: keys.length,
          sampleEntries: entries.map((entry: any) => ({
            key: entry.key,
            createdAt: new Date(entry.entry.createdAt).toISOString(),
            expiresAt: entry.entry.expiresAt
              ? new Date(entry.entry.expiresAt).toISOString()
              : null,
            hits: entry.entry.hits,
            sizBytes: entry.entry.size,
            tags: entry.entry.tags,
          })),
          recommendations: generateCacheRecommendations(stats, keysByPrefix),
        },
        {
          requestId: context.requestId,
          metadata: {
            performance: {
              total: duration,
            },
          },
        }
      )
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.admin || { maxRequests: 20, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * POST /api/admin/cache
 *
 * Perform cache operations (clear, warm, etc.)
 */
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('admin_cache_operation')

      const body = await request.json()
      const { operation, pattern, tags, entries } = body

      structuredLogger.info('Admin cache operation requested', {
        operation: 'admin_cache_operation',
        userId: context.userId,
        cacheOperation: operation,
      })

      let result: any = {}

      switch (operation) {
        case 'clear_all':
          await invalidateAll()
          result = { cleared: true, message: 'All cache entries cleared' }
          structuredLogger.logBusiness('cache_cleared_all', {
            userId: context.userId,
          })
          break

        case 'clear_pattern':
          if (!pattern) {
            throw new ValidationError('Pattern is required for clear_pattern operation')
          }
          const patternCount = await invalidatePattern(pattern)
          result = { cleared: true, pattern, count: patternCount }
          structuredLogger.logBusiness('cache_cleared_pattern', {
            userId: context.userId,
            pattern,
            count: patternCount,
          })
          break

        case 'clear_tags':
          if (!tags || !Array.isArray(tags)) {
            throw new ValidationError('Tags array is required for clear_tags operation')
          }
          const tagsCount = await invalidateTags(tags)
          result = { cleared: true, tags, count: tagsCount }
          structuredLogger.logBusiness('cache_cleared_tags', {
            userId: context.userId,
            tags,
            count: tagsCount,
          })
          break

        case 'warm':
          if (!entries || !Array.isArray(entries)) {
            throw new ValidationError('Entries array is required for warm operation')
          }
          await warmCache(entries)
          result = { warmed: true, count: entries.length }
          structuredLogger.logBusiness('cache_warmed', {
            userId: context.userId,
            count: entries.length,
          })
          break

        case 'reset_stats':
          const cache = getGlobalCache()
          if ('resetStats' in cache) {
            ;(cache as any).resetStats()
            result = { reset: true, message: 'Cache statistics reset' }
            structuredLogger.logBusiness('cache_stats_reset', {
              userId: context.userId,
            })
          } else {
            throw new ValidationError('Cache does not support stats reset')
          }
          break

        default:
          throw new ValidationError(
            `Unknown operation: ${operation}. Valid operations: clear_all, clear_pattern, clear_tags, warm, reset_stats`
          )
      }

      const duration = timer.endAndLog({
        operation: 'admin_cache_operation',
        cacheOperation: operation,
      })

      return successResponse(result, {
        requestId: context.requestId,
        metadata: {
          performance: {
            total: duration,
          },
        },
      })
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.admin || { maxRequests: 10, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * DELETE /api/admin/cache
 *
 * Clear entire cache (alias for POST with operation=clear_all)
 */
export async function DELETE(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('admin_cache_delete')

      structuredLogger.info('Admin cache delete requested', {
        operation: 'admin_cache_delete',
        userId: context.userId,
      })

      await invalidateAll()

      const duration = timer.endAndLog({
        operation: 'admin_cache_delete',
      })

      structuredLogger.logBusiness('cache_cleared_all', {
        userId: context.userId,
        method: 'DELETE',
      })

      return successResponse(
        {
          cleared: true,
          message: 'All cache entries cleared',
        },
        {
          requestId: context.requestId,
          metadata: {
            performance: {
              total: duration,
            },
          },
        }
      )
    },
    {
      auth: true, // Require authentication
      rateLimit: RATE_LIMITS.api?.admin || { maxRequests: 10, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * Generate cache optimization recommendations
 */
function generateCacheRecommendations(
  stats: any,
  distribution: Record<string, number>
): string[] {
  const recommendations: string[] = []
  const totalRequests = stats.hits + stats.misses

  // Hit rate recommendations
  if (totalRequests > 100) {
    if (stats.hitRate < 0.5) {
      recommendations.push(
        'LOW HIT RATE: Consider increasing TTL values or reviewing cache key strategies'
      )
    } else if (stats.hitRate > 0.9) {
      recommendations.push(
        'EXCELLENT HIT RATE: Cache is performing very well, consider extending TTLs further'
      )
    }
  }

  // Eviction recommendations
  const evictionRate = totalRequests > 0 ? stats.evictions / totalRequests : 0
  if (evictionRate > 0.1) {
    recommendations.push(
      'HIGH EVICTION RATE: Consider increasing cache size limit or reducing TTLs'
    )
  }

  // Size recommendations
  if (stats.size > 900) {
    recommendations.push(
      'CACHE NEAR CAPACITY: Consider increasing maxSize to prevent excessive evictions'
    )
  } else if (stats.size < 100 && totalRequests > 1000) {
    recommendations.push(
      'LOW CACHE UTILIZATION: Cache size is underutilized, verify caching is enabled for all endpoints'
    )
  }

  // Memory recommendations
  const memoryMB = stats.memoryUsage / 1024 / 1024
  if (memoryMB > 100) {
    recommendations.push(
      `HIGH MEMORY USAGE: Cache is using ${memoryMB.toFixed(2)}MB, consider reducing TTLs or cache size`
    )
  }

  // Distribution recommendations
  const totalKeys = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  Object.entries(distribution).forEach(([prefix, count]) => {
    const percentage = (count / totalKeys) * 100
    if (percentage > 50) {
      recommendations.push(
        `IMBALANCED CACHE: ${prefix} represents ${percentage.toFixed(1)}% of cache entries, consider separate cache instances`
      )
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('Cache is performing optimally - no recommendations')
  }

  return recommendations
}
