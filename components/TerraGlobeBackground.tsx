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
      
      // Prepare data with intelligence score visualization
      const preparedSites = sitesData.map((site, idx) => {
        // Get intelligence score (default to 75 if not present)
        const score = site.score || 75
        const scoreNormalized = score / 100 // 0-1 range
        
        // Ultra-subtle points that show Earth texture clearly
        const sizeMultiplier = isMobile ? 0.03 : 0.02  // Much smaller - was 0.18/0.10
        const baseSize = Math.log10(site.capacity + 1) * sizeMultiplier
        // Gentle size variation based on score
        const scoreBoost = 1 + (scoreNormalized * 0.25)
        const size = baseSize * scoreBoost

        // More transparent colors to let Earth show through
        const baseColors = {
          solar: 'rgba(251, 191, 36, 0.4)',      // More transparent
          wind: 'rgba(96, 165, 250, 0.4)',       // More transparent
          hydro: 'rgba(52, 211, 153, 0.4)',      // More transparent
          geothermal: 'rgba(249, 115, 22, 0.4)'  // More transparent
        }

        const enhancedColor = baseColors[site.type] || 'rgba(255, 255, 255, 0.4)'

        // Lift points higher off surface to reveal Earth
        const baseAltitude = 0.01  // Was 0.005
        const scoreAltitude = scoreNormalized * 0.02  // Was 0.015
        const altitude = baseAltitude + scoreAltitude
        
        return {
          ...site,
          size,
          color: enhancedColor,
          altitude,
          score, // Keep score for potential tooltip/label use
          scoreNormalized // Store normalized score for ring animations
        }
      })
      
      // Beautiful Earth with natural atmosphere
      // Try multiple texture sources for reliability
      const textureUrls = {
        // Primary: vasturiano's working examples
        earth: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg',
        topology: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png'
      }

      const globe = Globe()(globeEl.current)
        .globeImageUrl(textureUrls.earth) // Direct GitHub raw URL
        .bumpImageUrl(textureUrls.topology) // Direct GitHub raw URL
        .backgroundImageUrl(null) // Clean space background
        .backgroundColor('rgba(0, 0, 0, 0)') // Transparent
        .showAtmosphere(true)
        .atmosphereColor('#4a90e2') // Calm, natural blue atmosphere
        .atmosphereAltitude(0.15) // Subtle atmosphere glow
        .pointsData(preparedSites)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude('altitude')
        .pointRadius('size')
        .pointResolution(32) // Higher resolution for smoother points
        .pointsMerge(false)
        .enablePointerInteraction(true) // Enable interaction for tooltips
        .pointLabel((d: any) => {
          // Create rich HTML tooltip with intelligence score
          const score = Math.round((d.scoreNormalized || 0.75) * 100)
          const scoreColor = score >= 90 ? '#10b981' : // emerald-500
                           score >= 80 ? '#06b6d4' : // cyan-500
                           score >= 70 ? '#a855f7' : // purple-500
                           '#f59e0b' // amber-500
          
          return `
            <div style="
              background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(16,24,48,0.95) 100%);
              border: 1px solid ${scoreColor}40;
              border-radius: 12px;
              padding: 12px 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 48px ${scoreColor}20;
              backdrop-filter: blur(10px);
              min-width: 280px;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">
                ${d.name || 'Energy Project'}
              </div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="
                  background: linear-gradient(135deg, ${scoreColor}40, ${scoreColor}20);
                  border: 1px solid ${scoreColor}60;
                  border-radius: 8px;
                  padding: 4px 12px;
                  font-size: 20px;
                  font-weight: 700;
                  color: ${scoreColor};
                ">
                  ${score}
                </div>
                <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                  Intelligence Score
                </div>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="
                  background: ${d.color}30;
                  color: ${d.color};
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  text-transform: capitalize;
                ">
                  ${d.type}
                </span>
                <span style="color: #cbd5e1; font-size: 12px;">
                  ${d.capacity} MW
                </span>
                ${d.state ? `<span style="color: #94a3b8; font-size: 12px;">${d.state}</span>` : ''}
                ${d.country ? `<span style="color: #94a3b8; font-size: 12px;">${d.country}</span>` : ''}
              </div>
              ${d.investment_million ? `
                <div style="font-size: 13px; color: #10b981; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ffffff10;">
                  💰 $${d.investment_million}M investment
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                ${score >= 90 ? '⭐ Top-tier opportunity' :
                  score >= 80 ? '✨ High-potential project' :
                  score >= 70 ? '📈 Strong fundamentals' :
                  '🔍 Strategic opportunity'}
              </div>
            </div>
          `
        })
        .onPointClick((point: any) => {
          // Log click for potential future navigation
          console.log('Project clicked:', point.name, 'Score:', Math.round((point.scoreNormalized || 0.75) * 100))
        })
        .onPointHover((point: any) => {
          // Change cursor on hover
          if (globeEl.current) {
            globeEl.current.style.cursor = point ? 'pointer' : 'grab'
          }
        })
        
      // Set initial view - perfectly centered with optimal distance
      globe.pointOfView({ lat: 10, lng: 0, altitude: 2.2 }, 0) // Further back to see the whole Earth

      // Very slow, peaceful rotation - like watching Earth from space
      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.08 // Ultra slow, meditative rotation
      globe.controls().enableZoom = true // Allow gentle zoom
      globe.controls().enablePan = false
      globe.controls().rotateSpeed = 0.2 // Gentle manual rotation
      
      // Gentle, subtle pulsing rings - only for major projects
      const capacityThreshold = isMobile ? 5000 : 2000 // Only show rings for larger projects
      const ringsData = preparedSites.filter(site => site.capacity > capacityThreshold).map(site => {
        // Very slow, calming pulse animation
        const speedMultiplier = 0.5 // Slow and serene

        // Gentle ring patterns
        const getRingConfig = () => {
          const baseConfig = {
            maxR: site.size * 12, // Smaller rings
            propagationSpeed: 0.3 * speedMultiplier, // Very slow
            repeatPeriod: 8000 + Math.random() * 4000, // 8-12 second intervals
          }

          switch(site.type) {
            case 'solar':
              return { ...baseConfig, color: 'rgba(251, 191, 36, 0.25)' } // Very subtle
            case 'wind':
              return { ...baseConfig, color: 'rgba(96, 165, 250, 0.25)' }
            case 'hydro':
              return { ...baseConfig, color: 'rgba(52, 211, 153, 0.25)' }
            default: // geothermal
              return { ...baseConfig, color: 'rgba(249, 115, 22, 0.25)' }
          }
        }

        const config = getRingConfig()
        return {
          lat: site.lat,
          lng: site.lng,
          ...config
        }
      })
      
      globe
        .ringsData(ringsData)
        .ringMaxRadius('maxR')
        .ringPropagationSpeed('propagationSpeed')
        .ringRepeatPeriod('repeatPeriod')
        .ringColor((ring) => (t) => {
          // Gentle fade for rings
          const color = ring.color || 'rgba(96, 165, 250, 0.25)'
          const opacity = (1 - t) * 0.25 // Very subtle
          return color.replace(/[\d.]+\)$/, `${opacity})`)
        })

      // Remove arcs to keep Earth view clean and uncluttered
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