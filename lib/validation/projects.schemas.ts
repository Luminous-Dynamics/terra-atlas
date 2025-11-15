/**
 * Project Validation Schemas
 *
 * Zod schemas for all project-related API endpoints
 */

import { z } from 'zod'
import {
  paginationQuerySchema,
  searchQuerySchema,
  dbIdSchema,
  dbIdStringSchema,
  sortOrderSchema,
} from './common.schemas'
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
} from '../constants'

// ============================================================================
// Project Query Schemas
// ============================================================================

/**
 * Get projects query parameters
 */
export const getProjectsQuerySchema = paginationQuerySchema.extend({
  type: z
    .enum([
      PROJECT_TYPES.SOLAR,
      PROJECT_TYPES.WIND,
      PROJECT_TYPES.HYDRO,
      PROJECT_TYPES.GEOTHERMAL,
      PROJECT_TYPES.BIOMASS,
      PROJECT_TYPES.TIDAL,
      PROJECT_TYPES.HYDROGEN,
      PROJECT_TYPES.STORAGE,
    ])
    .optional(),
  status: z
    .enum([
      PROJECT_STATUSES.PLANNING,
      PROJECT_STATUSES.FUNDING,
      PROJECT_STATUSES.CONSTRUCTION,
      PROJECT_STATUSES.OPERATIONAL,
      PROJECT_STATUSES.COMPLETED,
      PROJECT_STATUSES.CANCELLED,
      PROJECT_STATUSES.ON_HOLD,
    ])
    .optional(),
  country: z
    .string()
    .min(2)
    .max(100)
    .optional(),
  region: z
    .string()
    .min(2)
    .max(100)
    .optional(),
  search: searchQuerySchema.optional(),
  minCapacity: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  maxCapacity: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  minIRR: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(100).optional()),
  maxIRR: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(100).optional()),
  sortBy: z
    .enum(['name', 'capacity', 'irr', 'createdAt', 'updatedAt'])
    .default('createdAt')
    .optional(),
  sortOrder: sortOrderSchema.default('desc').optional(),
})

export type GetProjectsQuery = z.infer<typeof getProjectsQuerySchema>

/**
 * Get project by ID parameter
 */
export const getProjectByIdSchema = z.object({
  id: dbIdStringSchema,
})

export type GetProjectById = z.infer<typeof getProjectByIdSchema>

// ============================================================================
// Project Creation Schemas
// ============================================================================

/**
 * Create project request body
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(200, 'Project name must be at most 200 characters'),
  type: z.enum([
    PROJECT_TYPES.SOLAR,
    PROJECT_TYPES.WIND,
    PROJECT_TYPES.HYDRO,
    PROJECT_TYPES.GEOTHERMAL,
    PROJECT_TYPES.BIOMASS,
    PROJECT_TYPES.TIDAL,
    PROJECT_TYPES.HYDROGEN,
    PROJECT_TYPES.STORAGE,
  ]),
  status: z
    .enum([
      PROJECT_STATUSES.PLANNING,
      PROJECT_STATUSES.FUNDING,
      PROJECT_STATUSES.CONSTRUCTION,
      PROJECT_STATUSES.OPERATIONAL,
      PROJECT_STATUSES.COMPLETED,
      PROJECT_STATUSES.CANCELLED,
      PROJECT_STATUSES.ON_HOLD,
    ])
    .default(PROJECT_STATUSES.PLANNING),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  developer: z
    .string()
    .min(2, 'Developer name must be at least 2 characters')
    .max(200, 'Developer name must be at most 200 characters')
    .optional(),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be at most 100 characters'),
  region: z
    .string()
    .max(100, 'Region must be at most 100 characters')
    .optional(),
  state: z
    .string()
    .max(100, 'State must be at most 100 characters')
    .optional(),
  county: z
    .string()
    .max(100, 'County must be at most 100 characters')
    .optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  capacityMW: z
    .number()
    .positive('Capacity must be positive')
    .max(100000, 'Capacity must be at most 100,000 MW')
    .optional(),
  totalCost: z
    .number()
    .positive('Total cost must be positive')
    .max(1000000000000, 'Total cost too large')
    .optional(),
  irr: z
    .number()
    .min(0, 'IRR must be at least 0')
    .max(100, 'IRR must be at most 100')
    .optional(),
  paybackPeriodYears: z
    .number()
    .positive('Payback period must be positive')
    .max(100, 'Payback period must be at most 100 years')
    .optional(),
  riskLevel: z
    .enum([
      PROJECT_RISK_LEVELS.LOW,
      PROJECT_RISK_LEVELS.MEDIUM,
      PROJECT_RISK_LEVELS.HIGH,
      PROJECT_RISK_LEVELS.VERY_HIGH,
    ])
    .optional(),
  technologyType: z
    .string()
    .max(200, 'Technology type must be at most 200 characters')
    .optional(),
  energySource: z
    .string()
    .max(200, 'Energy source must be at most 200 characters')
    .optional(),
  operational: z
    .boolean()
    .default(false),
  yearCompleted: z
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(2100, 'Year must be before 2100')
    .optional(),
  annualRevenuePotential: z
    .number()
    .positive('Annual revenue must be positive')
    .optional(),
  carbonAvoidedTonsPerYear: z
    .number()
    .positive('Carbon avoided must be positive')
    .optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// ============================================================================
// Project Update Schemas
// ============================================================================

/**
 * Update project request body (all fields optional)
 */
export const updateProjectSchema = createProjectSchema.partial()

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

/**
 * Update project with ID
 */
export const updateProjectWithIdSchema = z.object({
  id: dbIdSchema,
  data: updateProjectSchema,
})

export type UpdateProjectWithId = z.infer<typeof updateProjectWithIdSchema>

// ============================================================================
// Project Search Schemas
// ============================================================================

/**
 * Advanced project search
 */
export const searchProjectsSchema = z.object({
  query: searchQuerySchema,
  filters: z.object({
    types: z
      .array(z.enum([
        PROJECT_TYPES.SOLAR,
        PROJECT_TYPES.WIND,
        PROJECT_TYPES.HYDRO,
        PROJECT_TYPES.GEOTHERMAL,
        PROJECT_TYPES.BIOMASS,
        PROJECT_TYPES.TIDAL,
        PROJECT_TYPES.HYDROGEN,
        PROJECT_TYPES.STORAGE,
      ]))
      .optional(),
    statuses: z
      .array(z.enum([
        PROJECT_STATUSES.PLANNING,
        PROJECT_STATUSES.FUNDING,
        PROJECT_STATUSES.CONSTRUCTION,
        PROJECT_STATUSES.OPERATIONAL,
        PROJECT_STATUSES.COMPLETED,
        PROJECT_STATUSES.CANCELLED,
        PROJECT_STATUSES.ON_HOLD,
      ]))
      .optional(),
    countries: z
      .array(z.string())
      .optional(),
    minCapacity: z
      .number()
      .positive()
      .optional(),
    maxCapacity: z
      .number()
      .positive()
      .optional(),
    minIRR: z
      .number()
      .min(0)
      .max(100)
      .optional(),
    maxIRR: z
      .number()
      .min(0)
      .max(100)
      .optional(),
  }).optional(),
  pagination: paginationQuerySchema.optional(),
})

export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>

// ============================================================================
// Project Analytics Schemas
// ============================================================================

/**
 * Get project statistics
 */
export const getProjectStatsSchema = z.object({
  groupBy: z
    .enum(['type', 'status', 'country', 'region', 'year'])
    .optional(),
  timeRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
})

export type GetProjectStatsInput = z.infer<typeof getProjectStatsSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate coordinates
 */
export function validateCoordinates(
  latitude?: number,
  longitude?: number
): boolean {
  if (latitude === undefined || longitude === undefined) {
    return true // Optional coordinates
  }

  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/**
 * Validate capacity range
 */
export function validateCapacityRange(
  minCapacity?: number,
  maxCapacity?: number
): { valid: boolean; error?: string } {
  if (minCapacity === undefined || maxCapacity === undefined) {
    return { valid: true }
  }

  if (minCapacity > maxCapacity) {
    return {
      valid: false,
      error: 'Minimum capacity must be less than maximum capacity',
    }
  }

  return { valid: true }
}

/**
 * Validate IRR range
 */
export function validateIRRRange(
  minIRR?: number,
  maxIRR?: number
): { valid: boolean; error?: string } {
  if (minIRR === undefined || maxIRR === undefined) {
    return { valid: true }
  }

  if (minIRR > maxIRR) {
    return {
      valid: false,
      error: 'Minimum IRR must be less than maximum IRR',
    }
  }

  return { valid: true }
}
