'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function SimpleSpinningGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let renderer: THREE.WebGLRenderer | null = null
    let animationId: number | null = null

    try {
      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)

      // Camera
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
      camera.position.z = 2.5

      // Renderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)
      } catch (err) {
        setError('WebGL not supported')
        return
      }

      // Earth sphere
      const geometry = new THREE.SphereGeometry(1, 64, 64)

      // Load texture
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(
        '/globe-textures/earth-blue-marble.jpg',
        (texture) => {
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

          // Animation
          const animate = () => {
            if (!renderer) return
            animationId = requestAnimationFrame(animate)
            earth.rotation.y += 0.003
            renderer.render(scene, camera)
          }
          animate()
        },
        undefined,
        (err) => {
          console.error('Texture load failed:', err)
          // Fallback: solid blue sphere
          const material = new THREE.MeshStandardMaterial({
            color: 0x2563eb,
            roughness: 0.9,
            metalness: 0.1
          })
          const earth = new THREE.Mesh(geometry, material)
          scene.add(earth)

          const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
          directionalLight.position.set(5, 3, 5)
          scene.add(ambientLight, directionalLight)

          const animate = () => {
            if (!renderer) return
            animationId = requestAnimationFrame(animate)
            earth.rotation.y += 0.003
            renderer.render(scene, camera)
          }
          animate()
        }
      )

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

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationId !== null) cancelAnimationFrame(animationId)
        if (renderer) {
          renderer.dispose()
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement)
          }
        }
        geometry.dispose()
      }
    } catch (err) {
      console.error('Globe error:', err)
      setError('Failed to initialize globe')
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

  return <div ref={containerRef} className="absolute inset-0" />
}