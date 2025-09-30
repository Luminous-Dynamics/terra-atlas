const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
require('dotenv').config({ path: '.env.local' });

async function importFromSQLite() {
  console.log('🚀 Importing Terra Atlas SQLite Data to Supabase\n');
  
  // Connect to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin access
  );
  
  // Open SQLite database
  const db = new Database('./data/terra-atlas-local.db', { readonly: true });
  
  try {
    // Get all projects
    const projects = db.prepare(`
      SELECT * FROM projects
    `).all();
    
    console.log(`📊 Found ${projects.length} projects in SQLite\n`);
    
    // Helper function to map energy types to allowed values
    function mapEnergyType(energy_source, project_type) {
      const source = (energy_source || project_type || '').toLowerCase();
      
      // Map various energy types to the four allowed values
      if (source.includes('solar')) return 'solar';
      if (source.includes('wind')) return 'wind';
      if (source.includes('hydro') || source.includes('dam')) return 'hydro';
      if (source.includes('geothermal')) return 'geothermal';
      if (source.includes('nuclear')) return 'solar'; // Map nuclear to solar for now
      if (source.includes('battery') || source.includes('storage')) return 'solar'; // Map storage to solar
      
      // Default to solar if unknown
      return 'solar';
    }
    
    // Transform for Supabase sites table (matching actual schema)
    const sites = projects.map((project, index) => ({
      legacy_id: `SQLITE_${project.id || index}`,
      name: project.project_name || `${project.project_type} Project ${project.id}`,
      type: mapEnergyType(project.energy_source, project.project_type),
      subtype: project.energy_source || project.project_type || null,
      status: project.project_status || 'operational',
      category: 'pre-existing',
      latitude: parseFloat(project.latitude) || null,
      longitude: parseFloat(project.longitude) || null,
      country: 'USA', // All projects are in USA
      state: project.state || null,
      power_mw: parseFloat(project.capacity_mw) || 0,
      potential_mw: parseFloat(project.potential_capacity_mw) || parseFloat(project.capacity_mw) || 0,
      annual_gwh: parseFloat(project.estimated_generation_gwh) || 0,
      owner: project.owner || project.developer || null,
      notes: `[${project.energy_source || project.project_type}] ${project.notes || project.description || ''}`.trim(),
      temperature_c: null, // Not applicable for most projects
      depth_m: null, // Not applicable for most projects  
      lcoe_usd: parseFloat(project.lcoe) || null,
      year_built: parseInt(project.year_operational) || parseInt(project.commissioning_year) || null,
      source: 'Terra Atlas SQLite Database'
    }));
    
    // Clear existing data (optional - comment out if you want to append)
    console.log('🗑️  Clearing existing sites from SQLite import...');
    const { error: deleteError } = await supabase
      .from('sites')
      .delete()
      .like('legacy_id', 'SQLITE_%'); // Delete only previous SQLite imports
    
    if (deleteError) {
      console.error('Error clearing sites:', deleteError.message);
    }
    
    // Insert in batches
    const batchSize = 50;
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('sites')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        errors++;
      } else {
        imported += data.length;
        console.log(`✅ Imported ${imported}/${sites.length} sites...`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Import Complete!');
    console.log(`✅ Successfully imported ${imported} sites`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} batches had errors`);
    }
    
    // Verify final count
    const { count } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total sites in Supabase: ${count}`);
    
    // Show sample
    const { data: sample } = await supabase
      .from('sites')
      .select('id, name, site_type, country, capacity_mw')
      .limit(5);
    
    console.log('\n📝 Sample imported sites:');
    console.table(sample);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  } finally {
    db.close();
  }
}

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nMake sure .env.local has these values set.');
  process.exit(1);
}

importFromSQLite();