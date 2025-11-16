/**
 * Globe Visualization Data Endpoint
 *
 * Provides optimized project data for 3D globe visualization
 * Migrated to Phase 4 patterns with caching, structured logging,
 * and performance tracking
 */

import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { DatabaseError } from '@/lib/errors'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  CACHE_PREFIXES,
} from '@/lib/cache'

/**
 * GET /api/projects/globe-data
 *
 * Returns optimized project data for globe visualization with:
 * - Geolocation data (latitude, longitude)
 * - Essential project metadata
 * - Color coding by project type
 * - Size scaling by capacity
 *
 * @param request - Next.js request object
 * @returns Array of projects formatted for globe component
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_globe_data')

      structuredLogger.info('Globe data requested', {
        operation: 'get_globe_data',
      })

      // Generate cache key (no parameters for this endpoint)
      const cacheKey = createCacheKey(CACHE_PREFIXES.PROJECTS, 'globe-data')
      timer.mark('cache_key_generated')

      let db: Database.Database | null = null

      try {
        // Use cache-aside pattern with long TTL (globe data changes infrequently)
        const globeData = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_fetching')

            // Connect to database
            timer.mark('database_connection_start')
            db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
              readonly: true,
            })
            timer.mark('database_connection_complete')

            // Query for projects with geolocation data
            // Limit to top projects by capacity for performance
            const query = `
              SELECT
                id,
                project_name as name,
                project_type as type,
                latitude,
                longitude,
                capacity_mw,
                status
              FROM projects
              WHERE latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND latitude BETWEEN -90 AND 90
                AND longitude BETWEEN -180 AND 180
              ORDER BY capacity_mw DESC
              LIMIT 1000
            `

            timer.mark('query_execution_start')
            const projects = db.prepare(query).all()
            timer.mark('query_execution_complete')

            db.close()
            db = null

            // Transform data for globe component
            const formattedProjects = projects.map((project: any) => ({
              id: project.id,
              name: project.name,
              lat: project.latitude,
              lng: project.longitude,
              type: project.type || 'unknown',
              power: project.capacity_mw || 0,
              status: project.status || 'unknown',
              color: getColorByType(project.type),
              size: calculateGlobeSize(project.capacity_mw),
            }))

            structuredLogger.info('Globe data fetched from database', {
              operation: 'get_globe_data',
              projectCount: formattedProjects.length,
            })

            return {
              projects: formattedProjects,
              count: formattedProjects.length,
              _meta: {
                lastUpdated: new Date().toISOString(),
                maxProjects: 1000,
                cached: true,
              },
            }
          },
          {
            ttl: CACHE_DURATIONS.LONG, // 1 hour cache (globe data changes infrequently)
            tags: ['projects', 'globe', 'visualization']
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'get_globe_data',
          projectCount: globeData.count,
          success: true,
          cached: globeData !== null,
        })

        return successResponse(
          globeData,
          {
            requestId: context.requestId,
            headers: {
              'Cache-Control': `public, max-age=${CACHE_DURATIONS.LONG}`,
              'X-Cache-Key': cacheKey,
            },
            metadata: {
              performance: {
                cache_key_generation: timer.getMark('cache_key_generated'),
                database_connection: timer.getMark('database_connection_complete')
                  ? timer.getMark('database_connection_complete')! - timer.getMark('database_connection_start')!
                  : 0,
                query_execution: timer.getMark('query_execution_complete')
                  ? timer.getMark('query_execution_complete')! - timer.getMark('query_execution_start')!
                  : 0,
                total: duration,
              },
            },
          }
        )
      } catch (error) {
        const duration = timer.end()

        structuredLogger.error('Database error in globe data', error, {
          operation: 'get_globe_data',
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

        throw new DatabaseError('Failed to fetch globe visualization data', {
          operation: 'get_globe_data',
          originalError: error instanceof Error ? error.message : String(error),
        })
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.projects || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * Get color by project type for globe visualization
 */
function getColorByType(type: string | null): string {
  const colors: Record<string, string> = {
    Solar: '#FCD34D',      // Yellow
    Wind: '#60A5FA',       // Blue
    Hydro: '#34D399',      // Green
    Geothermal: '#F87171', // Red
    Nuclear: '#A78BFA',    // Purple
    Battery: '#FB923C',    // Orange
    Storage: '#FB923C',    // Orange
  }

  return colors[type || ''] || '#10B981' // Default emerald
}

/**
 * Calculate globe marker size based on capacity
 *
 * Scales logarithmically to prevent huge markers for large projects
 */
function calculateGlobeSize(capacityMw: number | null): number {
  if (!capacityMw || capacityMw <= 0) return 0.5

  // Logarithmic scaling for better visualization
  // Small projects (1-10 MW): 0.5-1.0
  // Medium projects (10-100 MW): 1.0-2.0
  // Large projects (100-1000 MW): 2.0-3.5
  // Mega projects (1000+ MW): 3.5-5.0

  const minSize = 0.5
  const maxSize = 5.0
  const logCapacity = Math.log10(capacityMw + 1)
  const logMin = Math.log10(1)
  const logMax = Math.log10(10000)

  const normalizedSize = (logCapacity - logMin) / (logMax - logMin)
  const size = minSize + normalizedSize * (maxSize - minSize)

  return Math.min(Math.max(size, minSize), maxSize)
}
