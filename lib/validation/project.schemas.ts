/**
 * Project Validation Schemas
 *
 * Zod schemas for validating project-related API requests
 */

import { z } from 'zod'

/**
 * Project types available in the system
 */
export const projectTypes = [
  'solar',
  'wind',
  'hydro',
  'battery',
  'nuclear',
  'geothermal',
  'biomass',
  'other',
] as const

/**
 * Project status values
 */
export const projectStatuses = [
  'planning',
  'proposed',
  'under-review',
  'approved',
  'construction',
  'operational',
  'completed',
  'cancelled',
  'on-hold',
] as const

/**
 * Query parameters for listing projects
 */
export const listProjectsQuerySchema = z.object({
  // Pagination
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Number of results per page'),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of results to skip'),

  // Filters
  type: z
    .enum(projectTypes)
    .optional()
    .describe('Filter by project type'),
  status: z
    .enum(projectStatuses)
    .optional()
    .describe('Filter by project status'),
  country: z.string().min(2).max(2).optional().describe('Filter by country code (ISO 3166-1 alpha-2)'),
  state: z.string().max(100).optional().describe('Filter by state/region'),
  search: z.string().max(200).optional().describe('Search in project name, developer, or location'),

  // Capacity filters
  minCapacity: z.coerce.number().positive().optional().describe('Minimum capacity in MW'),
  maxCapacity: z.coerce.number().positive().optional().describe('Maximum capacity in MW'),

  // Investment filters
  minInvestment: z.coerce.number().positive().optional().describe('Minimum investment amount'),
  maxInvestment: z.coerce.number().positive().optional().describe('Maximum investment amount'),

  // Operational status
  operational: z.coerce.boolean().optional().describe('Filter by operational status'),

  // Sorting
  sortBy: z
    .enum(['name', 'capacity', 'investment', 'created', 'status'])
    .default('created')
    .describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
})

/**
 * Location schema for projects
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90).describe('Latitude coordinate'),
  longitude: z.number().min(-180).max(180).describe('Longitude coordinate'),
  country: z.string().length(2).describe('Country code (ISO 3166-1 alpha-2)'),
  state: z.string().max(100).optional().describe('State or region'),
  county: z.string().max(100).optional().describe('County or district'),
  region: z.string().max(100).optional().describe('Geographic region'),
  address: z.string().max(500).optional().describe('Street address'),
  postalCode: z.string().max(20).optional().describe('Postal/ZIP code'),
})

/**
 * Financial data schema for projects
 */
export const financialSchema = z.object({
  totalCost: z.number().positive().describe('Total project cost'),
  fundingGoal: z.number().positive().describe('Target funding amount'),
  currentFunding: z.number().min(0).default(0).describe('Amount raised so far'),
  minimumInvestment: z.number().positive().default(10).describe('Minimum investment amount'),
  irr: z.number().min(0).max(100).optional().describe('Internal rate of return (%)'),
  annualRevenue: z.number().positive().optional().describe('Projected annual revenue'),
  paybackPeriod: z.number().positive().optional().describe('Payback period in years'),
})

/**
 * Environmental impact schema
 */
export const environmentalSchema = z.object({
  carbonAvoidedTonsPerYear: z.number().min(0).optional().describe('CO2 avoided annually (tons)'),
  treesEquivalent: z.number().min(0).optional().describe('Equivalent number of trees'),
  homesEquivalent: z.number().min(0).optional().describe('Number of homes powered'),
  waterSavedGallons: z.number().min(0).optional().describe('Water saved annually (gallons)'),
})

/**
 * Technical specifications schema
 */
export const technicalSchema = z.object({
  capacityMw: z.number().positive().describe('Power capacity in megawatts'),
  energySource: z.string().max(100).optional().describe('Primary energy source'),
  technologyType: z.string().max(100).optional().describe('Technology used'),
  yearCompleted: z.number().int().min(1900).max(2100).optional().describe('Year of completion'),
  estimatedLifespan: z.number().int().positive().optional().describe('Project lifespan in years'),
})

/**
 * Create project schema (for POST requests)
 */
export const createProjectSchema = z.object({
  // Basic information
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(200, 'Project name must be less than 200 characters')
    .describe('Project name'),
  type: z.enum(projectTypes).describe('Project type'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .describe('Project description'),

  // Organization
  developer: z.string().max(200).optional().describe('Developer company/organization'),
  ownerType: z
    .enum(['public', 'private', 'community', 'government', 'utility'])
    .optional()
    .describe('Type of project owner'),

  // Location (required)
  location: locationSchema,

  // Technical specs (required)
  technical: technicalSchema,

  // Financial data (optional for draft)
  financial: financialSchema.optional(),

  // Environmental impact (optional)
  environmental: environmentalSchema.optional(),

  // Status
  status: z.enum(projectStatuses).default('planning').describe('Current project status'),
  operational: z.boolean().default(false).describe('Is the project operational?'),

  // Metadata
  tags: z.array(z.string().max(50)).max(20).optional().describe('Project tags'),
  images: z.array(z.string().url()).max(10).optional().describe('Project image URLs'),
  documents: z.array(z.string().url()).max(20).optional().describe('Project document URLs'),
})

/**
 * Update project schema (for PATCH requests)
 * All fields are optional for partial updates
 */
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Project ID parameter schema
 */
export const projectIdSchema = z.object({
  id: z.coerce.number().int().positive().describe('Project ID'),
})

/**
 * Bulk operation schema
 */
export const bulkProjectSchema = z.object({
  projectIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(100)
    .describe('Array of project IDs'),
  action: z.enum(['approve', 'reject', 'delete', 'archive']).describe('Action to perform'),
  reason: z.string().max(500).optional().describe('Reason for bulk action'),
})

/**
 * Project search schema (advanced search)
 */
export const searchProjectsSchema = z.object({
  query: z.string().min(1).max(200).describe('Search query'),
  filters: listProjectsQuerySchema.omit({ search: true, limit: true, offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * Export request schema
 */
export const exportProjectsSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv').describe('Export format'),
  filters: listProjectsQuerySchema.omit({ limit: true, offset: true }).optional(),
  fields: z
    .array(z.string())
    .optional()
    .describe('Specific fields to include in export'),
})

/**
 * Type inference helpers
 */
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectLocation = z.infer<typeof locationSchema>
export type ProjectFinancial = z.infer<typeof financialSchema>
export type ProjectEnvironmental = z.infer<typeof environmentalSchema>
export type ProjectTechnical = z.infer<typeof technicalSchema>
export type BulkProjectInput = z.infer<typeof bulkProjectSchema>
export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>
export type ExportProjectsInput = z.infer<typeof exportProjectsSchema>

/**
 * Validation helper function
 */
export function validateProjectQuery(query: unknown): ListProjectsQuery {
  return listProjectsQuerySchema.parse(query)
}
