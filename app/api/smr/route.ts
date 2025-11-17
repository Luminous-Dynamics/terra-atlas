/**
 * Small Modular Reactor (SMR) Projects API Endpoint
 *
 * Provides access to SMR nuclear project data with filtering and aggregated statistics
 * Migrated to Phase 4 patterns with caching, structured logging, and performance tracking
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import smrData from '@/data/smr-projects.json'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  CACHE_PREFIXES,
} from '@/lib/cache'

/**
 * SMR query parameters schema
 */
const smrQuerySchema = z.object({
  developer: z.string().max(200).optional().describe('Filter by developer name'),
  status: z
    .enum(['Construction', 'Development', 'Planning', 'Operational'])
    .optional()
    .describe('Filter by project status'),
  country: z.string().max(100).optional().describe('Filter by country'),
  minInvestment: z.coerce.number().positive().optional().describe('Minimum investment amount'),
  maxInvestment: z.coerce.number().positive().optional().describe('Maximum investment amount'),
  investmentType: z
    .enum(['Equity', 'Debt', 'Grant', 'Mixed'])
    .optional()
    .describe('Filter by investment type'),
  sort: z
    .enum(['roi', 'capacity', 'investment', 'needed', 'completion'])
    .default('roi')
    .describe('Sort order'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Results per page'),
  offset: z.coerce.number().int().min(0).default(0).describe('Pagination offset'),
})

/**
 * SMR project ID schema
 */
const smrIdSchema = z.object({
  id: z.string().min(1).describe('SMR project ID'),
})

/**
 * GET /api/smr
 *
 * Fetch SMR projects with filtering, sorting, and pagination
 * Includes aggregated statistics
 *
 * @param request - Next.js request object
 * @returns Paginated SMR projects with stats
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_smr_projects')

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())

      structuredLogger.info('SMR projects requested', {
        operation: 'get_smr_projects',
        params: queryParams,
      })

      // Validate query parameters
      const validated = smrQuerySchema.parse(queryParams)
      const {
        developer,
        status,
        country,
        minInvestment,
        maxInvestment,
        investmentType,
        sort,
        limit,
        offset,
      } = validated

      timer.mark('validation_complete')

      // Generate cache key
      const cacheKey = createCacheKey(
        'smr',
        'list',
        { developer, status, country, minInvestment, maxInvestment, investmentType, sort, limit, offset }
      )

      timer.mark('cache_key_generated')

      try {
        // Use cache-aside pattern with medium TTL (SMR data changes occasionally)
        const smrResponse = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_processing')

            // Start with all projects
            let projects = [...smrData.smr_projects]

            // Apply filters
            if (developer) {
              projects = projects.filter((p: any) =>
                p.developer.toLowerCase().includes(developer.toLowerCase())
              )
            }

            if (status) {
              projects = projects.filter((p: any) => p.status === status)
            }

            if (country) {
              projects = projects.filter((p: any) => p.country.toLowerCase() === country.toLowerCase())
            }

            if (minInvestment !== undefined) {
              projects = projects.filter((p: any) => p.min_investment >= minInvestment)
            }

            if (maxInvestment !== undefined) {
              projects = projects.filter((p: any) => p.min_investment <= maxInvestment)
            }

            if (investmentType) {
              projects = projects.filter((p: any) => p.investment_type === investmentType)
            }

            // Apply sorting
            projects.sort((a: any, b: any) => {
              switch (sort) {
                case 'roi':
                  return b.roi_percentage - a.roi_percentage
                case 'capacity':
                  return b.capacity_mw - a.capacity_mw
                case 'investment':
                  return b.total_investment - a.total_investment
                case 'needed':
                  return b.investment_needed - a.investment_needed
                case 'completion':
                  return a.commercial_operation.localeCompare(b.commercial_operation)
                default:
                  return 0
              }
            })

            timer.mark('filtering_complete')

            // Apply pagination
            const total = projects.length
            const paginatedProjects = projects.slice(offset, offset + limit)

            // Calculate aggregated stats
            const stats = {
              total_projects: smrData.smr_projects.length,
              filtered_projects: total,
              total_capacity_mw: smrData.metadata.total_capacity_mw,
              total_investment_needed: smrData.metadata.total_investment_needed,
              average_roi: smrData.metadata.average_roi,
              countries: [...new Set(smrData.smr_projects.map((p: any) => p.country))].length,
              developers: [...new Set(smrData.smr_projects.map((p: any) => p.developer))].length,
              status_breakdown: {
                construction: smrData.smr_projects.filter((p: any) => p.status === 'Construction').length,
                development: smrData.smr_projects.filter((p: any) => p.status === 'Development').length,
                planning: smrData.smr_projects.filter((p: any) => p.status === 'Planning').length,
                operational: smrData.smr_projects.filter((p: any) => p.status === 'Operational').length,
              },
            }

            structuredLogger.info('SMR projects filtered', {
              operation: 'get_smr_projects',
              totalProjects: total,
              returnedProjects: paginatedProjects.length,
              filters: { developer, status, country },
            })

            return {
              projects: paginatedProjects,
              stats,
              pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
              },
              _meta: {
                cached: true,
                dataSource: 'smr-projects.json',
                lastUpdated: smrData.metadata.last_updated,
              },
            }
          },
          {
            ttl: CACHE_DURATIONS.MEDIUM, // 15 minutes cache
            tags: ['smr', 'projects']
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'get_smr_projects',
          projectCount: smrResponse.projects.length,
          success: true,
        })

        return successResponse(smrResponse, {
          requestId: context.requestId,
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATIONS.MEDIUM}`,
            'X-Cache-Key': cacheKey,
          },
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              filtering: timer.getMark('filtering_complete')
                ? timer.getMark('filtering_complete')! - timer.getMark('cache_miss_processing')!
                : 0,
              total: duration,
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        // Handle validation errors
        if (error instanceof ValidationError) {
          structuredLogger.info('SMR query validation error', {
            operation: 'get_smr_projects',
            error: error.message,
            duration,
          })
          throw error
        }

        // Handle unexpected errors
        structuredLogger.error('Error fetching SMR projects', error, {
          operation: 'get_smr_projects',
          duration,
        })

        throw new Error('Failed to fetch SMR projects')
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.projects || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * POST /api/smr
 *
 * Get specific SMR project by ID
 * Note: Using POST for backward compatibility, should be GET /api/smr/:id in REST
 *
 * @param request - Next.js request object
 * @returns Single SMR project details
 */
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_smr_project_by_id')

      // Parse request body
      const body = await request.json()

      structuredLogger.info('SMR project by ID requested', {
        operation: 'get_smr_project_by_id',
        requestBody: body,
      })

      // Validate ID
      const validated = smrIdSchema.parse(body)
      const { id } = validated

      timer.mark('validation_complete')

      // Generate cache key
      const cacheKey = createCacheKey('smr', 'project', id)

      try {
        // Use cache-aside pattern
        const project = await withCache(
          cacheKey,
          async () => {
            timer.mark('cache_miss_fetching')

            // Find project by ID
            const foundProject = smrData.smr_projects.find((p: any) => p.id === id)

            if (!foundProject) {
              throw new NotFoundError('SMR Project', id)
            }

            return foundProject
          },
          {
            ttl: CACHE_DURATIONS.LONG, // 1 hour cache for individual projects
            tags: ['smr', 'project']
          }
        )

        timer.mark('data_fetched')

        const duration = timer.endAndLog({
          operation: 'get_smr_project_by_id',
          projectId: id,
          success: true,
        })

        return successResponse(project, {
          requestId: context.requestId,
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATIONS.LONG}`,
            'X-Cache-Key': cacheKey,
          },
          metadata: {
            performance: {
              validation: timer.getMark('validation_complete'),
              total: duration,
            },
          },
        })
      } catch (error) {
        const duration = timer.end()

        // Handle not found errors
        if (error instanceof NotFoundError) {
          structuredLogger.info('SMR project not found', {
            operation: 'get_smr_project_by_id',
            projectId: id,
            duration,
          })
          throw error
        }

        // Handle validation errors
        if (error instanceof ValidationError) {
          structuredLogger.info('SMR project ID validation error', {
            operation: 'get_smr_project_by_id',
            error: error.message,
            duration,
          })
          throw error
        }

        // Handle unexpected errors
        structuredLogger.error('Error fetching SMR project', error, {
          operation: 'get_smr_project_by_id',
          projectId: id,
          duration,
        })

        throw new Error('Failed to fetch SMR project')
      }
    },
    {
      rateLimit: RATE_LIMITS.api?.projects || { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}
