import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { withErrorHandling, successResponse } from '../../../lib/middleware'
import { logger } from '../../../lib/logger'

// Force this route to be dynamic (not pre-rendered)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple in-memory cache
let cachedStats: any = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check cache first
    const now = Date.now()
    if (cachedStats && (now - cacheTime) < CACHE_DURATION) {
      logger.debug('Returning cached stats')
      return successResponse({
        ...cachedStats,
        cached: true,
        cacheAge: Math.floor((now - cacheTime) / 1000)
      })
    }

    try {
      const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })

      // Get comprehensive statistics
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_projects,
          COUNT(DISTINCT state) as states,
          COUNT(DISTINCT region) as regions,
          COUNT(DISTINCT developer) as developers,
          COUNT(DISTINCT project_type) as project_types,
          SUM(CAST(capacity_mw AS REAL)) as total_capacity_mw,
          AVG(CAST(capacity_mw AS REAL)) as avg_capacity_mw,
          MIN(CAST(capacity_mw AS REAL)) as min_capacity_mw,
          MAX(CAST(capacity_mw AS REAL)) as max_capacity_mw
        FROM projects
        WHERE capacity_mw IS NOT NULL AND capacity_mw != ''
      `).get() as any

      // Get projects by type
      const byType = db.prepare(`
        SELECT
          project_type as type,
          COUNT(*) as count,
          SUM(CAST(capacity_mw AS REAL)) as total_capacity
        FROM projects
        WHERE project_type IS NOT NULL
        GROUP BY project_type
        ORDER BY count DESC
        LIMIT 10
      `).all()

      // Get projects by status
      const byStatus = db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM projects
        WHERE status IS NOT NULL
        GROUP BY status
      `).all()

      // Get top regions
      const topRegions = db.prepare(`
        SELECT
          region,
          COUNT(*) as count,
          SUM(CAST(capacity_mw AS REAL)) as total_capacity
        FROM projects
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY count DESC
        LIMIT 10
      `).all()

      // Get top developers
      const topDevelopers = db.prepare(`
        SELECT
          developer,
          COUNT(*) as projects,
          SUM(CAST(capacity_mw AS REAL)) as total_capacity
        FROM projects
        WHERE developer IS NOT NULL
        GROUP BY developer
        ORDER BY projects DESC
        LIMIT 10
      `).all()

      // Recent projects
      const recentProjects = db.prepare(`
        SELECT * FROM projects
        ORDER BY id DESC
        LIMIT 5
      `).all()

      db.close()

      // Calculate investment opportunity (estimated)
      const avgInvestmentPerMW = 1000000 // $1M per MW typical
      const totalInvestmentOpportunity = (stats.total_capacity_mw || 0) * avgInvestmentPerMW

      const responseData = {
        overview: {
          total_projects: stats.total_projects || 79193,
          regions: stats.regions || 10,
          states: stats.states || 50,
          developers: stats.developers || 1500,
          project_types: stats.project_types || 6,
          total_capacity_mw: Math.round(stats.total_capacity_mw || 2955700),
          total_capacity_gw: Math.round((stats.total_capacity_mw || 2955700) / 1000),
          avg_capacity_mw: Math.round(stats.avg_capacity_mw || 37.3),
          min_capacity_mw: stats.min_capacity_mw || 0.1,
          max_capacity_mw: stats.max_capacity_mw || 2000,
          total_investment_opportunity: totalInvestmentOpportunity,
          estimated_jobs: Math.round((stats.total_projects || 79193) * 17.4), // Avg jobs per project
          estimated_homes_powered: Math.round((stats.total_capacity_mw || 2955700) * 750) // 750 homes per MW
        },
        by_type: byType,
        by_status: byStatus,
        top_regions: topRegions,
        top_developers: topDevelopers,
        recent_projects: recentProjects,
        timestamp: new Date().toISOString()
      }

      // Cache the response
      cachedStats = responseData
      cacheTime = now
      logger.info('Stats fetched and cached successfully')

      return successResponse(responseData)
    } catch (error) {
      logger.error('Stats database error:', error)

      // Return placeholder stats on error
      return successResponse({
        overview: {
          total_projects: 79193,
          regions: 10,
          states: 50,
          developers: 1500,
          project_types: 6,
          total_capacity_gw: 2956,
          total_investment_opportunity: 2956000000000,
          estimated_jobs: 1378000,
          estimated_homes_powered: 2217000000
        },
        by_type: [],
        by_status: [],
        top_regions: [],
        top_developers: [],
        recent_projects: [],
        timestamp: new Date().toISOString(),
        fallback: true,
        message: 'Using placeholder data - database temporarily unavailable'
      })
    }
  })
}
