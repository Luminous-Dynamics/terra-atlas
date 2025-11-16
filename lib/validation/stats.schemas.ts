/**
 * Stats Validation Schemas
 *
 * Zod schemas for validating statistics-related API requests
 */

import { z } from 'zod'

/**
 * Time period options for statistics
 */
export const timePeriods = [
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'all',
] as const

/**
 * Grouping options for statistics
 */
export const groupByOptions = [
  'type',
  'status',
  'region',
  'state',
  'developer',
  'none',
] as const

/**
 * Query parameters for stats endpoint
 */
export const statsQuerySchema = z.object({
  // Refresh cache
  refresh: z.coerce
    .boolean()
    .default(false)
    .describe('Force refresh cache'),

  // Include optional data
  includeRecent: z.coerce
    .boolean()
    .default(true)
    .describe('Include recent projects'),
  includeTopDevelopers: z.coerce
    .boolean()
    .default(true)
    .describe('Include top developers'),
  includeTopRegions: z.coerce
    .boolean()
    .default(true)
    .describe('Include top regions'),

  // Limits
  topLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Limit for top lists'),
})

/**
 * Stats overview schema
 */
export const statsOverviewSchema = z.object({
  total_projects: z.number().int().min(0),
  regions: z.number().int().min(0),
  states: z.number().int().min(0),
  developers: z.number().int().min(0),
  project_types: z.number().int().min(0),
  total_capacity_mw: z.number().min(0),
  total_capacity_gw: z.number().min(0),
  avg_capacity_mw: z.number().min(0),
  min_capacity_mw: z.number().min(0),
  max_capacity_mw: z.number().min(0),
  total_investment_opportunity: z.number().min(0),
  estimated_jobs: z.number().int().min(0),
  estimated_homes_powered: z.number().int().min(0),
})

/**
 * Project type distribution schema
 */
export const projectTypeDistributionSchema = z.object({
  type: z.string(),
  count: z.number().int().min(0),
  total_capacity: z.number().min(0).nullable(),
})

/**
 * Status distribution schema
 */
export const statusDistributionSchema = z.object({
  status: z.string(),
  count: z.number().int().min(0),
})

/**
 * Regional stats schema
 */
export const regionalStatsSchema = z.object({
  region: z.string(),
  count: z.number().int().min(0),
  total_capacity: z.number().min(0).nullable(),
})

/**
 * Developer stats schema
 */
export const developerStatsSchema = z.object({
  developer: z.string(),
  projects: z.number().int().min(0),
  total_capacity: z.number().min(0).nullable(),
})

/**
 * Complete stats response schema
 */
export const statsResponseSchema = z.object({
  overview: statsOverviewSchema,
  by_type: z.array(projectTypeDistributionSchema),
  by_status: z.array(statusDistributionSchema),
  top_regions: z.array(regionalStatsSchema),
  top_developers: z.array(developerStatsSchema),
  recent_projects: z.array(z.any()).optional(),
  timestamp: z.string().datetime(),
  cached: z.boolean().optional(),
  cacheAge: z.number().int().min(0).optional(),
})

/**
 * Analytics query schema
 */
export const analyticsQuerySchema = z.object({
  period: z.enum(timePeriods).default('month'),
  groupBy: z.enum(groupByOptions).default('none'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectType: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
})

/**
 * Type inference helpers
 */
export type StatsQuery = z.infer<typeof statsQuerySchema>
export type StatsOverview = z.infer<typeof statsOverviewSchema>
export type ProjectTypeDistribution = z.infer<typeof projectTypeDistributionSchema>
export type StatusDistribution = z.infer<typeof statusDistributionSchema>
export type RegionalStats = z.infer<typeof regionalStatsSchema>
export type DeveloperStats = z.infer<typeof developerStatsSchema>
export type StatsResponse = z.infer<typeof statsResponseSchema>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>

/**
 * Validation helper functions
 */
export function validateStatsQuery(query: unknown): StatsQuery {
  return statsQuerySchema.parse(query)
}

export function validateAnalyticsQuery(query: unknown): AnalyticsQuery {
  return analyticsQuerySchema.parse(query)
}
