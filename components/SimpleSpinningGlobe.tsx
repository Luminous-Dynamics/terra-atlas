'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function SimpleSpinningGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const geometryRef = useRef<THREE.SphereGeometry | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Small delay to ensure DOM is fully ready
    const initTimer = setTimeout(() => {
      try {
        // Get dimensions with fallback
        const width = containerRef.current?.clientWidth || 800
        const height = containerRef.current?.clientHeight || 600

        console.log('🌍 Initializing globe - Container dimensions:', width, height)

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000000)

        // Camera - closer for bigger globe
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
        camera.position.z = 1.6

        // Try to create WebGL renderer
        try {
          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
          })
          renderer.setSize(width, height)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

          if (containerRef.current) {
            containerRef.current.appendChild(renderer.domElement)
            rendererRef.current = renderer
            console.log('✅ WebGL renderer created successfully')
          }
        } catch (webglError) {
          console.error('❌ WebGL initialization failed:', webglError)
          setError('WebGL not available. Please use a modern browser with WebGL support.')
          return
        }

        // Create star field background
        const starsGeometry = new THREE.BufferGeometry()
        const starsMaterial = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 2,
          sizeAttenuation: true
        })

        const starsVertices = []
        for (let i = 0; i < 10000; i++) {
          const x = (Math.random() - 0.5) * 2000
          const y = (Math.random() - 0.5) * 2000
          const z = (Math.random() - 0.5) * 2000
          starsVertices.push(x, y, z)
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3))
        const starField = new THREE.Points(starsGeometry, starsMaterial)
        scene.add(starField)

        // Earth geometry - higher detail for smoother appearance
        const geometry = new THREE.SphereGeometry(1, 128, 128)
        geometryRef.current = geometry

        // Create atmosphere glow
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
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        scene.add(atmosphere)

        // Time-based lighting effects
        const hour = new Date().getHours()
        let timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'

        if (hour >= 5 && hour < 7) {
          timeOfDay = 'dawn'
        } else if (hour >= 7 && hour < 17) {
          timeOfDay = 'day'
        } else if (hour >= 17 && hour < 19) {
          timeOfDay = 'dusk'
        } else {
          timeOfDay = 'night'
        }

        console.log(`🌅 Time of day: ${timeOfDay} (${hour}:00)`)

        // Adjust atmosphere color based on time
        const atmosphereColors = {
          dawn: { r: 1.0, g: 0.5, b: 0.3 },    // Pink/orange
          day: { r: 0.3, g: 0.6, b: 1.0 },     // Bright blue
          dusk: { r: 0.8, g: 0.4, b: 0.6 },    // Purple/orange
          night: { r: 0.2, g: 0.3, b: 0.6 }    // Dark blue
        }

        const color = atmosphereColors[timeOfDay]
        atmosphereMaterial.fragmentShader = `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(${color.r}, ${color.g}, ${color.b}, 1.0) * intensity;
          }
        `
        atmosphereMaterial.needsUpdate = true

        // Adjust star visibility based on time
        starsMaterial.opacity = timeOfDay === 'night' ? 1.0 : timeOfDay === 'dusk' ? 0.7 : 0.3
        starsMaterial.transparent = true

        // Load Earth texture
        const textureLoader = new THREE.TextureLoader()

        textureLoader.load(
          '/globe-textures/earth-blue-marble.jpg',
          (texture) => {
            console.log('✅ Earth texture loaded')

            // Enable anisotropic filtering for crisp textures
            if (rendererRef.current) {
              texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy()
            }

            // Create Earth with texture
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.9,
              metalness: 0.1,
              emissive: 0x112244,
              emissiveIntensity: 0.05
            })

            const earth = new THREE.Mesh(geometry, material)
            scene.add(earth)

            // Time-based lighting intensity
            const lightIntensity = {
              dawn: { ambient: 0.8, sun: 0.9, fill: 0.4 },
              day: { ambient: 1.0, sun: 1.2, fill: 0.3 },
              dusk: { ambient: 0.7, sun: 0.8, fill: 0.5 },
              night: { ambient: 0.4, sun: 0.5, fill: 0.2 }
            }

            const lights = lightIntensity[timeOfDay]

            // Dynamic lighting based on time of day
            const ambientLight = new THREE.AmbientLight(0xffffff, lights.ambient)
            const directionalLight = new THREE.DirectionalLight(0xffffff, lights.sun)
            directionalLight.position.set(5, 3, 5)

            const fillLight = new THREE.DirectionalLight(0x4488ff, lights.fill)
            fillLight.position.set(-5, -3, -5)

            scene.add(ambientLight, directionalLight, fillLight)

            // Animation loop with smooth rotation
            const animate = () => {
              if (!rendererRef.current) return

              animationIdRef.current = requestAnimationFrame(animate)

              // Rotate Earth
              earth.rotation.y += 0.002

              // Slowly rotate atmosphere in opposite direction for depth
              atmosphere.rotation.y += 0.001

              // Subtle star rotation for dynamic background
              starField.rotation.y += 0.0001

              rendererRef.current.render(scene, camera)
            }
            animate()
          },
          undefined,
          (error) => {
            console.error('❌ Texture load failed, using fallback:', error)

            // Fallback: solid blue sphere
            const material = new THREE.MeshStandardMaterial({
              color: 0x2563eb,
              roughness: 0.9,
              metalness: 0.1
            })

            const earth = new THREE.Mesh(geometry, material)
            scene.add(earth)

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
            directionalLight.position.set(5, 3, 5)
            scene.add(ambientLight, directionalLight)

            // Animation loop with smooth rotation
            const animate = () => {
              if (!rendererRef.current) return

              animationIdRef.current = requestAnimationFrame(animate)

              // Rotate Earth
              earth.rotation.y += 0.002

              // Slowly rotate atmosphere in opposite direction for depth
              atmosphere.rotation.y += 0.001

              // Subtle star rotation for dynamic background
              starField.rotation.y += 0.0001

              rendererRef.current.render(scene, camera)
            }
            animate()
          }
        )

        // Handle window resize
        const handleResize = () => {
          if (!containerRef.current || !rendererRef.current) return

          const width = containerRef.current.clientWidth
          const height = containerRef.current.clientHeight

          camera.aspect = width / height
          camera.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
        window.addEventListener('resize', handleResize)

        // Store cleanup function
        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (err) {
        console.error('❌ Globe initialization error:', err)
        setError('Failed to initialize 3D globe')
      }
    }, 100)

    // Cleanup function
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

      if (geometryRef.current) {
        geometryRef.current.dispose()
      }
    }
  }, [])

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

  return <div ref={containerRef} className="absolute inset-0 min-h-[600px]" />
}