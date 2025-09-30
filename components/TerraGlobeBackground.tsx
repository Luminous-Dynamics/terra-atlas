'use client'

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

// Fetch real world sites from API with intelligence scores
const fetchRealWorldSites = async () => {
  try {
    // First try to fetch from the intelligence API for scored projects
    const intelligenceResponse = await fetch('/api/intelligence/top-projects?limit=100')
    if (intelligenceResponse.ok) {
      const intelligenceData = await intelligenceResponse.json()
      if (intelligenceData.projects && intelligenceData.projects.length > 0) {
        // Convert intelligence projects to globe format
        return intelligenceData.projects.map((project: any) => ({
          lat: project.latitude || getRandomLatitude(project.state),
          lng: project.longitude || getRandomLongitude(project.state),
          type: project.type || 'renewable',
          name: project.name,
          capacity: project.capacity_mw || 100,
          country: 'USA',
          score: project.score || 75,
          state: project.state,
          investment_million: project.investment_million
        }))
      }
    }
    
    // Fallback to regular projects API
    const response = await fetch('/api/projects/globe-data')
    if (!response.ok) throw new Error('Failed to fetch globe data')
    const data = await response.json()
    return data.sites || getDefaultSites()
  } catch (error) {
    console.error('Error fetching globe data:', error)
    return getDefaultSites()
  }
}

// Helper functions for generating coordinates from state codes
const getRandomLatitude = (state: string): number => {
  const stateCoords: Record<string, [number, number]> = {
    'TX': [31.0, 27.0], 'CA': [37.0, 34.0], 'FL': [28.5, 25.5],
    'AZ': [34.0, 31.5], 'NV': [39.5, 35.5], 'NY': [43.0, 40.5],
    'WA': [47.5, 45.5], 'OR': [44.0, 42.0], 'CO': [39.5, 37.0],
    'NM': [34.5, 32.0], 'UT': [39.5, 37.0], 'WY': [43.0, 41.0],
    'MT': [47.0, 45.0], 'ID': [44.0, 42.0], 'ND': [47.5, 45.5],
    'SD': [44.5, 42.5], 'NE': [41.5, 40.0], 'KS': [38.5, 37.0],
    'OK': [35.5, 33.5], 'MN': [46.5, 43.5], 'IA': [42.0, 40.5],
    'MO': [38.5, 36.0], 'AR': [35.0, 33.0], 'LA': [31.0, 29.0],
    'MS': [33.0, 30.5], 'AL': [33.0, 30.5], 'GA': [33.0, 30.5],
    'SC': [34.0, 32.5], 'NC': [35.5, 34.0], 'VA': [37.5, 36.5],
    'WV': [39.0, 37.5], 'KY': [37.5, 36.5], 'TN': [35.5, 34.5],
    'IN': [40.0, 38.0], 'OH': [40.5, 38.5], 'MI': [44.0, 41.5],
    'IL': [40.0, 37.0], 'WI': [45.0, 42.5], 'PA': [41.0, 39.5],
    'MD': [39.5, 38.0], 'DE': [39.0, 38.5], 'NJ': [40.5, 39.0],
    'CT': [41.5, 41.0], 'RI': [41.5, 41.3], 'MA': [42.5, 41.5],
    'VT': [44.0, 42.5], 'NH': [43.5, 42.5], 'ME': [45.5, 43.5],
    'HI': [20.5, 19.0], 'AK': [64.0, 58.0]
  }
  const coords = stateCoords[state] || [39.0, 37.0] // Default to center of USA
  return coords[0] + (coords[1] - coords[0]) * Math.random()
}

const getRandomLongitude = (state: string): number => {
  const stateCoords: Record<string, [number, number]> = {
    'TX': [-99.0, -94.0], 'CA': [-124.0, -114.0], 'FL': [-87.0, -80.0],
    'AZ': [-114.5, -109.0], 'NV': [-120.0, -114.0], 'NY': [-79.5, -72.0],
    'WA': [-124.5, -117.0], 'OR': [-124.5, -116.5], 'CO': [-109.0, -102.0],
    'NM': [-109.0, -103.0], 'UT': [-114.0, -109.0], 'WY': [-111.0, -104.0],
    'MT': [-116.0, -104.0], 'ID': [-117.0, -111.0], 'ND': [-104.0, -96.5],
    'SD': [-104.0, -96.5], 'NE': [-104.0, -95.5], 'KS': [-102.0, -94.5],
    'OK': [-103.0, -94.5], 'MN': [-97.0, -89.5], 'IA': [-96.5, -90.0],
    'MO': [-95.5, -89.0], 'AR': [-94.5, -89.5], 'LA': [-94.0, -89.0],
    'MS': [-91.5, -88.0], 'AL': [-88.5, -84.5], 'GA': [-85.5, -81.0],
    'SC': [-83.5, -78.5], 'NC': [-84.5, -75.5], 'VA': [-83.5, -75.0],
    'WV': [-82.5, -77.5], 'KY': [-89.5, -82.0], 'TN': [-90.0, -82.0],
    'IN': [-88.0, -84.5], 'OH': [-84.5, -80.5], 'MI': [-90.5, -82.0],
    'IL': [-91.5, -87.5], 'WI': [-93.0, -86.5], 'PA': [-80.5, -74.5],
    'MD': [-79.5, -75.0], 'DE': [-75.5, -75.0], 'NJ': [-75.5, -73.5],
    'CT': [-73.5, -71.5], 'RI': [-71.8, -71.1], 'MA': [-73.5, -69.5],
    'VT': [-73.5, -71.5], 'NH': [-72.5, -70.5], 'ME': [-71.0, -66.5],
    'HI': [-160.5, -154.5], 'AK': [-168.0, -130.0]
  }
  const coords = stateCoords[state] || [-98.0, -96.0] // Default to center of USA
  return coords[0] + (coords[1] - coords[0]) * Math.random()
}

// Default sites for fallback (reduced set for performance)
const getDefaultSites = () => {
  return [
    // === SOLAR MEGA-PROJECTS ===
    // Bhadla Solar Park, India - World's largest
    { lat: 27.56, lng: 71.91, type: 'solar', name: 'Bhadla Solar Park', capacity: 2245, country: 'India', score: 88 },
    // Tengger Desert Solar Park, China
    { lat: 37.55, lng: 105.18, type: 'solar', name: 'Tengger Desert Solar', capacity: 1547, country: 'China' },
    // Noor Ouarzazate, Morocco
    { lat: 31.05, lng: -6.85, type: 'solar', name: 'Noor Complex', capacity: 580, country: 'Morocco' },
    // Solar Star, California
    { lat: 34.82, lng: -118.39, type: 'solar', name: 'Solar Star', capacity: 579, country: 'USA' },
    // Benban Solar Park, Egypt
    { lat: 24.46, lng: 32.74, type: 'solar', name: 'Benban Solar Park', capacity: 1650, country: 'Egypt' },
    // Kamuthi Solar, India
    { lat: 9.34, lng: 78.37, type: 'solar', name: 'Kamuthi Solar', capacity: 648, country: 'India' },
    // Datong Solar, China
    { lat: 40.08, lng: 113.13, type: 'solar', name: 'Datong Panda Solar', capacity: 1000, country: 'China' },
    // Mohammed bin Rashid, UAE
    { lat: 24.74, lng: 55.36, type: 'solar', name: 'MBR Solar Park', capacity: 5000, country: 'UAE' },
    
    // === WIND POWER GIANTS ===
    // Gansu Wind Farm, China - World's largest
    { lat: 40.15, lng: 95.68, type: 'wind', name: 'Gansu Wind Farm', capacity: 20000, country: 'China' },
    // Hornsea 2, UK - Largest offshore
    { lat: 53.88, lng: 1.75, type: 'wind', name: 'Hornsea 2', capacity: 1320, country: 'UK' },
    // Alta Wind Energy, USA
    { lat: 35.08, lng: -118.33, type: 'wind', name: 'Alta Wind Energy', capacity: 1548, country: 'USA' },
    // Muppandal Wind Farm, India
    { lat: 8.48, lng: 77.53, type: 'wind', name: 'Muppandal Wind', capacity: 1500, country: 'India' },
    // Roscoe Wind Farm, Texas
    { lat: 32.31, lng: -100.53, type: 'wind', name: 'Roscoe Wind Farm', capacity: 781, country: 'USA' },
    // London Array, UK
    { lat: 51.65, lng: 1.45, type: 'wind', name: 'London Array', capacity: 630, country: 'UK' },
    // Gwynt y Môr, Wales
    { lat: 53.46, lng: -3.58, type: 'wind', name: 'Gwynt y Môr', capacity: 576, country: 'UK' },
    // Fântânele-Cogealac, Romania
    { lat: 44.62, lng: 28.05, type: 'wind', name: 'Fântânele-Cogealac', capacity: 600, country: 'Romania' },
    // Walney Extension, UK
    { lat: 54.04, lng: -3.53, type: 'wind', name: 'Walney Extension', capacity: 659, country: 'UK' },
    
    // === HYDROELECTRIC POWERHOUSES ===
    // Three Gorges Dam, China - World's largest
    { lat: 30.82, lng: 111.00, type: 'hydro', name: 'Three Gorges Dam', capacity: 22500, country: 'China' },
    // Itaipu Dam, Brazil/Paraguay
    { lat: -25.41, lng: -54.59, type: 'hydro', name: 'Itaipu Dam', capacity: 14000, country: 'Brazil' },
    // Xiluodu Dam, China
    { lat: 28.26, lng: 103.64, type: 'hydro', name: 'Xiluodu Dam', capacity: 13860, country: 'China' },
    // Guri Dam, Venezuela
    { lat: 7.76, lng: -63.00, type: 'hydro', name: 'Guri Dam', capacity: 10235, country: 'Venezuela' },
    // Grand Coulee, USA
    { lat: 47.95, lng: -118.98, type: 'hydro', name: 'Grand Coulee', capacity: 6809, country: 'USA' },
    // Sayano-Shushenskaya, Russia
    { lat: 52.82, lng: 91.37, type: 'hydro', name: 'Sayano-Shushenskaya', capacity: 6400, country: 'Russia' },
    // Churchill Falls, Canada
    { lat: 53.53, lng: -63.95, type: 'hydro', name: 'Churchill Falls', capacity: 5428, country: 'Canada' },
    
    // === GEOTHERMAL LEADERS ===
    // The Geysers, California - Largest geothermal
    { lat: 38.78, lng: -122.75, type: 'geothermal', name: 'The Geysers', capacity: 1517, country: 'USA' },
    // Larderello, Italy - Oldest
    { lat: 43.25, lng: 10.87, type: 'geothermal', name: 'Larderello', capacity: 769, country: 'Italy' },
    // Hellisheiði, Iceland
    { lat: 64.03, lng: -21.40, type: 'geothermal', name: 'Hellisheiði', capacity: 303, country: 'Iceland' },
    // Cerro Prieto, Mexico
    { lat: 32.40, lng: -115.24, type: 'geothermal', name: 'Cerro Prieto', capacity: 720, country: 'Mexico' },
    // Olkaria, Kenya
    { lat: -0.90, lng: 36.29, type: 'geothermal', name: 'Olkaria', capacity: 863, country: 'Kenya' },
    // Wayang Windu, Indonesia
    { lat: -7.21, lng: 107.63, type: 'geothermal', name: 'Wayang Windu', capacity: 227, country: 'Indonesia' },
    // Tiwi, Philippines
    { lat: 13.46, lng: 123.65, type: 'geothermal', name: 'Tiwi', capacity: 289, country: 'Philippines' },
    // Reykjanes, Iceland
    { lat: 63.88, lng: -22.42, type: 'geothermal', name: 'Reykjanes', capacity: 100, country: 'Iceland' },
    
    // === EMERGING MARKETS & DISTRIBUTED PROJECTS ===
    // Latin America
    { lat: -16.50, lng: -68.15, type: 'solar', name: 'Bolivia Solar', capacity: 100, country: 'Bolivia' },
    { lat: -33.45, lng: -70.66, type: 'solar', name: 'Santiago Solar', capacity: 250, country: 'Chile' },
    { lat: -23.65, lng: -70.40, type: 'solar', name: 'Atacama Solar', capacity: 850, country: 'Chile' },
    { lat: 4.60, lng: -74.08, type: 'hydro', name: 'Colombia Hydro', capacity: 400, country: 'Colombia' },
    
    // Africa
    { lat: -26.20, lng: 28.05, type: 'solar', name: 'Johannesburg Solar', capacity: 200, country: 'South Africa' },
    { lat: 33.97, lng: -6.85, type: 'wind', name: 'Morocco Wind', capacity: 300, country: 'Morocco' },
    { lat: 6.52, lng: 3.38, type: 'solar', name: 'Lagos Solar', capacity: 150, country: 'Nigeria' },
    { lat: 9.03, lng: 38.74, type: 'wind', name: 'Ethiopia Wind', capacity: 200, country: 'Ethiopia' },
    
    // Southeast Asia
    { lat: 13.75, lng: 100.50, type: 'solar', name: 'Bangkok Solar', capacity: 180, country: 'Thailand' },
    { lat: 21.03, lng: 105.85, type: 'hydro', name: 'Vietnam Hydro', capacity: 450, country: 'Vietnam' },
    { lat: -6.21, lng: 106.85, type: 'geothermal', name: 'Java Geothermal', capacity: 380, country: 'Indonesia' },
    { lat: 14.60, lng: 120.98, type: 'solar', name: 'Manila Solar', capacity: 200, country: 'Philippines' },
    
    // Europe
    { lat: 52.52, lng: 13.40, type: 'solar', name: 'Berlin Solar', capacity: 300, country: 'Germany' },
    { lat: 48.86, lng: 2.35, type: 'wind', name: 'France Wind', capacity: 450, country: 'France' },
    { lat: 40.42, lng: -3.70, type: 'solar', name: 'Spain Solar', capacity: 800, country: 'Spain' },
    { lat: 59.91, lng: 10.75, type: 'hydro', name: 'Norway Hydro', capacity: 1200, country: 'Norway' },
    { lat: 59.33, lng: 18.07, type: 'wind', name: 'Sweden Wind', capacity: 550, country: 'Sweden' },
    { lat: 56.16, lng: 10.20, type: 'wind', name: 'Denmark Offshore', capacity: 1300, country: 'Denmark' },
    
    // Oceania
    { lat: -33.87, lng: 151.21, type: 'solar', name: 'Sydney Solar', capacity: 250, country: 'Australia' },
    { lat: -27.47, lng: 153.03, type: 'solar', name: 'Queensland Solar', capacity: 400, country: 'Australia' },
    { lat: -41.29, lng: 174.78, type: 'wind', name: 'New Zealand Wind', capacity: 200, country: 'New Zealand' },
    { lat: -37.81, lng: 144.96, type: 'wind', name: 'Melbourne Wind', capacity: 300, country: 'Australia' },
    
    // Island Nations & Remote
    { lat: 64.13, lng: -21.89, type: 'geothermal', name: 'Iceland Power', capacity: 750, country: 'Iceland' },
    { lat: 21.31, lng: -157.86, type: 'solar', name: 'Hawaii Solar', capacity: 120, country: 'USA' },
    { lat: 35.68, lng: 139.69, type: 'solar', name: 'Tokyo Solar', capacity: 350, country: 'Japan' },
    { lat: 22.40, lng: 114.11, type: 'wind', name: 'Hong Kong Wind', capacity: 100, country: 'China' },
  ]
}

export default function TerraGlobeBackground() {
  const globeRef = useRef<any>(null)
  const globeEl = useRef<HTMLDivElement>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day')
  const animationRef = useRef<number>()
  const [sitesData, setSitesData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [forceReload, setForceReload] = useState(0)
  
  // Fetch real data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      try {
        const data = await fetchRealWorldSites()
        setSitesData(data)
      } catch (error) {
        console.error('Error loading site data:', error)
        setSitesData(getDefaultSites())
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Detect mobile device and time of day
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Update time of day every minute
    const updateTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 8) {
        setTimeOfDay('dawn')
      } else if (hour >= 8 && hour < 17) {
        setTimeOfDay('day')
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('dusk')
      } else {
        setTimeOfDay('night')
      }
    }
    
    updateTimeOfDay()
    const timeInterval = setInterval(updateTimeOfDay, 60000) // Update every minute
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearInterval(timeInterval)
    }
  }, [])
  
  // Force globe reload when component mounts
  useEffect(() => {
    // Check if Globe.gl is already loaded
    if (window.Globe && !globeReady) {
      setGlobeReady(true)
    }
    // Force reload on mount
    setForceReload(prev => prev + 1)
  }, [])
  
  useEffect(() => {
    if (!globeReady || dataLoading || sitesData.length === 0) return
    
    // Define handleResize outside setTimeout for cleanup access
    let handleResize: (() => void) | undefined
    
    // Wait a bit for the script to fully initialize
    const timeout = setTimeout(() => {
      if (!window.Globe) {
        console.error('Globe.gl not available even though script loaded')
        return
      }
      
      // Simple clustering: Group nearby sites (within ~500km) for cleaner homepage view
      const clusterDistance = 5 // degrees (~500km)
      const clusteredSites: any[] = []
      const processed = new Set<number>()

      sitesData.forEach((site, idx) => {
        if (processed.has(idx)) return

        // Find nearby sites to cluster
        const cluster = [site]
        processed.add(idx)

        sitesData.forEach((otherSite, otherIdx) => {
          if (processed.has(otherIdx)) return

          const distance = Math.sqrt(
            Math.pow(site.lat - otherSite.lat, 2) +
            Math.pow(site.lng - otherSite.lng, 2)
          )

          if (distance < clusterDistance) {
            cluster.push(otherSite)
            processed.add(otherIdx)
          }
        })

        // Create cluster or individual marker
        const totalCapacity = cluster.reduce((sum, s) => sum + (s.capacity || 0), 0)
        const avgLat = cluster.reduce((sum, s) => sum + s.lat, 0) / cluster.length
        const avgLng = cluster.reduce((sum, s) => sum + s.lng, 0) / cluster.length

        clusteredSites.push({
          lat: avgLat,
          lng: avgLng,
          type: cluster[0].type,
          count: cluster.length,
          totalCapacity,
          projects: cluster,
          name: cluster.length > 1
            ? `${cluster.length} projects`
            : cluster[0].name
        })
      })

      // Prepare icon labels for simple homepage view
      const preparedSites = clusteredSites.map((site) => {
        // Energy type icons
        const typeIcons: Record<string, string> = {
          solar: '☀️',
          wind: '💨',
          hydro: '💧',
          geothermal: '🌋',
          renewable: '⚡'
        }

        const icon = typeIcons[site.type] || '⚡'
        const label = site.count > 1
          ? `${icon} ${site.count}`
          : icon

        return {
          ...site,
          label,
          icon,
          size: site.count > 1 ? 0.4 : 0.3 // Slightly larger for clusters
        }
      })
      
      // Beautiful Earth with icon markers (not 3D spheres!)
      const globe = Globe()(globeEl.current)
        .globeImageUrl('/globe-textures/earth-blue-marble.jpg') // Local texture - always loads!
        .bumpImageUrl('/globe-textures/earth-topology.png') // Add surface detail
        .backgroundImageUrl(null) // Clean space background
        .backgroundColor('rgba(0, 0, 0, 0)') // Transparent
        .showAtmosphere(true)
        .atmosphereColor('#4a90e2') // Calm, natural blue atmosphere
        .atmosphereAltitude(0.15) // Subtle atmosphere glow

        // Use HTML labels instead of 3D points - shows Earth!
        .htmlElementsData(preparedSites)
        .htmlLat('lat')
        .htmlLng('lng')
        .htmlAltitude(0.001) // Just above surface
        .htmlElement((d: any) => {
          const el = document.createElement('div')
          el.style.cssText = `
            color: white;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 12px;
            padding: 4px 8px;
            font-size: ${d.count > 1 ? '14px' : '16px'};
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s;
          `
          el.innerHTML = d.label
          el.onmouseenter = () => el.style.transform = 'scale(1.2)'
          el.onmouseleave = () => el.style.transform = 'scale(1)'

          // Tooltip on click
          el.onclick = () => {
            alert(`${d.name}\nCapacity: ${d.totalCapacity.toLocaleString()} MW\n${d.count > 1 ? `${d.count} projects` : ''}`)
          }

          return el
        })

        // Remove old 3D point configuration
        .pointsData([]) // No 3D spheres!

        // Keep labels for detailed hover info
        .labelsData(preparedSites)
        .labelLat('lat')
        .labelLng('lng')
        .labelText('name')
        .labelSize(0)
        .labelDotRadius(0)
        .labelLabel((d: any) => {
          // Simple tooltip for clustered projects
          const typeColors: Record<string, string> = {
            solar: '#fbbf24',
            wind: '#60a5fa',
            hydro: '#34d399',
            geothermal: '#f97316',
            renewable: '#a855f7'
          }

          const color = typeColors[d.type] || '#a855f7'

          return `
            <div style="
              background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(16,24,48,0.95) 100%);
              border: 1px solid ${color}40;
              border-radius: 12px;
              padding: 12px 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 8px 32px rgba(0,0,0,0.8);
              backdrop-filter: blur(10px);
              min-width: 240px;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">
                ${d.icon} ${d.name}
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="
                  background: ${color}30;
                  color: ${color};
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  text-transform: capitalize;
                ">
                  ${d.type}
                </span>
                <span style="color: #cbd5e1; font-size: 12px;">
                  ${d.totalCapacity.toLocaleString()} MW
                </span>
              </div>
              ${d.count > 1 ? `
                <div style="font-size: 13px; color: #60a5fa; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ffffff10;">
                  📍 ${d.count} projects in this area
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                Click to explore details
              </div>
            </div>
          `
        })
        
      // Set initial view - perfectly centered with optimal distance
      globe.pointOfView({ lat: 10, lng: 0, altitude: 2.2 }, 0) // Further back to see the whole Earth

      // Very slow, peaceful rotation - like watching Earth from space
      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.08 // Ultra slow, meditative rotation
      globe.controls().enableZoom = true // Allow gentle zoom
      globe.controls().enablePan = false
      globe.controls().rotateSpeed = 0.2 // Gentle manual rotation

      // Keep homepage simple - no rings or arcs
      globe.ringsData([])
      globe.arcsData([])
      
      globeRef.current = globe
      
      // Handle resize
      handleResize = () => {
        if (globeRef.current && globeEl.current) {
          globeRef.current.width(globeEl.current.offsetWidth)
          globeRef.current.height(globeEl.current.offsetHeight)
        }
      }
      
      window.addEventListener('resize', handleResize)
      handleResize()
    
    }, 100) // Small delay to ensure Globe is fully loaded
    
    return () => {
      clearTimeout(timeout)
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (globeRef.current && globeRef.current._destructor) {
        globeRef.current._destructor()
      }
    }
  }, [globeReady, isMobile, timeOfDay, forceReload, sitesData, dataLoading])
  
  return (
    <>
      <Script
        src="//unpkg.com/globe.gl"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Globe.gl script loaded')
          setGlobeReady(true)
        }}
        onReady={() => {
          // Also check on ready
          if (window.Globe) {
            setGlobeReady(true)
          }
        }}
      />
      
      <div className="absolute inset-0">
        {/* Clean, calming space gradient - like viewing Earth from orbit */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Subtle ambient light - very gentle */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '30s' }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-transparent" />
        </div>
        
        {/* Globe container - Perfectly Centered with Optimal Scaling */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <div ref={globeEl} className="w-[85vw] h-[85vh] max-w-[1400px] max-h-[900px] min-w-[320px] min-h-[480px]" />
          </div>
        </div>
        
        {/* Vignette effect for depth */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/50" />
        
        {/* Loading state */}
        {!globeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 animate-pulse" />
                </div>
              </div>
              <p className="text-blue-300 mt-4 text-sm tracking-wide animate-pulse">
                Connecting to global energy network...
              </p>
            </div>
          </div>
        )}
        
        {/* Subtle info overlay - bottom left */}
        {globeReady && (
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="text-xs text-white/40 space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDuration: '3s' }} />
                  <span>Solar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDuration: '3.5s' }} />
                  <span>Wind</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDuration: '4s' }} />
                  <span>Hydro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{ animationDuration: '4.5s' }} />
                  <span>Geothermal</span>
                </div>
              </div>
              <div className="text-white/20 text-xs">
                500+ GW renewable capacity worldwide
              </div>
            </div>
          </div>
        )}
        
        {/* Top gradient fade for content */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .bg-radial-gradient {
          background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 100%);
        }
      `}</style>
    </>
  )
}