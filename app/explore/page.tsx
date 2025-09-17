'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import globe for SSR safety
const Globe3D = dynamic(() => import('@/components/Globe'), {
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
  ssr: false
})

interface Project {
  id: string
  name: string
  type: string
  location: { lat: number; lon: number }
  capacity_mw: number
  status: string
  investment: number
  state: string
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [filter])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const type = filter === 'all' ? '' : `type=${filter}&`
      const response = await fetch(`/api/discovery/projects?${type}limit=500`)
      const data = await response.json()
      
      // Add location data for visualization
      const projectsWithLocation = data.projects?.map((p: any) => ({
        ...p,
        location: {
          lat: 39.8283 + (Math.random() - 0.5) * 30, // Center on US
          lon: -98.5795 + (Math.random() - 0.5) * 50
        }
      })) || []
      
      setProjects(projectsWithLocation)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
    setLoading(false)
  }

  const stats = {
    total: projects.length,
    capacity: projects.reduce((sum, p) => sum + (p.capacity_mw || 0), 0),
    investment: projects.reduce((sum, p) => sum + (p.investment || 0), 0)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Terra Atlas
              </Link>
              <span className="ml-2 text-xs text-gray-400">/ Explore</span>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-white/70 hover:text-white transition">Home</Link>
              <Link href="/explore" className="text-white transition">Explore</Link>
              <Link href="/horizon" className="text-white/70 hover:text-white transition">Horizon</Link>
              <Link href="/invest" className="text-white/70 hover:text-white transition">Invest</Link>
              <Link href="/api" className="text-white/70 hover:text-white transition">API</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 flex h-screen">
        {/* Left Panel - Filters & Stats */}
        <div className="w-80 bg-gray-950 border-r border-white/10 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Interactive Explorer
          </h2>

          {/* Stats */}
          <div className="mb-8 p-4 bg-gradient-to-b from-emerald-950/20 to-transparent border border-emerald-500/20 rounded-lg">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{stats.total}</div>
                <div className="text-xs text-white/60">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">{(stats.capacity / 1000).toFixed(1)} GW</div>
                <div className="text-xs text-white/60">Total Capacity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">${(stats.investment / 1000).toFixed(1)}B</div>
                <div className="text-xs text-white/60">Investment</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-white/80 mb-3">Filter by Type</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Projects', color: 'white' },
                { value: 'solar', label: 'Solar', color: 'yellow' },
                { value: 'wind', label: 'Wind', color: 'blue' },
                { value: 'battery', label: 'Storage', color: 'purple' },
                { value: 'hydro', label: 'Hydro', color: 'cyan' },
                { value: 'smr', label: 'Nuclear SMR', color: 'green' },
                { value: 'dams', label: 'Dam Retrofits', color: 'emerald' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    filter === option.value
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full bg-${option.color}-500 mr-2`}></span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Project */}
          {selectedProject && (
            <div className="p-4 bg-gradient-to-b from-purple-950/20 to-transparent border border-purple-500/20 rounded-lg">
              <h3 className="font-bold text-purple-400 mb-2">{selectedProject.name}</h3>
              <div className="space-y-1 text-sm">
                <p className="text-white/60">Type: <span className="text-white">{selectedProject.type}</span></p>
                <p className="text-white/60">State: <span className="text-white">{selectedProject.state}</span></p>
                <p className="text-white/60">Capacity: <span className="text-emerald-400">{selectedProject.capacity_mw} MW</span></p>
                <p className="text-white/60">Investment: <span className="text-cyan-400">${(selectedProject.investment / 1000000).toFixed(1)}M</span></p>
                <p className="text-white/60">Status: <span className="text-yellow-400">{selectedProject.status}</span></p>
              </div>
              <button className="mt-4 w-full px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition">
                View Details
              </button>
            </div>
          )}
        </div>

        {/* Globe Container */}
        <div className="flex-1 relative bg-gradient-to-b from-gray-950 to-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/60">Loading projects...</div>
            </div>
          ) : (
            <>
              <Globe3D projects={projects} />
              
              {/* Overlay Info */}
              <div className="absolute top-6 left-6 pointer-events-none">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Interactive 3D Globe</h3>
                <p className="text-sm text-white/50">Click and drag to rotate • Scroll to zoom</p>
                <p className="text-sm text-white/50">Click on projects for details</p>
              </div>

              {/* Legend */}
              <div className="absolute bottom-6 left-6 p-4 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
                <h4 className="text-xs font-semibold text-white/60 mb-2">Project Types</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-white/60">Solar</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-white/60">Wind</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-white/60">Storage</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
                    <span className="text-white/60">Hydro</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/80 hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/80 hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/80 hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}