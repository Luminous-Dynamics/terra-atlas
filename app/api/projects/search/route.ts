import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const types = searchParams.get('types')?.split(',').filter(Boolean) || []
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
  const countries = searchParams.get('countries')?.split(',').filter(Boolean) || []
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })
    
    // Build dynamic query
    let sql = 'SELECT * FROM projects WHERE 1=1'
    const params: any[] = []
    
    // Text search across multiple fields
    if (query) {
      sql += ` AND (
        name LIKE ? OR 
        developer LIKE ? OR 
        state LIKE ? OR 
        country LIKE ? OR
        type LIKE ?
      )`
      const searchPattern = `%${query}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    // Type filter
    if (types.length > 0) {
      sql += ` AND type IN (${types.map(() => '?').join(',')})`
      params.push(...types)
    }
    
    // Status filter
    if (statuses.length > 0) {
      sql += ` AND status IN (${statuses.map(() => '?').join(',')})`
      params.push(...statuses)
    }
    
    // Country filter
    if (countries.length > 0) {
      sql += ` AND country IN (${countries.map(() => '?').join(',')})`
      params.push(...countries)
    }
    
    // Order by relevance (simple scoring based on name match)
    if (query) {
      sql += ` ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN developer LIKE ? THEN 2
          ELSE 3
        END,
        capacity_mw DESC`
      params.push(`${query}%`, `${query}%`)
    } else {
      sql += ' ORDER BY capacity_mw DESC'
    }
    
    sql += ` LIMIT ?`
    params.push(limit)
    
    const results = db.prepare(sql).all(...params)
    
    db.close()
    
    return NextResponse.json({
      results,
      total: results.length,
      query,
      filters: { types, statuses, countries }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      error: 'Search failed', 
      results: [] 
    }, { status: 500 })
  }
}