/**
 * Projects API Endpoints
 *
 * Handles project listing and creation
 * Migrated to Phase 3 patterns with enhanced error handling,
 * structured logging, performance tracking, and standardized responses
 */

import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withMiddleware } from '@/lib/middleware'
import { successResponse, paginatedResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { DatabaseError } from '@/lib/errors'
import { listProjectsQuerySchema } from '@/lib/validation/project.schemas'
import { RATE_LIMITS } from '@/lib/config'

/**
 * GET /api/projects
 *
 * List projects with filtering, pagination, and search
 *
 * @param request - Next.js request object
 * @returns Paginated list of projects with metadata
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_projects')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      structuredLogger.info('Projects list requested', {
        operation: 'list_projects',
        params: queryParams,
      })

      // Validate query parameters with Zod
      const validated = listProjectsQuerySchema.parse(queryParams)
      const { limit, offset, type, status, country, state, search, minCapacity, maxCapacity, operational, sortBy, sortOrder } = validated

      timer.mark('validation_complete')

      let db: Database.Database | null = null

      try {
        // Connect to database
        timer.mark('database_connection_start')
        db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
          readonly: true,
        })
        timer.mark('database_connection_complete')

        // Build query with filters
        const queryParts: string[] = []
        const params: any[] = []

        // Base SELECT
        let query = `SELECT
          id,
          project_name as name,
          project_type as type,
          developer,
          owner_type,
          state,
          county,
          region,
          state as country,
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
          carbon_avoided_tons_per_year
        FROM projects WHERE 1=1`

        // Apply filters
        if (type) {
          queryParts.push('project_type = ?')
          params.push(type)
        }

        if (status) {
          queryParts.push('status = ?')
          params.push(status)
        }

        if (country) {
          queryParts.push('state = ?')
          params.push(country)
        }

        if (state) {
          queryParts.push('state = ?')
          params.push(state)
        }

        if (operational !== undefined) {
          queryParts.push('operational = ?')
          params.push(operational ? 1 : 0)
        }

        if (minCapacity !== undefined) {
          queryParts.push('capacity_mw >= ?')
          params.push(minCapacity)
        }

        if (maxCapacity !== undefined) {
          queryParts.push('capacity_mw <= ?')
          params.push(maxCapacity)
        }

        if (search) {
          queryParts.push('(project_name LIKE ? OR state LIKE ? OR developer LIKE ?)')
          const searchPattern = `%${search}%`
          params.push(searchPattern, searchPattern, searchPattern)
        }

        // Add WHERE clauses
        if (queryParts.length > 0) {
          query += ' AND ' + queryParts.join(' AND ')
        }

        // Add ORDER BY
        const sortColumn = {
          name: 'project_name',
          capacity: 'capacity_mw',
          investment: 'total_cost',
          created: 'id', // Using ID as proxy for creation date
          status: 'status',
        }[sortBy] || 'id'

        query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`

        // Add pagination
        query += ' LIMIT ? OFFSET ?'
        params.push(limit, offset)

        // Execute main query
        timer.mark('query_execution_start')
        const stmt = db.prepare(query)
        const projects = stmt.all(...params)
        timer.mark('query_execution_complete')

        // Get total count with same filters
        let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE 1=1'
        const countParams: any[] = []

        if (queryParts.length > 0) {
          countQuery += ' AND ' + queryParts.join(' AND ')
          // Copy filter params (excluding LIMIT/OFFSET)
          for (let i = 0; i < params.length - 2; i++) {
            countParams.push(params[i])
          }
        }

        timer.mark('count_query_start')
        const countStmt = db.prepare(countQuery)
        const { count } = countStmt.get(...countParams) as any
        timer.mark('count_query_complete')

        // Get metadata for filters (cached values to avoid expensive queries)
        timer.mark('metadata_query_start')
        const types = db
          .prepare('SELECT DISTINCT project_type as type FROM projects WHERE project_type IS NOT NULL ORDER BY project_type')
          .all()

        const statuses = db
          .prepare('SELECT DISTINCT status FROM projects WHERE status IS NOT NULL ORDER BY status')
          .all()

        const states = db
          .prepare('SELECT DISTINCT state FROM projects WHERE state IS NOT NULL ORDER BY state LIMIT 100')
          .all()
        timer.mark('metadata_query_complete')

        db.close()
        db = null

        const duration = timer.end()

        structuredLogger.info('Projects fetched successfully', {
          operation: 'list_projects',
          count: projects.length,
          total: count,
          duration,
          filters: { type, status, country, state, search, minCapacity, maxCapacity, operational },
        })

        // Return paginated response with metadata
        return paginatedResponse(
          projects,
          {
            total: count,
            limit,
            offset,
          },
          {
            requestId: context.requestId,
            metadata: {
              types: types.map((t: any) => t.type),
              statuses: statuses.map((s: any) => s.status),
              countries: states.map((s: any) => s.state),
              performance: {
                validation: timer.getMark('validation_complete'),
                database_connection: timer.getMark('database_connection_complete')! - timer.getMark('database_connection_start')!,
                query_execution: timer.getMark('query_execution_complete')! - timer.getMark('query_execution_start')!,
                count_query: timer.getMark('count_query_complete')! - timer.getMark('count_query_start')!,
                metadata_query: timer.getMark('metadata_query_complete')! - timer.getMark('metadata_query_start')!,
                total: duration,
              },
            },
          }
        )
      } catch (error) {
        const duration = timer.end()

        structuredLogger.error('Database error in projects route', error, {
          operation: 'list_projects',
          duration,
          filters: { type, status, country, search },
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

        // Throw DatabaseError for middleware to handle
        throw new DatabaseError('Failed to fetch projects', {
          operation: 'list_projects',
          filters: { type, status, country, search },
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
 * POST /api/projects
 *
 * DEPRECATED: Get project statistics
 * Use GET /api/stats instead
 *
 * @param request - Next.js request object
 * @returns Project statistics
 */
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_project_stats')

      structuredLogger.warn('Deprecated endpoint called', {
        operation: 'project_stats',
        endpoint: 'POST /api/projects',
        deprecation: 'Use GET /api/stats instead',
      })

      let db: Database.Database | null = null

      try {
        db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
          readonly: true,
        })

        const stats = db.prepare(`
          SELECT
            COUNT(*) as total_projects,
            SUM(capacity_mw) as total_capacity,
            COUNT(DISTINCT state) as countries,
            COUNT(DISTINCT developer) as developers,
            AVG(capacity_mw) as avg_capacity
          FROM projects
        `).get()

        db.close()
        db = null

        const duration = timer.endAndLog({
          operation: 'project_stats',
        })

        return successResponse(
          stats,
          {
            requestId: context.requestId,
            headers: {
              'X-Deprecated': 'true',
              'X-Deprecation-Message': 'Use GET /api/stats instead',
            },
            metadata: {
              deprecation: {
                deprecated: true,
                message: 'Please use GET /api/stats endpoint instead',
                sunsetDate: '2026-01-01',
              },
              performance: {
                duration,
              },
            },
          }
        )
      } catch (error) {
        const duration = timer.end()

        structuredLogger.error('Database error in project stats', error, {
          operation: 'project_stats',
          duration,
        })

        if (db) {
          try {
            db.close()
          } catch (closeError) {
            // Ignore close errors
          }
        }

        throw new DatabaseError('Failed to fetch project statistics')
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.projects || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}
