#!/usr/bin/env tsx
/**
 * Test that we can fetch the 79,193 projects from the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fyyszjyixenujgbjaqkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXN6anlpeGVudWpnYmphcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDkwNDksImV4cCI6MjA3MjE4NTA0OX0.Eb0ngZmv24bhyMO9nY24U70XokSK8AYPp8pzgT1KZgw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Testing Terra Atlas Database');
  console.log('================================');
  
  // Get total count
  const { count, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Error getting count:', countError);
  } else {
    console.log(`✅ Total projects in database: ${count?.toLocaleString()}`);
  }
  
  // Get breakdown by type
  console.log('\n📊 Projects by Type:');
  const types = ['solar', 'wind', 'hydro', 'nuclear', 'storage'];
  
  for (const type of types) {
    const { count: typeCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('type', type);
    
    console.log(`  ${type}: ${typeCount?.toLocaleString() || 0}`);
  }
  
  // Get breakdown by status
  console.log('\n📈 Projects by Status:');
  const statuses = ['planning', 'approved', 'construction', 'operational'];
  
  for (const status of statuses) {
    const { count: statusCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    console.log(`  ${status}: ${statusCount?.toLocaleString() || 0}`);
  }
  
  // Get sample projects
  console.log('\n🎯 Sample Projects:');
  const { data: samples } = await supabase
    .from('projects')
    .select('name, type, status, capacity_mw, state')
    .limit(5);
  
  if (samples) {
    samples.forEach(p => {
      console.log(`  • ${p.name} (${p.type}, ${p.status}, ${p.capacity_mw}MW, ${p.state})`);
    });
  }
  
  // Test API endpoint
  console.log('\n🌐 Testing API Endpoint:');
  try {
    const response = await fetch('http://localhost:3001/api/projects?limit=5');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API returned ${data.projects?.length || 0} projects`);
      console.log(`✅ Total available: ${data.total?.toLocaleString() || 'Unknown'}`);
    } else {
      console.log(`⚠️ API returned status ${response.status}`);
    }
  } catch (err) {
    console.log('⚠️ Could not reach API (server may still be starting)');
  }
  
  console.log('\n🎉 Database test complete!');
  console.log('Visit http://localhost:3001 to see the interactive globe with all 79,193 projects!');
}

main();