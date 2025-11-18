import { NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { ProjectsQuerySchema } from '@/lib/schemas/projects'
import { db } from '@/lib/drizzle/db'
import { energyProjects } from '@/lib/drizzle/schema-energy'
import { and, eq, ilike, or, sql } from 'drizzle-orm'

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 120
type RateLimitEntry = { count: number; expiresAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || forwardedFor
  }
  return request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip') ?? 'unknown'
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.expiresAt <= now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: current.expiresAt - now }
  }

  current.count += 1
  rateLimitStore.set(key, current)
  return { allowed: true }
}

function mapProjectRecord(record: Record<string, unknown>) {
  const toNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value))

  return {
    id: record.id,
    name: record.name,
    type: record.type,
    developer: record.developer,
    owner_type: record.owner_type,
    state: record.state,
    county: record.county,
    region: record.region,
    country: record.country,
    latitude: toNumber(record.latitude),
    longitude: toNumber(record.longitude),
    capacity_mw: toNumber(record.capacity_mw),
    energy_source: record.energy_source,
    technology_type: record.technology_type,
    status: record.status,
    operational: record.operational,
    year_completed: record.year_completed,
    investment: record.investment,
    annual_revenue_potential: record.annual_revenue_potential,
    carbon_avoided_tons_per_year: record.carbon_avoided_tons_per_year,
  }
}

async function fetchProjects(params: {
  limit: number
  offset: number
  type?: string
  status?: string
  country?: string
  search?: string
}) {
  const { limit, offset, type, status, country, search } = params
  const conditions = []

  if (type) conditions.push(eq(energyProjects.projectType, type))
  if (status) conditions.push(eq(energyProjects.status, status))
  if (country) conditions.push(eq(energyProjects.country, country))
  if (search) {
    const searchPattern = `%${search}%`
    conditions.push(
      or(
        ilike(energyProjects.name, searchPattern),
        ilike(energyProjects.state, searchPattern),
        ilike(energyProjects.developer, searchPattern)
      )
    )
  }

  const whereClause = conditions.length ? and(...conditions) : undefined

  const projectsQuery = await db
    .select({
      id: energyProjects.id,
      name: energyProjects.name,
      type: energyProjects.projectType,
      developer: energyProjects.developer,
      owner_type: energyProjects.owner,
      state: energyProjects.state,
      county: energyProjects.city,
      region: energyProjects.state,
      country: energyProjects.country,
      latitude: energyProjects.latitude,
      longitude: energyProjects.longitude,
      capacity_mw: energyProjects.capacityMw,
      energy_source: energyProjects.projectType,
      technology_type: energyProjects.subType,
      status: energyProjects.status,
      operational: energyProjects.status,
      year_completed: energyProjects.codDate,
      investment: energyProjects.totalCostMillion,
      annual_revenue_potential: energyProjects.annualGenerationGwh,
      carbon_avoided_tons_per_year: energyProjects.co2AvoidedTonsYear,
    })
    .from(energyProjects)
    .where(whereClause)
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(energyProjects)
    .where(whereClause)

  const metadataTypes = await db
    .selectDistinct({ type: energyProjects.projectType })
    .from(energyProjects)
    .where(sql`${energyProjects.projectType} IS NOT NULL`)

  const metadataStatuses = await db
    .selectDistinct({ status: energyProjects.status })
    .from(energyProjects)
    .where(sql`${energyProjects.status} IS NOT NULL`)

  const metadataCountries = await db
    .selectDistinct({ country: energyProjects.country })
    .from(energyProjects)
    .where(sql`${energyProjects.country} IS NOT NULL`)
    .limit(50)

  return {
    projects: projectsQuery.map(mapProjectRecord),
    total: countResult[0]?.count ?? 0,
    metadata: {
      types: metadataTypes.map((row) => row.type).filter(Boolean),
      statuses: metadataStatuses.map((row) => row.status).filter(Boolean),
      countries: metadataCountries.map((row) => row.country).filter(Boolean),
    },
  }
}

export async function GET(request: Request) {
  const clientKey = getClientKey(request)
  const rateLimit = checkRateLimit(clientKey)

  if (!rateLimit.allowed) {
    const headers: Record<string, string> = {}
    if (rateLimit.retryAfterMs !== undefined) {
      headers['Retry-After'] = Math.ceil(rateLimit.retryAfterMs / 1000).toString()
    }

    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers,
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const rawQuery = {
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  }
  const parsedQuery = ProjectsQuerySchema.safeParse(rawQuery)

  if (!parsedQuery.success) {
    logger.warn({
      message: 'Invalid /api/projects query',
      context: { issues: parsedQuery.error.issues },
    })

    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        issues: parsedQuery.error.issues,
      },
      { status: 400 }
    )
  }

  const { limit, offset, type, status, country, search } = parsedQuery.data

  try {
    const payload = await fetchProjects({
      limit,
      offset,
      type,
      status,
      country,
      search,
    })

    return NextResponse.json(payload)
  } catch (error) {
    logger.error('Projects API error', error)

    return NextResponse.json(
      {
        projects: [],
        total: 0,
        metadata: {
          types: ['Solar', 'Wind', 'Hydro', 'Battery', 'Nuclear', 'Other'],
          statuses: ['Planning', 'Construction', 'Operational', 'Proposed'],
          countries: ['United States', 'China', 'India', 'Germany', 'Japan', 'Brazil'],
        },
        error: 'Database temporarily unavailable',
      },
      { status: 503 }
    )
  }
}
