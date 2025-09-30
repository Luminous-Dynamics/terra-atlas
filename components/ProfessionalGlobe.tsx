'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ProfessionalGlobeProps {
  projects?: Array<{
    lat: number
    lng: number
    name: string
    type: string
    capacity: number
  }>
}

export default function ProfessionalGlobe({ projects = [] }: ProfessionalGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    let renderer: THREE.WebGLRenderer | null = null
    let animationId: number | null = null

    try {
      // Scene setup
      const scene = new THREE.Scene()

      // Camera setup
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.z = 2.5

      // Renderer setup with WebGL fallback
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)
      } catch (webglError) {
        console.error('WebGL initialization failed:', webglError)
        setError('WebGL is not available. Please use a modern browser with WebGL support.')
        setLoading(false)
        return
      }

      // Earth geometry
      const geometry = new THREE.SphereGeometry(1, 64, 64)

      // Load Earth texture with fallback
      const textureLoader = new THREE.TextureLoader()

      textureLoader.load(
        '/globe-textures/earth-blue-marble.jpg',
        (texture) => {
          // Success - create material with texture
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.2
          })

          const earth = new THREE.Mesh(geometry, material)
          scene.add(earth)

          // Lighting
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
          directionalLight.position.set(5, 3, 5)
          scene.add(ambientLight, directionalLight)

          setLoading(false)

          // Animation loop
          const animate = () => {
            if (!renderer) return

            animationId = requestAnimationFrame(animate)
            earth.rotation.y += 0.001
            renderer.render(scene, camera)
          }
          animate()
        },
        undefined,
        (err) => {
          console.error('Failed to load Earth texture:', err)

          // Fallback: use solid color if texture fails
          const fallbackMaterial = new THREE.MeshStandardMaterial({
            color: 0x2563eb, // Blue color
            roughness: 0.8,
            metalness: 0.2
          })

          const earth = new THREE.Mesh(geometry, fallbackMaterial)
          scene.add(earth)

          // Lighting
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
          directionalLight.position.set(5, 3, 5)
          scene.add(ambientLight, directionalLight)

          setLoading(false)

          // Animation loop
          const animate = () => {
            if (!renderer) return

            animationId = requestAnimationFrame(animate)
            earth.rotation.y += 0.001
            renderer.render(scene, camera)
          }
          animate()
        }
      )

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !renderer) return

        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight

        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)

        if (animationId !== null) {
          cancelAnimationFrame(animationId)
        }

        if (renderer) {
          renderer.dispose()
        }

        geometry.dispose()

        if (containerRef.current && renderer) {
          containerRef.current.removeChild(renderer.domElement)
        }
      }

    } catch (err) {
      console.error('Globe initialization error:', err)
      setError('Failed to initialize 3D globe. Please refresh the page.')
      setLoading(false)
    }
  }, [])

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-950/50 to-black">
        <div className="text-center px-6">
          <div className="text-blue-400 text-6xl mb-4">🌍</div>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-950/50 to-black">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-gray-400 text-sm">Loading globe...</p>
          </div>
        </div>
      )}
    </div>
  )
}