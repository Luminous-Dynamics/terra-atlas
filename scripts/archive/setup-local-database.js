#!/usr/bin/env node

/**
 * Terra Atlas Local Database Setup
 * Creates a unified SQLite database with 79,193+ real energy projects
 * Zero cost local development with impressive scale
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// Database location
const DB_PATH = path.join(__dirname, 'data', 'terra-atlas-local.db');

async function createDatabase() {
  console.log('🚀 Terra Atlas Local Database Setup');
  console.log('Creating database with 79,193+ real energy projects...\n');

  // Create or open database
  const db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create unified projects table
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          project_type TEXT NOT NULL, -- 'ferc', 'usace', 'smr', 'corridor'
          project_name TEXT NOT NULL,
          developer TEXT,
          owner_type TEXT,
          
          -- Location
          state TEXT,
          county TEXT,
          region TEXT,
          latitude REAL,
          longitude REAL,
          
          -- Technical specs
          capacity_mw REAL,
          energy_source TEXT,
          technology_type TEXT,
          number_of_units INTEGER DEFAULT 1,
          
          -- Status
          status TEXT,
          operational BOOLEAN DEFAULT FALSE,
          construction_start DATE,
          commercial_operation DATE,
          year_completed INTEGER,
          
          -- Financial
          total_cost REAL,
          cost_per_kw REAL,
          annual_revenue_potential REAL,
          payback_period_years REAL,
          levelized_cost_per_mwh REAL,
          
          -- Grid connection
          interconnection_status TEXT,
          transmission_owner TEXT,
          point_of_interconnection TEXT,
          interconnection_cost REAL,
          grid_connection_voltage_kv REAL,
          
          -- Environmental & Social
          carbon_avoided_tons_per_year REAL,
          environmental_score INTEGER,
          community_support_score INTEGER,
          technical_feasibility_score INTEGER,
          overall_viability_score INTEGER,
          jobs_created INTEGER,
          
          -- Metadata
          data_source TEXT,
          last_updated DATE,
          raw_data TEXT -- Store original JSON for reference
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create indexes for performance
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state)');
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_capacity ON projects(capacity_mw)');
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(latitude, longitude)');
      db.run('CREATE INDEX IF NOT EXISTS idx_projects_viability ON projects(overall_viability_score)');

      // Create statistics table for quick aggregations
      db.run(`
        CREATE TABLE IF NOT EXISTS statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stat_type TEXT NOT NULL,
          stat_key TEXT NOT NULL,
          stat_value REAL,
          metadata TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(stat_type, stat_key)
        )
      `);

      // Create search index for full-text search
      db.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS projects_search 
        USING fts5(
          project_name, 
          developer, 
          state, 
          county, 
          energy_source,
          content=projects
        )
      `);

      resolve(db);
    });
  });
}

async function importFERCData(db) {
  console.log('📊 Importing FERC interconnection queue data...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'ferc-queue-2024.json'), 'utf8'));
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, project_type, project_name, developer, state, county, region,
      latitude, longitude, capacity_mw, energy_source,
      status, operational, total_cost, interconnection_status,
      transmission_owner, point_of_interconnection, interconnection_cost,
      data_source, last_updated, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const [index, project] of Object.entries(data)) {
    stmt.run(
      project.queue_id || `FERC-${index}`,
      'ferc',
      project.project_name,
      project.developer,
      project.state,
      project.county,
      project.region,
      project.latitude,
      project.longitude,
      project.capacity_mw,
      project.energy_source,
      project.interconnection_status,
      project.operational || false,
      project.total_cost,
      project.interconnection_status,
      project.transmission_owner,
      project.point_of_interconnection,
      project.interconnection_cost,
      'FERC Queue 2024',
      new Date().toISOString(),
      JSON.stringify(project)
    );
    count++;
    if (count % 1000 === 0) {
      console.log(`  Imported ${count} FERC projects...`);
    }
  }
  
  stmt.finalize();
  console.log(`✅ Imported ${count} FERC projects\n`);
  return count;
}

async function importUSACEData(db) {
  console.log('🌊 Importing USACE dams data...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'usace-dams-2024.json'), 'utf8'));
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, project_type, project_name, owner_type, state, county,
      latitude, longitude, capacity_mw, energy_source,
      status, year_completed, total_cost,
      annual_revenue_potential, payback_period_years, levelized_cost_per_mwh,
      environmental_score, community_support_score, technical_feasibility_score,
      overall_viability_score, jobs_created, interconnection_cost,
      data_source, last_updated, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const [index, dam] of Object.entries(data)) {
    if (dam.retrofit_potential_mw > 0) { // Only import dams with retrofit potential
      stmt.run(
        dam.nid_id || `USACE-${index}`,
        'usace',
        dam.dam_name,
        dam.owner_type,
        dam.state,
        dam.county,
        dam.latitude,
        dam.longitude,
        dam.retrofit_potential_mw,
        'Hydroelectric',
        dam.has_existing_hydro ? 'Operational' : 'Retrofit Opportunity',
        dam.year_completed,
        dam.retrofit_cost,
        dam.annual_revenue_potential,
        dam.payback_period_years,
        dam.levelized_cost_per_mwh,
        dam.environmental_score,
        dam.community_support_score,
        dam.technical_feasibility_score,
        dam.overall_viability_score,
        dam.jobs_created,
        dam.interconnection_cost,
        'USACE National Inventory of Dams 2024',
        new Date().toISOString(),
        JSON.stringify(dam)
      );
      count++;
      if (count % 5000 === 0) {
        console.log(`  Imported ${count} USACE dams...`);
      }
    }
  }
  
  stmt.finalize();
  console.log(`✅ Imported ${count} USACE dams with retrofit potential\n`);
  return count;
}

async function importSMRData(db) {
  console.log('⚛️ Importing SMR projects data...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'smr-pipeline-projects.json'), 'utf8'));
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, project_type, project_name, developer, state,
      latitude, longitude, capacity_mw, energy_source, technology_type,
      number_of_units, status, construction_start, commercial_operation,
      total_cost, cost_per_kw, carbon_avoided_tons_per_year,
      jobs_created, grid_connection_voltage_kv,
      data_source, last_updated, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const project of data) {
    stmt.run(
      project.project_id,
      'smr',
      project.project_name,
      project.developer,
      project.state,
      project.latitude,
      project.longitude,
      project.total_capacity_mw,
      'Nuclear SMR',
      project.reactor_type,
      project.number_of_modules,
      project.status,
      project.estimated_construction_start,
      project.estimated_commercial_operation,
      project.estimated_project_cost,
      project.cost_per_kw,
      project.carbon_avoided_tons_per_year,
      project.construction_jobs,
      project.grid_connection_voltage_kv,
      'SMR Pipeline Projects 2024',
      project.last_updated,
      JSON.stringify(project)
    );
    count++;
  }
  
  stmt.finalize();
  console.log(`✅ Imported ${count} SMR projects\n`);
  return count;
}

async function calculateStatistics(db) {
  console.log('📈 Calculating statistics...');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Total projects by type
      db.all(`
        SELECT project_type, COUNT(*) as count, SUM(capacity_mw) as total_mw
        FROM projects
        GROUP BY project_type
      `, (err, rows) => {
        if (err) reject(err);
        
        rows.forEach(row => {
          db.run(`
            INSERT OR REPLACE INTO statistics (stat_type, stat_key, stat_value, metadata)
            VALUES ('project_count', ?, ?, ?)
          `, [row.project_type, row.count, JSON.stringify({ total_mw: row.total_mw })]);
        });
      });

      // State distribution
      db.all(`
        SELECT state, COUNT(*) as count, SUM(capacity_mw) as total_mw
        FROM projects
        WHERE state IS NOT NULL
        GROUP BY state
        ORDER BY total_mw DESC
      `, (err, rows) => {
        if (err) reject(err);
        
        rows.forEach(row => {
          db.run(`
            INSERT OR REPLACE INTO statistics (stat_type, stat_key, stat_value, metadata)
            VALUES ('state_capacity', ?, ?, ?)
          `, [row.state, row.total_mw, JSON.stringify({ project_count: row.count })]);
        });
      });

      // Energy source distribution
      db.all(`
        SELECT energy_source, COUNT(*) as count, SUM(capacity_mw) as total_mw
        FROM projects
        WHERE energy_source IS NOT NULL
        GROUP BY energy_source
        ORDER BY total_mw DESC
      `, (err, rows) => {
        if (err) reject(err);
        
        rows.forEach(row => {
          db.run(`
            INSERT OR REPLACE INTO statistics (stat_type, stat_key, stat_value, metadata)
            VALUES ('energy_source', ?, ?, ?)
          `, [row.energy_source, row.total_mw, JSON.stringify({ project_count: row.count })]);
        });
      });

      // Total statistics
      db.get(`
        SELECT 
          COUNT(*) as total_projects,
          SUM(capacity_mw) as total_capacity_mw,
          SUM(total_cost) as total_investment,
          SUM(jobs_created) as total_jobs,
          AVG(overall_viability_score) as avg_viability
        FROM projects
      `, (err, row) => {
        if (err) reject(err);
        
        console.log('\n📊 Database Statistics:');
        console.log(`  Total Projects: ${row.total_projects.toLocaleString()}`);
        console.log(`  Total Capacity: ${Math.round(row.total_capacity_mw).toLocaleString()} MW`);
        console.log(`  Total Investment: $${Math.round(row.total_investment / 1e9)}B`);
        console.log(`  Total Jobs: ${Math.round(row.total_jobs).toLocaleString()}`);
        console.log(`  Average Viability: ${Math.round(row.avg_viability)}%\n`);
        
        resolve(row);
      });
    });
  });
}

async function main() {
  try {
    // Create database
    const db = await createDatabase();
    
    // Import all data sources
    const fercCount = await importFERCData(db);
    const usaceCount = await importUSACEData(db);
    const smrCount = await importSMRData(db);
    
    // Calculate statistics
    await calculateStatistics(db);
    
    // Create search triggers
    db.run(`
      INSERT INTO projects_search(project_name, developer, state, county, energy_source)
      SELECT project_name, developer, state, county, energy_source FROM projects
    `);
    
    console.log('✨ Database setup complete!');
    console.log(`📍 Database location: ${DB_PATH}`);
    console.log(`📊 Total projects: ${(fercCount + usaceCount + smrCount).toLocaleString()}`);
    
    db.close();
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createDatabase, DB_PATH };