/**
 * Project Search API Endpoint
 *
 * Full-text search across projects with advanced filtering
 * Migrated to Phase 4 patterns with caching, structured logging,
 * and performance tracking
 */

import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { z } from 'zod'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { DatabaseError, ValidationError } from '@/lib/errors'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  CACHE_PREFIXES,
} from '@/lib/cache'
import { projectTypes, projectStatuses } from '@/lib/validation/project.schemas'

/**
 * Search query parameters schema
 */
const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional().describe('Search query'),
  types: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(projectTypes)).optional())
    .describe('Project types (comma-separated)'),
  statuses: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(projectStatuses)).optional())
    .describe('Project statuses (comma-separated)'),
  countries: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.string().max(100)).optional())
    .describe('Countries/states (comma-separated)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('Results limit'),
})

/**
 * GET /api/projects/search
 *
 * Full-text search across projects with filtering and relevance ranking
 *
 * @param request - Next.js request object
 * @returns Ranked search results with metadata
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('search_projects')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      structuredLogger.info('Project search requested', {
        operation: 'search_projects',
        params: queryParams,
      })

      // Validate query parameters
      const validated = searchQuerySchema.parse(queryParams)
      const { q: query, types, statuses, countries, limit } = validated

      timer.mark('validation_complete')

      // Throw error if no search criteria provided
      if (!query && (!types || types.length === 0) && (!statuses || statuses.length === 0) && (!countries || countries.length === 0)) {
        throw new ValidationError('At least one search parameter (q, types, statuses, or countries) is required')
      }

      // Generate cache key from search parameters
      const cacheKey = createCacheKey(
        CACHE_PREFIXES.PROJECTS,
        'search',
        { query, types, statuses, countries, limit }
      )

      timer.mark('cache_key_generated')

      let db: Database.Database | null = null

      try {
        // Use cache-aside pattern with short TTL (search results change frequently)
        const searchResults = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_fetching')

            // Connect to database
            timer.mark('database_connection_start')
            db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
              readonly: true,
            })
            timer.mark('database_connection_complete')

            // Build dynamic query
            let sql = `SELECT
              id,
              project_name as name,
              project_type as type,
              developer,
              owner_type,
              state,
              county,
              region,
              latitude,
              longitude,
              capacity_mw,
              energy_source,
              technology_type,
              status,
              operational,
              year_completed,
              total_cost as investment,
              annual_revenue_potential,
              carbon_avoided_tons_per_year as co2_saved_annual
            FROM projects WHERE 1=1`

            const params: any[] = []

            // Text search across multiple fields
            if (query) {
              sql += ` AND (
                project_name LIKE ? OR
                developer LIKE ? OR
                state LIKE ? OR
                county LIKE ? OR
                region LIKE ? OR
                project_type LIKE ?
              )`
              const searchPattern = `%${query}%`
              params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
            }

            // Type filter
            if (types && types.length > 0) {
              sql += ` AND project_type IN (${types.map(() => '?').join(',')})`
              params.push(...types)
            }

            // Status filter
            if (statuses && statuses.length > 0) {
              sql += ` AND status IN (${statuses.map(() => '?').join(',')})`
              params.push(...statuses)
            }

            // Country/state filter
            if (countries && countries.length > 0) {
              sql += ` AND state IN (${countries.map(() => '?').join(',')})`
              params.push(...countries)
            }

            // Order by relevance (simple scoring based on match position)
            if (query) {
              sql += ` ORDER BY
                CASE
                  WHEN project_name LIKE ? THEN 1
                  WHEN developer LIKE ? THEN 2
                  WHEN state LIKE ? THEN 3
                  ELSE 4
                END,
                capacity_mw DESC`
              params.push(`${query}%`, `${query}%`, `${query}%`)
            } else {
              sql += ' ORDER BY capacity_mw DESC'
            }

            // Add limit
            sql += ` LIMIT ?`
            params.push(limit)

            // Execute query
            timer.mark('query_execution_start')
            const results = db.prepare(sql).all(...params)
            timer.mark('query_execution_complete')

            db.close()
            db = null

            structuredLogger.info('Search completed', {
              operation: 'search_projects',
              query,
              resultCount: results.length,
              filters: { types, statuses, countries },
            })

            return {
              results,
              total: results.length,
              query,
              filters: {
                types: types || [],
                statuses: statuses || [],
                countries: countries || [],
              },
              _meta: {
                cached: true,
                searchPerformed: new Date().toISOString(),
              },
            }
          },
          {
            ttl: CACHE_DURATIONS.VERY_SHORT, // 1 minute cache (search results may change)
            tags: ['projects', 'search']
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'search_projects',
          query,
          resultCount: searchResults.total,
          success: true,
          cached: searchResults !== null,
        })

        return successResponse(
          searchResults,
          {
            requestId: context.requestId,
            headers: {
              'Cache-Control': `public, max-age=${CACHE_DURATIONS.VERY_SHORT}`,
              'X-Cache-Key': cacheKey,
            },
            metadata: {
              performance: {
                validation: timer.getMark('validation_complete'),
                cache_key_generation: timer.getMark('cache_key_generated')! - timer.getMark('validation_complete')!,
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

        // Handle validation errors
        if (error instanceof ValidationError) {
          structuredLogger.info('Search validation error', {
            operation: 'search_projects',
            error: error.message,
            duration,
          })
          throw error
        }

        // Handle database errors
        structuredLogger.error('Database error in project search', error, {
          operation: 'search_projects',
          query,
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

        throw new DatabaseError('Failed to search projects', {
          operation: 'search_projects',
          query,
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
