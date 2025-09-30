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

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
        camera.position.z = 2.5

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

        // Earth geometry
        const geometry = new THREE.SphereGeometry(1, 64, 64)
        geometryRef.current = geometry

        // Load Earth texture
        const textureLoader = new THREE.TextureLoader()

        textureLoader.load(
          '/globe-textures/earth-blue-marble.jpg',
          (texture) => {
            console.log('✅ Earth texture loaded')

            // Create Earth with texture
            const material = new THREE.MeshStandardMaterial({
              map: texture,
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

            // Animation loop
            const animate = () => {
              if (!rendererRef.current) return

              animationIdRef.current = requestAnimationFrame(animate)
              earth.rotation.y += 0.003
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

            // Animation loop
            const animate = () => {
              if (!rendererRef.current) return

              animationIdRef.current = requestAnimationFrame(animate)
              earth.rotation.y += 0.003
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