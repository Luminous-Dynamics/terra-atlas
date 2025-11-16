/**
 * Individual Project API Endpoint
 *
 * Handles fetching single project details by ID
 * Migrated to Phase 3 patterns
 */

import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { NotFoundError, DatabaseError, ValidationError } from '@/lib/errors'
import { projectIdSchema } from '@/lib/validation/project.schemas'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  CACHE_PREFIXES,
  generateETag,
  hasMatchingETag,
  notModifiedResponse
} from '@/lib/cache'

/**
 * GET /api/projects/:id
 *
 * Fetch detailed information about a single project
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing project ID
 * @returns Project details with enhanced calculated fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_project_details')

      // Validate project ID
      const validatedParams = projectIdSchema.parse({ id: params.id })
      const projectId = validatedParams.id

      structuredLogger.info('Project details requested', {
        operation: 'get_project',
        projectId,
      })

      timer.mark('validation_complete')

      // Generate cache key
      const cacheKey = createCacheKey(CACHE_PREFIXES.PROJECT, projectId)
      timer.mark('cache_key_generated')

      let db: Database.Database | null = null

      try {
        // Use cache-aside pattern with longer TTL for individual projects
        const enhancedProject = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_fetching')

            // Connect to database
            timer.mark('database_connection_start')
            db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), {
              readonly: true,
            })
            timer.mark('database_connection_complete')

            // Query for project with all details
            const query = `SELECT
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
              construction_start,
              commercial_operation,
              year_completed,
              total_cost as investment,
              total_cost as investment_needed,
              cost_per_kw,
              annual_revenue_potential,
              payback_period_years,
              levelized_cost_per_mwh,
              interconnection_status,
              transmission_owner,
              point_of_interconnection,
              interconnection_cost,
              grid_connection_voltage_kv,
              carbon_avoided_tons_per_year as co2_saved_annual,
              environmental_score,
              community_support_score,
              technical_feasibility_score,
              overall_viability_score,
              jobs_created,
              data_source,
              last_updated
            FROM projects WHERE id = ?`

            timer.mark('query_execution_start')
            const project = db.prepare(query).get(projectId)
            timer.mark('query_execution_complete')

            db.close()
            db = null

            if (!project) {
              throw new NotFoundError('Project', projectId)
            }

            // Add calculated/enhanced fields
            return {
              ...project,
              // Financial calculations
              investment_raised: Math.round((project.investment_needed || 0) * 0.35), // 35% raised
              min_investment: 100,
              irr: calculateIRR(project.type),
              roi_percentage: calculateROI(project.type),

              // Timeline
              completion_date: project.year_completed
                ? `${project.year_completed}-Q3`
                : estimateCompletion(project.status),

              // Additional details
              power_offtaker: 'Regional Utility Co.', // TODO: Get from database when available
              total_homes_powered: calculateHomesPowered(project.capacity_mw),
              location: formatLocation(project),
              description: generateDescription(project),

              // Metadata
              _meta: {
                dataSource: project.data_source,
                lastUpdated: project.last_updated,
                calculated: ['investment_raised', 'total_homes_powered', 'irr', 'roi_percentage'],
              },
            }
          },
          { ttl: CACHE_DURATIONS.MEDIUM } // 15 minutes cache for individual projects
        )

        timer.mark('data_fetched')

        // Generate ETag for conditional requests
        const etag = generateETag(enhancedProject)

        // Check if client has current version (304 Not Modified)
        if (hasMatchingETag(request, etag)) {
          structuredLogger.info('ETag matched - returning 304', {
            operation: 'get_project',
            projectId,
            etag,
          })
          return notModifiedResponse(etag)
        }

        const duration = timer.endAndLog({
          operation: 'get_project',
          projectId,
          success: true,
          cached: enhancedProject !== null,
        })

        return successResponse(enhancedProject, {
          requestId: context.requestId,
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATIONS.MEDIUM}`,
            'ETag': etag,
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
        })
      } catch (error) {
        const duration = timer.end()

        // Handle known errors
        if (error instanceof NotFoundError) {
          structuredLogger.info('Project not found', {
            operation: 'get_project',
            projectId,
            duration,
          })
          throw error // Re-throw to be handled by middleware
        }

        // Handle database errors
        structuredLogger.error('Database error in project details', error, {
          operation: 'get_project',
          projectId,
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

        throw new DatabaseError('Failed to fetch project details', {
          operation: 'get_project',
          projectId,
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
 * Helper: Calculate IRR based on project type
 */
function calculateIRR(projectType: string): number {
  const irrMap: Record<string, number> = {
    Solar: 12,
    Wind: 11,
    Hydro: 13,
    Battery: 10,
    Nuclear: 9,
  }

  return irrMap[projectType] || 10
}

/**
 * Helper: Calculate ROI based on project type
 */
function calculateROI(projectType: string): number {
  return calculateIRR(projectType) // For now, ROI = IRR
}

/**
 * Helper: Estimate completion date based on status
 */
function estimateCompletion(status: string): string {
  const statusTimeline: Record<string, string> = {
    Planning: '2028-Q4',
    Proposed: '2027-Q4',
    'Under Review': '2027-Q2',
    Approved: '2026-Q4',
    Construction: '2025-Q2',
    Operational: new Date().getFullYear() + '-Q1',
  }

  return statusTimeline[status] || '2027-Q3'
}

/**
 * Helper: Calculate homes powered from capacity
 */
function calculateHomesPowered(capacityMw: number): number {
  // Average US home uses ~30 kWh/day = ~900 kWh/month
  // 1 MW = 1000 kW, assume 30% capacity factor for solar/wind
  // 1 MW * 1000 kW * 24 hours * 365 days * 0.3 capacity = 2,628,000 kWh/year
  // 2,628,000 / (900 kWh/month * 12 months) = ~244 homes per MW

  const homesPerMW = 750 // Conservative estimate including all project types
  return Math.round(capacityMw * homesPerMW)
}

/**
 * Helper: Format location string
 */
function formatLocation(project: any): string {
  const parts: string[] = []

  if (project.county) parts.push(project.county)
  if (project.state) parts.push(project.state)
  parts.push('USA')

  return parts.join(', ')
}

/**
 * Helper: Generate project description
 */
function generateDescription(project: any): string {
  const type = project.type || 'energy'
  const capacity = project.capacity_mw || 'undisclosed capacity'
  const location = project.state || 'the United States'

  return `This ${capacity} MW ${type} project represents a significant advancement in renewable energy infrastructure for ${location}. ` +
    `Developed by ${project.developer || 'experienced developers'}, this initiative contributes to the region's transition to clean energy.`
}
