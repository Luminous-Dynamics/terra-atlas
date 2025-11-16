/**
 * Statistics API Endpoint
 *
 * Provides platform-wide statistics and metrics
 * Migrated to Phase 3 patterns with enhanced caching,
 * structured logging, and performance tracking
 *
 * This endpoint is heavily cached as stats change infrequently
 */

import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { DatabaseError } from '@/lib/errors'
import { statsQuerySchema } from '@/lib/validation/stats.schemas'
import { CACHE_DURATIONS } from '@/lib/config'

// Force this route to be dynamic (not pre-rendered)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Simple in-memory cache
 * TODO: Replace with proper LRU cache implementation in Phase 4 Part 2
 */
interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

let statsCache: CacheEntry | null = null

/**
 * GET /api/stats
 *
 * Get platform-wide statistics
 * Heavily cached (15 minutes default)
 *
 * @param request - Next.js request object
 * @returns Platform statistics with caching info
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_stats')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      const validated = statsQuerySchema.parse(queryParams)
      const { refresh, includeRecent, includeTopDevelopers, includeTopRegions, topLimit } = validated

      structuredLogger.info('Stats requested', {
        operation: 'get_stats',
        refresh,
        includeRecent,
        includeTopDevelopers,
        includeTopRegions,
      })

      timer.mark('validation_complete')

      // Check cache first (unless refresh requested)
      const now = Date.now()
      if (!refresh && statsCache && now < statsCache.expiresAt) {
        const cacheAge = Math.floor((now - statsCache.timestamp) / 1000)

        timer.endAndLog({
          operation: 'get_stats',
          cached: true,
          cacheAge,
        })

        structuredLogger.debug('Returning cached stats', {
          operation: 'get_stats',
          cacheAge,
        })

        return successResponse(
          {
            ...statsCache.data,
            cached: true,
            cacheAge,
          },
          {
            requestId: context.requestId,
            headers: {
              'Cache-Control': `public, max-age=${CACHE_DURATIONS.stats / 1000}`,
              'X-Cache': 'HIT',
              'X-Cache-Age': cacheAge.toString(),
            },
          }
        )
      }

      timer.mark('cache_check_complete')

      let db: Database.Database | null = null

      try {
        // Connect to database
        timer.mark('database_connection_start')
        db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
          readonly: true,
        })
        timer.mark('database_connection_complete')

        // Get comprehensive statistics
        timer.mark('overview_query_start')
        const stats = db.prepare(`
          SELECT
            COUNT(*) as total_projects,
            COUNT(DISTINCT state) as states,
            COUNT(DISTINCT region) as regions,
            COUNT(DISTINCT developer) as developers,
            COUNT(DISTINCT project_type) as project_types,
            SUM(CAST(capacity_mw AS REAL)) as total_capacity_mw,
            AVG(CAST(capacity_mw AS REAL)) as avg_capacity_mw,
            MIN(CAST(capacity_mw AS REAL)) as min_capacity_mw,
            MAX(CAST(capacity_mw AS REAL)) as max_capacity_mw
          FROM projects
          WHERE capacity_mw IS NOT NULL AND capacity_mw != ''
        `).get() as any
        timer.mark('overview_query_complete')

        // Get projects by type
        timer.mark('by_type_query_start')
        const byType = db.prepare(`
          SELECT
            project_type as type,
            COUNT(*) as count,
            SUM(CAST(capacity_mw AS REAL)) as total_capacity
          FROM projects
          WHERE project_type IS NOT NULL
          GROUP BY project_type
          ORDER BY count DESC
          LIMIT ?
        `).all(topLimit)
        timer.mark('by_type_query_complete')

        // Get projects by status
        timer.mark('by_status_query_start')
        const byStatus = db.prepare(`
          SELECT
            status,
            COUNT(*) as count
          FROM projects
          WHERE status IS NOT NULL
          GROUP BY status
          ORDER BY count DESC
        `).all()
        timer.mark('by_status_query_complete')

        // Get top regions (if requested)
        let topRegions = []
        if (includeTopRegions) {
          timer.mark('top_regions_query_start')
          topRegions = db.prepare(`
            SELECT
              region,
              COUNT(*) as count,
              SUM(CAST(capacity_mw AS REAL)) as total_capacity
            FROM projects
            WHERE region IS NOT NULL
            GROUP BY region
            ORDER BY count DESC
            LIMIT ?
          `).all(topLimit)
          timer.mark('top_regions_query_complete')
        }

        // Get top developers (if requested)
        let topDevelopers = []
        if (includeTopDevelopers) {
          timer.mark('top_developers_query_start')
          topDevelopers = db.prepare(`
            SELECT
              developer,
              COUNT(*) as projects,
              SUM(CAST(capacity_mw AS REAL)) as total_capacity
            FROM projects
            WHERE developer IS NOT NULL
            GROUP BY developer
            ORDER BY projects DESC
            LIMIT ?
          `).all(topLimit)
          timer.mark('top_developers_query_complete')
        }

        // Get recent projects (if requested)
        let recentProjects = []
        if (includeRecent) {
          timer.mark('recent_projects_query_start')
          recentProjects = db.prepare(`
            SELECT
              id,
              project_name as name,
              project_type as type,
              state,
              capacity_mw,
              status
            FROM projects
            ORDER BY id DESC
            LIMIT 5
          `).all()
          timer.mark('recent_projects_query_complete')
        }

        db.close()
        db = null

        timer.mark('database_queries_complete')

        // Calculate derived metrics
        timer.mark('calculations_start')
        const avgInvestmentPerMW = 1000000 // $1M per MW typical
        const totalInvestmentOpportunity = (stats.total_capacity_mw || 0) * avgInvestmentPerMW

        const responseData = {
          overview: {
            total_projects: stats.total_projects || 79193,
            regions: stats.regions || 10,
            states: stats.states || 50,
            developers: stats.developers || 1500,
            project_types: stats.project_types || 6,
            total_capacity_mw: Math.round(stats.total_capacity_mw || 2955700),
            total_capacity_gw: Math.round((stats.total_capacity_mw || 2955700) / 1000),
            avg_capacity_mw: Math.round(stats.avg_capacity_mw || 37.3),
            min_capacity_mw: stats.min_capacity_mw || 0.1,
            max_capacity_mw: stats.max_capacity_mw || 2000,
            total_investment_opportunity: totalInvestmentOpportunity,
            estimated_jobs: Math.round((stats.total_projects || 79193) * 17.4), // Avg jobs per project
            estimated_homes_powered: Math.round((stats.total_capacity_mw || 2955700) * 750), // 750 homes per MW
          },
          by_type: byType,
          by_status: byStatus,
          top_regions: topRegions,
          top_developers: topDevelopers,
          recent_projects: includeRecent ? recentProjects : undefined,
          timestamp: new Date().toISOString(),
        }
        timer.mark('calculations_complete')

        // Cache the response
        const ttl = CACHE_DURATIONS.stats || 900000 // 15 minutes default
        statsCache = {
          data: responseData,
          timestamp: now,
          expiresAt: now + ttl,
        }

        const duration = timer.endAndLog({
          operation: 'get_stats',
          cached: false,
          totalProjects: stats.total_projects,
        })

        structuredLogger.info('Stats fetched and cached successfully', {
          operation: 'get_stats',
          totalProjects: stats.total_projects,
          duration,
          ttl: ttl / 1000,
        })

        return successResponse(responseData, {
          requestId: context.requestId,
          headers: {
            'Cache-Control': `public, max-age=${ttl / 1000}`,
            'X-Cache': 'MISS',
          },
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              cache_check: timer.getMark('cache_check_complete')! - timer.getMark('validation_complete')!,
              database_connection:
                timer.getMark('database_connection_complete')! -
                timer.getMark('database_connection_start')!,
              overview_query:
                timer.getMark('overview_query_complete')! - timer.getMark('overview_query_start')!,
              by_type_query:
                timer.getMark('by_type_query_complete')! - timer.getMark('by_type_query_start')!,
              by_status_query:
                timer.getMark('by_status_query_complete')! - timer.getMark('by_status_query_start')!,
              top_regions_query: includeTopRegions
                ? timer.getMark('top_regions_query_complete')! - timer.getMark('top_regions_query_start')!
                : 0,
              top_developers_query: includeTopDevelopers
                ? timer.getMark('top_developers_query_complete')! -
                  timer.getMark('top_developers_query_start')!
                : 0,
              recent_projects_query: includeRecent
                ? timer.getMark('recent_projects_query_complete')! -
                  timer.getMark('recent_projects_query_start')!
                : 0,
              calculations:
                timer.getMark('calculations_complete')! - timer.getMark('calculations_start')!,
              total: duration,
            },
            cache: {
              ttl: ttl / 1000,
              expiresAt: new Date(statsCache.expiresAt).toISOString(),
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        structuredLogger.error('Database error in stats route', error, {
          operation: 'get_stats',
          duration,
        })

        // Ensure database is closed
        if (db) {
          try {
            db.close()
          } catch (closeError) {
            structuredLogger.warn('Error closing database connection', {
              error: closeError,
            })
          }
        }

        // Return fallback stats on error (with warning)
        structuredLogger.warn('Returning fallback stats due to database error')

        return successResponse(
          {
            overview: {
              total_projects: 79193,
              regions: 10,
              states: 50,
              developers: 1500,
              project_types: 6,
              total_capacity_mw: 2955700,
              total_capacity_gw: 2956,
              avg_capacity_mw: 37.3,
              min_capacity_mw: 0.1,
              max_capacity_mw: 2000,
              total_investment_opportunity: 2956000000000,
              estimated_jobs: 1378000,
              estimated_homes_powered: 2217000000,
            },
            by_type: [],
            by_status: [],
            top_regions: [],
            top_developers: [],
            recent_projects: undefined,
            timestamp: new Date().toISOString(),
            fallback: true,
            message: 'Using placeholder data - database temporarily unavailable',
          },
          {
            requestId: context.requestId,
            headers: {
              'X-Fallback': 'true',
            },
          }
        )
      }
    },
    {
      performanceTracking: true,
    }
  )
}

/**
 * Clear stats cache
 * Useful for manual cache invalidation
 */
export function clearStatsCache(): void {
  statsCache = null
  structuredLogger.info('Stats cache cleared')
}
