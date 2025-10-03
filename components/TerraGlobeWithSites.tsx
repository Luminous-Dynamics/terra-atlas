'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createClient } from '@supabase/supabase-js'

interface Site {
  id: string
  name: string
  latitude: number
  longitude: number
  energy_type: string
  estimated_capacity_mw: number
  estimated_irr: number
  capital_cost_usd: number
  metadata?: any
}

export default function TerraGlobeWithSites() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const rotationVelocityRef = useRef({ x: 0, y: 0 })
  const markersRef = useRef<THREE.Mesh[]>([])

  // Fetch sites from Supabase
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )

        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .gte('estimated_irr', 11) // Only show viable sites (IRR > 11%)
          .limit(1000)

        if (error) {
          console.error('Error fetching sites:', error)
        } else {
          console.log(`✅ Loaded ${data?.length || 0} viable energy sites`)
          setSites(data || [])
        }
      } catch (err) {
        console.error('Error loading sites:', err)
      }
    }

    fetchSites()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const initTimer = setTimeout(() => {
      try {
        const width = containerRef.current?.clientWidth || 800
        const height = containerRef.current?.clientHeight || 600

        console.log('🌍 Creating Terra Atlas globe with real site data')

        // Scene with very dark space background
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000408)

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.z = 4.2
        camera.position.y = 0.0

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement)
          rendererRef.current = renderer
        }

        // Star field (abbreviated for brevity - same as before)
        const starLayers = []
        const stars1Geometry = new THREE.BufferGeometry()
        const stars1Vertices = []
        const stars1Colors = []
        const stars1Sizes = []

        for (let i = 0; i < 800; i++) {
          const x = (Math.random() - 0.5) * 2000
          const y = (Math.random() - 0.5) * 2000
          const z = (Math.random() - 0.5) * 2000
          stars1Vertices.push(x, y, z)

          const colorVariation = Math.random()
          stars1Colors.push(0.8 + colorVariation * 0.2, 0.85 + colorVariation * 0.15, 1.0)
          stars1Sizes.push(0.8 + Math.random() * 0.5)
        }

        stars1Geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars1Vertices, 3))
        stars1Geometry.setAttribute('color', new THREE.Float32BufferAttribute(stars1Colors, 3))
        stars1Geometry.setAttribute('size', new THREE.Float32BufferAttribute(stars1Sizes, 1))

        const stars1Material = new THREE.PointsMaterial({
          size: 1.0,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.5
        })

        const stars1 = new THREE.Points(stars1Geometry, stars1Material)
        scene.add(stars1)
        starLayers.push({ mesh: stars1, speed: 0.00002 })

        // Earth sphere
        const geometry = new THREE.SphereGeometry(1, 128, 128)

        // Progressive texture loading
        const textureLoader = new THREE.TextureLoader()
        let lowResLoaded = 0
        let highResLoaded = 0
        const totalTextures = 2

        const updateProgress = (stage: 'low' | 'high') => {
          if (stage === 'low') {
            lowResLoaded++
            const progress = (lowResLoaded / totalTextures) * 50
            setLoadingProgress(progress)
            if (lowResLoaded === totalTextures) {
              setTimeout(() => setLoading(false), 200)
            }
          } else {
            highResLoaded++
            const progress = 50 + (highResLoaded / totalTextures) * 50
            setLoadingProgress(progress)
          }
        }

        const earthTextureLow = textureLoader.load(
          '/textures/earth-blue-marble-low.webp',
          () => updateProgress('low'),
          undefined,
          () => updateProgress('low')
        )

        const boundariesTextureLow = textureLoader.load(
          '/textures/earth-topology-low.webp',
          () => updateProgress('low'),
          undefined,
          () => updateProgress('low')
        )

        let earthTexture = earthTextureLow
        let boundariesTexture = boundariesTextureLow

        // Earth shader material (same as before - abbreviated)
        const earthMaterial = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;

            void main() {
              vNormal = normalize(normalMatrix * normal);
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform sampler2D earthTexture;
            uniform sampler2D boundariesTexture;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;

            void main() {
              vec4 texColor = texture2D(earthTexture, vUv);

              float brightness = (texColor.r + texColor.g + texColor.b) / 3.0;
              float blueDominance = texColor.b - ((texColor.r + texColor.g) * 0.5);

              float isWater = smoothstep(0.05, 0.15, blueDominance);
              float isDark = smoothstep(0.20, 0.10, brightness);
              float isOcean = max(isWater, isDark);
              float isLand = 1.0 - isOcean;

              vec3 landColor = vec3(0.006, 0.028, 0.018);
              vec3 oceanColor = vec3(0.015, 0.030, 0.085);

              vec3 baseColor = mix(oceanColor, landColor, isLand);

              // Grid lines
              float gridSpacing = 20.0;
              float latLines = fract(vUv.y * 180.0 / gridSpacing);
              float lonLines = fract(vUv.x * 360.0 / gridSpacing);

              float latGrid = smoothstep(0.985, 1.0, latLines) + smoothstep(0.015, 0.0, latLines);
              float lonGrid = smoothstep(0.985, 1.0, lonLines) + smoothstep(0.015, 0.0, lonLines);
              float techGrid = max(latGrid, lonGrid);

              vec3 gridColor = vec3(0.10, 0.25, 0.30);
              baseColor = mix(baseColor, gridColor, techGrid * 0.35);

              // Rim lighting
              vec3 viewDir = normalize(vViewPosition);
              float rimPower = 2.5;
              float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
              float rimIntensity = pow(rim, rimPower);
              vec3 rimColor = vec3(0.08, 0.18, 0.22) * rimIntensity * 0.5;

              vec3 finalColor = baseColor + rimColor;

              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          uniforms: {
            time: { value: 0 },
            earthTexture: { value: earthTexture },
            boundariesTexture: { value: boundariesTexture }
          }
        })

        const earth = new THREE.Mesh(geometry, earthMaterial)
        earth.rotation.y = -0.5
        scene.add(earth)

        // Load high-res textures
        textureLoader.load('/textures/earth-blue-marble.webp', (texture) => {
          updateProgress('high')
          earthMaterial.uniforms.earthTexture.value = texture
          earthMaterial.needsUpdate = true
        })

        textureLoader.load('/textures/earth-topology.webp', (texture) => {
          updateProgress('high')
          earthMaterial.uniforms.boundariesTexture.value = texture
          earthMaterial.needsUpdate = true
        })

        // Atmosphere layers
        const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64)
        const atmosphereMaterial = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            varying vec3 vNormal;

            void main() {
              float pulse = sin(time * 0.3) * 0.08 + 0.92;
              float intensity = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
              vec3 atmosphereColor = vec3(0.05, 0.15, 0.25);
              gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.50 * pulse;
            }
          `,
          uniforms: { time: { value: 0 } },
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true
        })

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        scene.add(atmosphere)

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x667788, 0.6)
        const directionalLight = new THREE.DirectionalLight(0x99aacc, 0.5)
        directionalLight.position.set(5, 3, 5)
        scene.add(ambientLight, directionalLight)

        // 🎯 ADD SITE MARKERS FROM SUPABASE DATA
        const addSiteMarkers = (sitesData: Site[]) => {
          console.log(`📍 Adding ${sitesData.length} site markers to globe`)

          sitesData.forEach(site => {
            // Convert lat/lon to 3D coordinates
            const phi = (90 - site.latitude) * (Math.PI / 180)
            const theta = (site.longitude + 180) * (Math.PI / 180)

            const radius = 1.02 // Slightly above Earth surface
            const x = -(radius * Math.sin(phi) * Math.cos(theta))
            const z = radius * Math.sin(phi) * Math.sin(theta)
            const y = radius * Math.cos(phi)

            // Color code by IRR (return on investment)
            let color: THREE.Color
            if (site.estimated_irr >= 14) {
              color = new THREE.Color(0x00ff00) // Excellent - Green
            } else if (site.estimated_irr >= 11) {
              color = new THREE.Color(0xffff00) // Good - Yellow
            } else {
              color = new THREE.Color(0xff9900) // Fair - Orange
            }

            // Marker size based on capacity (logarithmic scale)
            const size = Math.log(site.estimated_capacity_mw + 1) * 0.006

            // Create glowing marker
            const markerGeometry = new THREE.SphereGeometry(size, 16, 16)
            const markerMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.8
            })

            const marker = new THREE.Mesh(markerGeometry, markerMaterial)
            marker.position.set(x, y, z)

            // Store site data for interaction
            marker.userData = { site }

            earth.add(marker)
            markersRef.current.push(marker)

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16)
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: 0.3,
              blending: THREE.AdditiveBlending
            })
            const glow = new THREE.Mesh(glowGeometry, glowMaterial)
            glow.position.set(x, y, z)
            earth.add(glow)
          })

          console.log('✅ Site markers added to globe')
        }

        // Add markers when sites are loaded
        if (sites.length > 0) {
          addSiteMarkers(sites)
        }

        // Mouse interaction
        let isDragging = false
        let previousMousePosition = { x: 0, y: 0 }

        const handleMouseDown = (e: MouseEvent) => {
          isDragging = true
          previousMousePosition = { x: e.clientX, y: e.clientY }
          if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing'
          }
        }

        const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x
            const deltaY = e.clientY - previousMousePosition.y

            rotationVelocityRef.current.x += deltaY * 0.002
            rotationVelocityRef.current.y += deltaX * 0.002

            previousMousePosition = { x: e.clientX, y: e.clientY }
          }
        }

        const handleMouseUp = () => {
          isDragging = false
          if (containerRef.current) {
            containerRef.current.style.cursor = 'grab'
          }
        }

        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab'
          containerRef.current.addEventListener('mousedown', handleMouseDown)
          containerRef.current.addEventListener('mousemove', handleMouseMove)
          containerRef.current.addEventListener('mouseup', handleMouseUp)
          containerRef.current.addEventListener('mouseleave', handleMouseUp)
        }

        // Animation loop
        let time = 0
        const animate = () => {
          if (!rendererRef.current) return

          animationIdRef.current = requestAnimationFrame(animate)
          time += 0.008

          earthMaterial.uniforms.time.value = time
          atmosphereMaterial.uniforms.time.value = time

          // Interactive rotation
          if (Math.abs(rotationVelocityRef.current.x) > 0.0001) {
            earth.rotation.x += rotationVelocityRef.current.x
            rotationVelocityRef.current.x *= 0.92
          }
          if (Math.abs(rotationVelocityRef.current.y) > 0.0001) {
            earth.rotation.y += rotationVelocityRef.current.y
            rotationVelocityRef.current.y *= 0.92
          }

          if (!isDragging && Math.abs(rotationVelocityRef.current.y) < 0.001) {
            earth.rotation.y += 0.0002
          }

          atmosphere.rotation.y += 0.0003

          starLayers.forEach((layer) => {
            layer.mesh.rotation.y += layer.speed
            layer.mesh.rotation.x += layer.speed * 0.5
          })

          // Pulse markers
          markersRef.current.forEach((marker, index) => {
            const pulse = Math.sin(time * 2 + index * 0.1) * 0.2 + 0.8
            marker.scale.setScalar(pulse)
          })

          camera.position.x = Math.sin(time * 0.08) * 0.01
          camera.position.y = 0.0 + Math.cos(time * 0.1) * 0.01

          renderer.render(scene, camera)
        }
        animate()

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !renderer) return

          const width = containerRef.current.clientWidth
          const height = containerRef.current.clientHeight

          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (containerRef.current) {
            containerRef.current.removeEventListener('mousedown', handleMouseDown)
            containerRef.current.removeEventListener('mousemove', handleMouseMove)
            containerRef.current.removeEventListener('mouseup', handleMouseUp)
            containerRef.current.removeEventListener('mouseleave', handleMouseUp)
          }
        }
      } catch (err) {
        console.error('❌ Globe initialization error:', err)
        setError('Failed to initialize 3D globe')
      }
    }, 100)

    return () => {
      clearTimeout(initTimer)

      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current && rendererRef.current.domElement) {
          try {
            containerRef.current.removeChild(rendererRef.current.domElement)
          } catch (e) {
            console.error('Cleanup error:', e)
          }
        }
      }
    }
  }, [sites]) // Re-run when sites data changes

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-400 text-6xl mb-4">🌍</div>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 min-h-[600px]" />

      {/* Stats overlay */}
      {sites.length > 0 && !loading && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-4 rounded-lg border border-emerald-500/30">
          <h3 className="text-emerald-400 font-semibold mb-2">🌍 Live Sites</h3>
          <p className="text-gray-300 text-sm">
            <span className="text-white font-bold">{sites.length}</span> viable projects
          </p>
          <p className="text-gray-300 text-sm">
            <span className="text-green-400">●</span> Excellent (IRR ≥14%)
          </p>
          <p className="text-gray-300 text-sm">
            <span className="text-yellow-400">●</span> Good (IRR 11-14%)
          </p>
          <p className="text-gray-300 text-sm">
            <span className="text-orange-400">●</span> Fair (IRR 8-11%)
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500 z-10">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-spin" style={{ animationDuration: '3s' }}>
              🌍
            </div>
            <p className="text-emerald-400 text-lg font-medium mb-3">
              Loading Terra Atlas...
            </p>
            <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {Math.round(loadingProgress)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
