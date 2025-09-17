'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Use public token for demo - replace with your own
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

interface GlobalMapProps {
  data: any
  activeLayer: string
  timeRange: { start: Date; end: Date }
}

export default function GlobalMap({ data, activeLayer, timeRange }: GlobalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 2,
      projection: 'globe' as any
    })

    map.current.on('load', () => {
      if (!map.current) return

      // Add atmosphere effect
      map.current.setFog({
        color: 'rgb(5, 39, 103)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(0, 0, 0)',
        'star-intensity': 0.6
      } as any)

      // Add initial data sources
      map.current.addSource('terra-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      // Add heatmap layer for fires
      map.current.addLayer({
        id: 'heat-layer',
        type: 'heatmap',
        source: 'terra-data',
        paint: {
          'heatmap-weight': {
            property: 'confidence',
            type: 'exponential',
            stops: [[0, 0], [100, 1]]
          },
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgb(0,0,255)',
            0.4, 'rgb(0,255,0)',
            0.6, 'rgb(255,255,0)',
            0.8, 'rgb(255,128,0)',
            1, 'rgb(255,0,0)'
          ],
          'heatmap-radius': {
            stops: [[11, 15], [15, 20]]
          },
          'heatmap-opacity': 0.8
        }
      })

      // Add circle layer for points
      map.current.addLayer({
        id: 'point-layer',
        type: 'circle',
        source: 'terra-data',
        paint: {
          'circle-radius': {
            base: 1.75,
            stops: [[12, 2], [22, 180]]
          },
          'circle-color': [
            'match',
            ['get', 'type'],
            'active_fire', '#ff4444',
            'earthquake', '#ffaa00',
            'weather', '#00aaff',
            '#999999'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          'circle-opacity': 0.8
        }
      })

      // Add popup on click
      map.current.on('click', 'point-layer', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return

        const coordinates = (e.features[0].geometry as any).coordinates.slice()
        const properties = e.features[0].properties

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${properties?.type || 'Unknown'}</h3>
              <p>Source: ${properties?.source || 'Unknown'}</p>
              <p>Confidence: ${properties?.confidence || 0}%</p>
              <p>Time: ${new Date(properties?.timestamp || Date.now()).toLocaleString()}</p>
            </div>
          `)
          .addTo(map.current)
      })

      // Change cursor on hover
      map.current.on('mouseenter', 'point-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'point-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update data when it changes
  useEffect(() => {
    if (!map.current || !data) return

    const source = map.current.getSource('terra-data') as mapboxgl.GeoJSONSource
    if (source && data.features) {
      source.setData(data)
    }
  }, [data])

  // Toggle layers based on activeLayer
  useEffect(() => {
    if (!map.current) return

    const visibility = activeLayer === 'fires' ? 'visible' : 'none'
    
    if (map.current.getLayer('heat-layer')) {
      map.current.setLayoutProperty('heat-layer', 'visibility', visibility)
    }
    
    if (map.current.getLayer('point-layer')) {
      map.current.setLayoutProperty('point-layer', 'visibility', 'visible')
    }
  }, [activeLayer])

  return <div ref={mapContainer} className="w-full h-full" />
}