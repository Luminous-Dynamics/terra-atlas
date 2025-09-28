import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })
    
    // Get single project by ID
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id)
    
    db.close()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}