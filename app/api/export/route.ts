/**
 * Data Export API Endpoint
 *
 * Provides CSV and JSON exports of project data with filtering
 * Migrated to Phase 4 patterns with security fixes, caching,
 * and comprehensive validation
 *
 * SECURITY NOTE: Previous version had SQL injection vulnerability
 * on dynamic ORDER BY clause - now fixed with whitelist validation
 */

import { NextRequest, NextResponse } from 'next/server'
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

/**
 * Export query parameters schema
 */
const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv').describe('Export format'),
  dataset: z
    .enum(['projects', 'statistics', 'summary', 'top-projects'])
    .default('projects')
    .describe('Dataset to export'),
  limit: z.coerce.number().int().min(1).max(100000).default(10000).describe('Maximum records'),

  // Filters (for projects dataset)
  type: z.string().max(100).optional().describe('Project type filter'),
  status: z.string().max(100).optional().describe('Project status filter'),
  minCapacity: z.coerce.number().positive().optional().describe('Minimum capacity MW'),
  maxCapacity: z.coerce.number().positive().optional().describe('Maximum capacity MW'),

  // Metric (for top-projects dataset) - VALIDATED to prevent SQL injection
  metric: z
    .enum(['capacity_mw', 'total_cost', 'carbon_avoided_tons_per_year', 'jobs_created'])
    .default('capacity_mw')
    .describe('Metric for top projects ranking'),
})

/**
 * GET /api/export
 *
 * Export project data in CSV or JSON format with flexible filtering
 *
 * @param request - Next.js request object
 * @returns CSV file download or JSON data
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('export_data')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      structuredLogger.info('Data export requested', {
        operation: 'export_data',
        params: queryParams,
      })

      // Validate query parameters
      const validated = exportQuerySchema.parse(queryParams)
      const { format, dataset, limit, type, status, minCapacity, maxCapacity, metric } = validated

      timer.mark('validation_complete')

      // Log business event
      structuredLogger.logBusiness('data_export', {
        userId: context.userId,
        dataset,
        format,
        filters: { type, status, minCapacity, maxCapacity },
      })

      // Generate cache key (exports can be cached briefly)
      const cacheKey = createCacheKey(
        'export',
        dataset,
        { format, type, status, minCapacity, maxCapacity, metric, limit }
      )

      timer.mark('cache_key_generated')

      let db: Database.Database | null = null

      try {
        // Use cache-aside pattern with short TTL (export data may change)
        const exportData = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_fetching')

            // Connect to database
            timer.mark('database_connection_start')
            db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
              readonly: true,
            })
            timer.mark('database_connection_complete')

            let sql = ''
            let params: any[] = []
            let columns: string[] = []

            // Build query based on dataset
            switch (dataset) {
              case 'projects':
                sql = `SELECT
                  id,
                  project_name as name,
                  project_type as type,
                  developer,
                  owner_type as owner,
                  state,
                  state as country,
                  latitude,
                  longitude,
                  status,
                  capacity_mw,
                  annual_revenue_potential as annual_generation_gwh,
                  total_cost as investment,
                  jobs_created,
                  carbon_avoided_tons_per_year as co2_offset_tons,
                  year_completed as completion_date
                FROM projects WHERE 1=1`

                columns = [
                  'id', 'name', 'type', 'developer', 'owner', 'state', 'country',
                  'latitude', 'longitude', 'status', 'capacity_mw', 'annual_generation_gwh',
                  'investment', 'jobs_created', 'co2_offset_tons', 'completion_date'
                ]

                // Apply filters
                if (type) {
                  sql += ' AND project_type = ?'
                  params.push(type)
                }
                if (status) {
                  sql += ' AND status = ?'
                  params.push(status)
                }
                if (minCapacity !== undefined) {
                  sql += ' AND capacity_mw >= ?'
                  params.push(minCapacity)
                }
                if (maxCapacity !== undefined) {
                  sql += ' AND capacity_mw <= ?'
                  params.push(maxCapacity)
                }

                sql += ' ORDER BY capacity_mw DESC LIMIT ?'
                params.push(limit)
                break

              case 'statistics':
                // Export aggregated statistics by type
                sql = `
                  SELECT
                    project_type as type,
                    COUNT(*) as project_count,
                    SUM(capacity_mw) as total_capacity_mw,
                    AVG(capacity_mw) as avg_capacity_mw,
                    SUM(total_cost) as total_investment,
                    SUM(jobs_created) as total_jobs,
                    SUM(carbon_avoided_tons_per_year) as total_co2_offset
                  FROM projects
                  GROUP BY project_type
                  ORDER BY total_capacity_mw DESC
                `
                columns = [
                  'type', 'project_count', 'total_capacity_mw', 'avg_capacity_mw',
                  'total_investment', 'total_jobs', 'total_co2_offset'
                ]
                break

              case 'summary':
                // Export state-by-state summary
                sql = `
                  SELECT
                    state,
                    COUNT(*) as project_count,
                    COUNT(DISTINCT project_type) as technology_types,
                    SUM(capacity_mw) as total_capacity_mw,
                    SUM(total_cost) as total_investment,
                    SUM(jobs_created) as total_jobs,
                    AVG(year_completed) as avg_completion_year
                  FROM projects
                  WHERE state IS NOT NULL
                  GROUP BY state
                  ORDER BY total_capacity_mw DESC
                  LIMIT ?
                `
                params.push(limit)
                columns = [
                  'state', 'project_count', 'technology_types',
                  'total_capacity_mw', 'total_investment', 'total_jobs', 'avg_completion_year'
                ]
                break

              case 'top-projects':
                // Export top projects by metric (SAFE - metric is validated enum)
                sql = `SELECT
                  id,
                  project_name as name,
                  project_type as type,
                  developer,
                  state,
                  capacity_mw,
                  total_cost as investment,
                  jobs_created,
                  carbon_avoided_tons_per_year,
                  status
                FROM projects
                ORDER BY ${metric} DESC
                LIMIT ?`
                params.push(Math.min(limit, 100)) // Cap top projects at 100
                columns = [
                  'id', 'name', 'type', 'developer', 'state',
                  'capacity_mw', 'investment', 'jobs_created', 'carbon_avoided_tons_per_year', 'status'
                ]
                break

              default:
                // This should never happen due to Zod validation
                throw new ValidationError(`Invalid dataset: ${dataset}`)
            }

            // Execute query
            timer.mark('query_execution_start')
            const data = db.prepare(sql).all(...params)
            timer.mark('query_execution_complete')

            db.close()
            db = null

            structuredLogger.info('Export data fetched', {
              operation: 'export_data',
              dataset,
              recordCount: data.length,
            })

            return {
              data,
              columns,
              metadata: {
                dataset,
                timestamp: new Date().toISOString(),
                count: data.length,
                filters: { type, status, minCapacity, maxCapacity },
                format,
              },
            }
          },
          {
            ttl: CACHE_DURATIONS.SHORT, // 5 minutes cache
            tags: ['export', dataset]
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'export_data',
          dataset,
          format,
          recordCount: exportData.data.length,
          success: true,
        })

        // Return based on format
        if (format === 'json') {
          // JSON response
          return successResponse(
            {
              dataset: exportData.metadata.dataset,
              timestamp: exportData.metadata.timestamp,
              count: exportData.metadata.count,
              filters: exportData.metadata.filters,
              data: exportData.data,
            },
            {
              requestId: context.requestId,
              headers: {
                'Cache-Control': `public, max-age=${CACHE_DURATIONS.SHORT}`,
                'X-Cache-Key': cacheKey,
              },
              metadata: {
                performance: {
                  validation: timer.getMark('validation_complete'),
                  database_query: timer.getMark('query_execution_complete')
                    ? timer.getMark('query_execution_complete')! - timer.getMark('query_execution_start')!
                    : 0,
                  total: duration,
                },
              },
            }
          )
        } else {
          // CSV response
          const csv = convertToCSV(exportData.data, exportData.columns)
          const filename = `terra-atlas-${dataset}-${Date.now()}.csv`

          structuredLogger.info('CSV export generated', {
            operation: 'export_data',
            filename,
            size: csv.length,
          })

          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': `public, max-age=${CACHE_DURATIONS.SHORT}`,
              'X-Request-ID': context.requestId || '',
              'X-Response-Time': `${duration}ms`,
            },
          })
        }
      } catch (error) {
        const duration = timer.end()

        // Handle validation errors
        if (error instanceof ValidationError) {
          structuredLogger.info('Export validation error', {
            operation: 'export_data',
            error: error.message,
            duration,
          })
          throw error
        }

        // Handle database errors
        structuredLogger.error('Database error in export', error, {
          operation: 'export_data',
          dataset,
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

        throw new DatabaseError('Failed to export data', {
          operation: 'export_data',
          dataset,
          originalError: error instanceof Error ? error.message : String(error),
        })
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.export || { maxRequests: 10, windowMs: 60000 }, // Stricter rate limit for exports
      performanceTracking: true,
    }
  )
}

/**
 * Convert array of objects to CSV format
 *
 * Handles:
 * - Comma escaping
 * - Quote escaping
 * - Null/undefined values
 * - UTF-8 encoding
 */
function convertToCSV(data: any[], columns: string[]): string {
  // Create header row
  const header = columns.join(',')

  // Create data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col]

        // Handle null/undefined
        if (value === null || value === undefined) {
          return ''
        }

        // Convert to string
        const stringValue = String(value)

        // Handle values that contain commas, quotes, or newlines
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          // Escape quotes by doubling them
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}
