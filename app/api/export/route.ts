import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function convertToCSV(data: any[], columns: string[]): string {
  // Create header row
  const header = columns.join(',')
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col]
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  })
  
  return [header, ...rows].join('\n')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'
  const dataset = searchParams.get('dataset') || 'projects'
  const limit = parseInt(searchParams.get('limit') || '10000')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const minCapacity = searchParams.get('minCapacity')
  const maxCapacity = searchParams.get('maxCapacity')
  
  try {
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })
    
    // Build query based on dataset
    let sql = ''
    let params: any[] = []
    let columns: string[] = []
    
    switch (dataset) {
      case 'projects':
        sql = 'SELECT * FROM projects WHERE 1=1'
        columns = ['id', 'name', 'type', 'developer', 'owner', 'state', 'country', 
                   'latitude', 'longitude', 'status', 'capacity_mw', 'annual_generation_gwh',
                   'investment', 'jobs_created', 'co2_offset_tons', 'completion_date']
        
        // Apply filters
        if (type) {
          sql += ' AND type = ?'
          params.push(type)
        }
        if (status) {
          sql += ' AND status = ?'
          params.push(status)
        }
        if (minCapacity) {
          sql += ' AND capacity_mw >= ?'
          params.push(parseFloat(minCapacity))
        }
        if (maxCapacity) {
          sql += ' AND capacity_mw <= ?'
          params.push(parseFloat(maxCapacity))
        }
        
        sql += ' ORDER BY capacity_mw DESC LIMIT ?'
        params.push(limit)
        break
        
      case 'statistics':
        // Export aggregated statistics
        sql = `
          SELECT 
            type,
            COUNT(*) as project_count,
            SUM(capacity_mw) as total_capacity_mw,
            AVG(capacity_mw) as avg_capacity_mw,
            SUM(investment) as total_investment,
            SUM(jobs_created) as total_jobs,
            SUM(co2_offset_tons) as total_co2_offset
          FROM projects
          GROUP BY type
        `
        columns = ['type', 'project_count', 'total_capacity_mw', 'avg_capacity_mw', 
                   'total_investment', 'total_jobs', 'total_co2_offset']
        break
        
      case 'summary':
        // Export state-by-state summary
        sql = `
          SELECT 
            state,
            country,
            COUNT(*) as project_count,
            COUNT(DISTINCT type) as technology_types,
            SUM(capacity_mw) as total_capacity_mw,
            SUM(investment) as total_investment,
            SUM(jobs_created) as total_jobs,
            AVG(CAST(REPLACE(REPLACE(completion_date, '%', ''), ' complete', '') AS REAL)) as avg_completion
          FROM projects
          GROUP BY state, country
          ORDER BY total_capacity_mw DESC
          LIMIT ?
        `
        params.push(limit)
        columns = ['state', 'country', 'project_count', 'technology_types', 
                   'total_capacity_mw', 'total_investment', 'total_jobs', 'avg_completion']
        break
        
      case 'top-projects':
        // Export top projects by various metrics
        const metric = searchParams.get('metric') || 'capacity_mw'
        sql = `SELECT * FROM projects ORDER BY ${metric} DESC LIMIT ?`
        params.push(Math.min(limit, 100))
        columns = ['id', 'name', 'type', 'developer', 'state', 'country',
                   'capacity_mw', 'investment', 'jobs_created', 'status']
        break
        
      default:
        db.close()
        return NextResponse.json({ error: 'Invalid dataset' }, { status: 400 })
    }
    
    const data = db.prepare(sql).all(...params)
    db.close()
    
    // Format based on requested format
    if (format === 'json') {
      return NextResponse.json({
        dataset,
        timestamp: new Date().toISOString(),
        count: data.length,
        filters: { type, status, minCapacity, maxCapacity },
        data
      })
    } else if (format === 'csv') {
      const csv = convertToCSV(data, columns)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="terra-atlas-${dataset}-${Date.now()}.csv"`
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid format. Use csv or json' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ 
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}