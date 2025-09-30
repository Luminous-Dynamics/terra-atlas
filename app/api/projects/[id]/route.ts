import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = new Database(path.join(process.cwd(), 'data', 'terra-atlas-local.db'), { readonly: true })
    
    // Get single project by ID with mapped column names
    const query = `SELECT 
      id,
      project_name as name,
      project_type as type,
      developer,
      owner_type,
      state,
      county,
      region,
      state as country,
      latitude,
      longitude,
      capacity_mw,
      energy_source,
      technology_type,
      status,
      operational,
      construction_start,
      commercial_operation,
      year_completed,
      total_cost as investment,
      total_cost as investment_needed,
      cost_per_kw,
      annual_revenue_potential,
      payback_period_years,
      levelized_cost_per_mwh,
      interconnection_status,
      transmission_owner,
      point_of_interconnection,
      interconnection_cost,
      grid_connection_voltage_kv,
      carbon_avoided_tons_per_year as co2_saved_annual,
      environmental_score,
      community_support_score,
      technical_feasibility_score,
      overall_viability_score,
      jobs_created,
      data_source,
      last_updated
    FROM projects WHERE id = ?`
    
    const project = db.prepare(query).get(params.id)
    
    db.close()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Add calculated fields
    const enhancedProject = {
      ...project,
      investment_raised: project.investment_needed * 0.35, // 35% raised
      min_investment: 100,
      irr: project.type === 'Solar' ? 12 : 11,
      roi_percentage: project.type === 'Solar' ? 12 : 11,
      completion_date: project.year_completed ? `${project.year_completed}-Q3` : '2027-Q3',
      power_offtaker: 'Regional Utility Co.',
      total_homes_powered: Math.round(project.capacity_mw * 750),
      location: `${project.state}, USA`,
      description: `This ${project.capacity_mw} MW ${project.type || 'energy'} project represents a significant advancement in renewable energy infrastructure for ${project.state}.`
    }
    
    return NextResponse.json(enhancedProject)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}