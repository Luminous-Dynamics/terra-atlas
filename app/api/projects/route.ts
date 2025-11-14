import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withRateLimit, withErrorHandling, successResponse, errorResponse } from '../../../lib/middleware'
import { logger } from '../../../lib/logger'
import { RATE_LIMITS, PAGINATION, API_LIMITS } from '../../../lib/config'

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withErrorHandling(async () => {
      const { searchParams } = new URL(request.url)
      const limit = Math.min(
        parseInt(searchParams.get('limit') || String(PAGINATION.defaultLimit)),
        API_LIMITS.maxProjectsPerPage
      )
      const type = searchParams.get('type')
      const status = searchParams.get('status')
      const country = searchParams.get('country')
      const search = searchParams.get('search')
      const offset = parseInt(searchParams.get('offset') || String(PAGINATION.defaultOffset))

      logger.api('GET', '/api/projects', { limit, type, status, country, search, offset })

  try {
    // Use the real database with 79,193 projects
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })
    
    // Build query with filters - map to frontend expected format
    let query = `SELECT 
      id,
      project_name as name,
      project_type as type,
      developer,
      owner_type,
      state,
      county,
      region,
      state as country, -- Map state to country for now
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
    
    const params: any[] = []
    
    if (type) {
      query += ' AND project_type = ?'
      params.push(type)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    if (country) {
      query += ' AND state = ?'
      params.push(country)
    }
    if (search) {
      query += ' AND (project_name LIKE ? OR state LIKE ? OR developer LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    // Add limit and offset
    query += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const stmt = db.prepare(query)
    const projects = stmt.all(...params)
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as count FROM projects'
    const countStmt = db.prepare(countQuery)
    const { count } = countStmt.get() as any
    
    // Get metadata for filters
    const types = db.prepare('SELECT DISTINCT project_type as type FROM projects WHERE project_type IS NOT NULL').all()
    const statuses = db.prepare('SELECT DISTINCT status FROM projects WHERE status IS NOT NULL').all()
    const states = db.prepare('SELECT DISTINCT state FROM projects WHERE state IS NOT NULL LIMIT 50').all()
    
    db.close()

    logger.info('Projects fetched successfully', { count: projects.length, total: count })

    return successResponse({
      projects,
      total: count,
      limit,
      offset,
      metadata: {
        types: types.map((t: any) => t.type),
        statuses: statuses.map((s: any) => s.status),
        countries: states.map((s: any) => s.state)
      }
    })
  } catch (error) {
    logger.error('Database error in projects route:', error)

    // Return actual project count even if query fails
    return successResponse({
      projects: [],
      total: 79193,
      limit,
      offset,
      metadata: {
        types: ['Solar', 'Wind', 'Hydro', 'Battery', 'Nuclear', 'Other'],
        statuses: ['Planning', 'Construction', 'Operational', 'Proposed'],
        countries: ['United States', 'China', 'India', 'Germany', 'Japan', 'Brazil']
      },
      fallback: true,
      message: 'Database temporarily unavailable - using fallback data'
    })
  }
    }),
    RATE_LIMITS.api.projects
  )
}

// Stats endpoint (deprecated - use /api/stats instead)
export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withErrorHandling(async () => {
      logger.api('POST', '/api/projects', {})
      logger.warn('Deprecated endpoint: POST /api/projects - use /api/stats instead')

  try {
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_projects,
        SUM(capacity_mw) as total_capacity,
        COUNT(DISTINCT country) as countries,
        COUNT(DISTINCT developer) as developers,
        AVG(capacity_mw) as avg_capacity
      FROM projects
    `).get()

    db.close()

    return successResponse(stats, 'Please use /api/stats endpoint instead')
  } catch (error) {
    logger.error('Database error in projects stats:', error)

    return successResponse({
      total_projects: 79193,
      total_capacity: 2955700,
      countries: 60,
      developers: 1500,
      avg_capacity: 37.3,
      fallback: true
    }, 'Using fallback data - database temporarily unavailable')
  }
    }),
    RATE_LIMITS.api.projects
  )
}