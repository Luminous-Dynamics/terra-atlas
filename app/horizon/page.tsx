'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ClimateScenario {
  year: number
  temperature: number
  seaLevel: number
  extremeEvents: number
  economicImpact: number
  energyDemand: number
  renewableCapacity: number
}

export default function HorizonPage() {
  const [selectedYear, setSelectedYear] = useState(2030)
  const [selectedScenario, setSelectedScenario] = useState('moderate')

  // Climate scenarios data
  const scenarios = {
    optimistic: {
      2030: { temperature: 1.3, seaLevel: 8, extremeEvents: 120, economicImpact: 2.1, energyDemand: 180, renewableCapacity: 65 },
      2040: { temperature: 1.5, seaLevel: 15, extremeEvents: 110, economicImpact: 3.5, energyDemand: 210, renewableCapacity: 85 },
      2050: { temperature: 1.6, seaLevel: 22, extremeEvents: 95, economicImpact: 4.2, energyDemand: 240, renewableCapacity: 95 }
    },
    moderate: {
      2030: { temperature: 1.5, seaLevel: 11, extremeEvents: 150, economicImpact: 3.5, energyDemand: 190, renewableCapacity: 55 },
      2040: { temperature: 1.9, seaLevel: 22, extremeEvents: 180, economicImpact: 6.8, energyDemand: 230, renewableCapacity: 75 },
      2050: { temperature: 2.3, seaLevel: 35, extremeEvents: 210, economicImpact: 12.4, energyDemand: 270, renewableCapacity: 85 }
    },
    pessimistic: {
      2030: { temperature: 1.7, seaLevel: 15, extremeEvents: 200, economicImpact: 5.2, energyDemand: 200, renewableCapacity: 45 },
      2040: { temperature: 2.4, seaLevel: 32, extremeEvents: 280, economicImpact: 12.5, energyDemand: 250, renewableCapacity: 60 },
      2050: { temperature: 3.2, seaLevel: 55, extremeEvents: 380, economicImpact: 28.7, energyDemand: 310, renewableCapacity: 70 }
    }
  }

  const currentData = scenarios[selectedScenario as keyof typeof scenarios][selectedYear as keyof typeof scenarios.moderate]

  // Natural disaster predictions
  const disasters = [
    { type: 'Hurricanes', current: 14, projected2030: 22, projected2050: 35, severity: 'high', region: 'Atlantic Coast' },
    { type: 'Wildfires', current: 58000, projected2030: 87000, projected2050: 145000, severity: 'extreme', region: 'Western US' },
    { type: 'Flooding', current: 98, projected2030: 156, projected2050: 267, severity: 'high', region: 'Coastal Cities' },
    { type: 'Droughts', current: 23, projected2030: 41, projected2050: 68, severity: 'severe', region: 'Southwest' },
    { type: 'Heat Waves', current: 12, projected2030: 28, projected2050: 52, severity: 'extreme', region: 'Urban Centers' },
    { type: 'Grid Failures', current: 145, projected2030: 89, projected2050: 32, severity: 'moderate', region: 'National' }
  ]

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'extreme': return 'text-red-500'
      case 'severe': return 'text-orange-500'
      case 'high': return 'text-yellow-500'
      case 'moderate': return 'text-blue-500'
      default: return 'text-gray-500'
    }
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
              <span className="ml-2 text-xs text-gray-400">/ Horizon</span>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-white/70 hover:text-white transition">Home</Link>
              <Link href="/explore" className="text-white/70 hover:text-white transition">Explore</Link>
              <Link href="/horizon" className="text-white transition">Horizon</Link>
              <Link href="/invest" className="text-white/70 hover:text-white transition">Invest</Link>
              <Link href="/api" className="text-white/70 hover:text-white transition">API</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            Climate Horizon Predictions
          </h1>
          <p className="text-xl text-white/60">
            Forecasting climate impacts and energy infrastructure resilience through 2050
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-950 border border-white/10 rounded-full p-1 inline-flex">
            {['optimistic', 'moderate', 'pessimistic'].map(scenario => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario)}
                className={`px-6 py-2 rounded-full transition capitalize ${
                  selectedScenario === scenario
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {scenario} Scenario
              </button>
            ))}
          </div>
        </div>

        {/* Year Slider */}
        <div className="mb-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/60">Timeline</span>
              <span className="text-2xl font-bold text-emerald-400">{selectedYear}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="2030"
                max="2050"
                step="10"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((selectedYear - 2030) / 20) * 100}%, #374151 ${((selectedYear - 2030) / 20) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-white/40">2030</span>
                <span className="text-xs text-white/40">2040</span>
                <span className="text-xs text-white/40">2050</span>
              </div>
            </div>
          </div>
        </div>

        {/* Climate Metrics Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          <div className="bg-gradient-to-b from-red-950/20 to-red-950/10 border border-red-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🌡️</div>
            <div className="text-2xl font-bold text-red-400">+{currentData.temperature}°C</div>
            <div className="text-xs text-white/60">Global Temperature</div>
          </div>

          <div className="bg-gradient-to-b from-blue-950/20 to-blue-950/10 border border-blue-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🌊</div>
            <div className="text-2xl font-bold text-blue-400">{currentData.seaLevel} cm</div>
            <div className="text-xs text-white/60">Sea Level Rise</div>
          </div>

          <div className="bg-gradient-to-b from-orange-950/20 to-orange-950/10 border border-orange-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-orange-400">{currentData.extremeEvents}</div>
            <div className="text-xs text-white/60">Extreme Events/Year</div>
          </div>

          <div className="bg-gradient-to-b from-purple-950/20 to-purple-950/10 border border-purple-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-purple-400">${currentData.economicImpact}T</div>
            <div className="text-xs text-white/60">Economic Impact</div>
          </div>

          <div className="bg-gradient-to-b from-yellow-950/20 to-yellow-950/10 border border-yellow-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-yellow-400">{currentData.energyDemand} PWh</div>
            <div className="text-xs text-white/60">Energy Demand</div>
          </div>

          <div className="bg-gradient-to-b from-emerald-950/20 to-emerald-950/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">♻️</div>
            <div className="text-2xl font-bold text-emerald-400">{currentData.renewableCapacity}%</div>
            <div className="text-xs text-white/60">Renewable Mix</div>
          </div>
        </div>

        {/* Natural Disaster Predictions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Natural Disaster Projections
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60 font-medium">Disaster Type</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Current (2025)</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">2030 Projection</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">2050 Projection</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Severity</th>
                  <th className="text-left py-4 px-4 text-white/60 font-medium">Primary Region</th>
                </tr>
              </thead>
              <tbody>
                {disasters.map((disaster, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{disaster.type}</div>
                    </td>
                    <td className="text-center py-4 px-4 text-white/80">
                      {disaster.current.toLocaleString()}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400 font-semibold">
                        {disaster.projected2030.toLocaleString()}
                      </span>
                      <div className="text-xs text-white/40">
                        +{Math.round((disaster.projected2030 / disaster.current - 1) * 100)}%
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-red-400 font-semibold">
                        {disaster.projected2050.toLocaleString()}
                      </span>
                      <div className="text-xs text-white/40">
                        +{Math.round((disaster.projected2050 / disaster.current - 1) * 100)}%
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`font-semibold capitalize ${getSeverityColor(disaster.severity)}`}>
                        {disaster.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white/60">
                      {disaster.region}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure Resilience */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-b from-emerald-950/20 to-emerald-950/10 border border-emerald-500/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-emerald-400 mb-6">Infrastructure Resilience</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Grid Hardening</span>
                  <span className="text-emerald-400">68% Complete</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Distributed Generation</span>
                  <span className="text-cyan-400">45% Coverage</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Emergency Backup</span>
                  <span className="text-purple-400">82% Ready</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-red-950/20 to-red-950/10 border border-red-500/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-red-400 mb-6">Critical Vulnerabilities</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">⚠️</span>
                <div>
                  <div className="text-white font-semibold">Coastal Infrastructure</div>
                  <div className="text-white/60 text-sm">23% of energy assets at risk from sea level rise</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-2">⚠️</span>
                <div>
                  <div className="text-white font-semibold">Transmission Lines</div>
                  <div className="text-white/60 text-sm">34% exposed to wildfire zones</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">⚠️</span>
                <div>
                  <div className="text-white font-semibold">Water Supply</div>
                  <div className="text-white/60 text-sm">18% of hydroelectric at drought risk</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            The Window is Closing
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-3xl mx-auto">
            Every project funded today prevents disasters tomorrow. Terra Atlas accelerates the transition 
            by making clean energy investment transparent, accessible, and profitable.
          </p>
          <Link href="/explore" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition transform hover:scale-105">
            Start Building Resilience Now
          </Link>
        </div>
      </div>
    </div>
  )
}