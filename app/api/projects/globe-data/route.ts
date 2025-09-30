import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for public data access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch a sample of sites for globe visualization (limit for performance)
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, type, latitude, longitude, power_mw, status')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500) // Limit for performance on globe
      .order('power_mw', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching sites:', error)
      // Return demo data as fallback
      return NextResponse.json({
        sites: getDemoSites()
      })
    }

    // Map to format expected by globe component
    const formattedSites = (sites || []).map((site: any) => ({
      id: site.id,
      name: site.name,
      lat: site.latitude,
      lng: site.longitude,
      type: site.type,
      power: site.power_mw || 0,
      status: site.status || 'operational',
      color: getColorByType(site.type),
      size: Math.min(Math.max(site.power_mw / 100, 0.5), 5) // Scale size based on power
    }))

    return NextResponse.json({
      sites: formattedSites.length > 0 ? formattedSites : getDemoSites(),
      total: formattedSites.length
    })
  } catch (error) {
    console.error('Globe data error:', error)
    // Return demo data as fallback
    return NextResponse.json({
      sites: getDemoSites()
    })
  }
}

function getColorByType(type: string): string {
  const colors: { [key: string]: string } = {
    solar: '#FCD34D',    // Yellow
    wind: '#60A5FA',     // Blue
    hydro: '#34D399',    // Green
    geothermal: '#F87171', // Red
    nuclear: '#A78BFA',  // Purple
    storage: '#FB923C'   // Orange
  }
  return colors[type] || '#10B981' // Default emerald
}

function getDemoSites() {
  // Fallback demo data if database is unavailable
  return [
    { id: 1, name: 'Mojave Solar Park', lat: 35.0, lng: -116.5, type: 'solar', power: 280, color: '#FCD34D', size: 2.8, status: 'operational' },
    { id: 2, name: 'London Array', lat: 51.6, lng: 1.5, type: 'wind', power: 630, color: '#60A5FA', size: 5, status: 'operational' },
    { id: 3, name: 'Three Gorges Dam', lat: 30.8, lng: 111.0, type: 'hydro', power: 22500, color: '#34D399', size: 5, status: 'operational' },
    { id: 4, name: 'Hellisheiði Power Station', lat: 64.0, lng: -21.4, type: 'geothermal', power: 303, color: '#F87171', size: 3, status: 'operational' },
    { id: 5, name: 'Vogtle Nuclear Plant', lat: 33.1, lng: -81.8, type: 'nuclear', power: 2234, color: '#A78BFA', size: 5, status: 'construction' },
    { id: 6, name: 'Hornsdale Power Reserve', lat: -32.5, lng: 138.5, type: 'storage', power: 150, color: '#FB923C', size: 1.5, status: 'operational' },
    { id: 7, name: 'Gansu Wind Farm', lat: 40.5, lng: 95.8, type: 'wind', power: 20000, color: '#60A5FA', size: 5, status: 'operational' },
    { id: 8, name: 'Bhadla Solar Park', lat: 27.5, lng: 71.9, type: 'solar', power: 2245, color: '#FCD34D', size: 5, status: 'operational' },
    { id: 9, name: 'Grand Coulee Dam', lat: 47.9, lng: -119.0, type: 'hydro', power: 6809, color: '#34D399', size: 5, status: 'operational' },
    { id: 10, name: 'Fukushima Renewable Energy', lat: 37.5, lng: 141.0, type: 'solar', power: 100, color: '#FCD34D', size: 1, status: 'operational' },
  ]
}