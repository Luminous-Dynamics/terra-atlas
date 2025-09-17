'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LuminousGlobe from '@/components/LuminousGlobe'

export default function Homepage() {
  const [stats, setStats] = useState({
    totalProjects: 26961,
    totalCapacity: 2955.7,
    totalInvestment: 2082,
    countries: 60,
    activeProjects: 145,
    jobsCreated: 1380000
  })

  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Parallax effect for hero
  const heroOpacity = Math.max(0, 1 - scrollY / 600)
  const heroScale = 1 + scrollY / 2000

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Terra Atlas
              </h1>
              <span className="ml-2 text-xs text-gray-400">Global Coordination Grid</span>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-white/70 hover:text-white transition">Home</Link>
              <Link href="/explore" className="text-white/70 hover:text-white transition">Explore</Link>
              <Link href="/horizon" className="text-white/70 hover:text-white transition">Horizon</Link>
              <Link href="/invest" className="text-white/70 hover:text-white transition">Invest</Link>
              <Link href="/api" className="text-white/70 hover:text-white transition">API</Link>
              <button className="px-4 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 hover:bg-emerald-500/30 transition">
                Join Network
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Globe */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Luminous Globe Background */}
        <div className="absolute inset-0" style={{ opacity: heroOpacity, transform: `scale(${heroScale})` }}>
          <LuminousGlobe />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          <h2 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              $2.1 Trillion
            </span>
          </h2>
          <p className="text-2xl md:text-3xl text-white/80 mb-4">
            in Clean Energy Opportunities
          </p>
          <p className="text-xl text-white/60 mb-8">
            Democratizing energy investment through transparency and community ownership
          </p>
          
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.activeProjects}</div>
              <div className="text-sm text-white/60">Live Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{stats.countries}</div>
              <div className="text-sm text-white/60">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.totalCapacity.toFixed(1)} GW</div>
              <div className="text-sm text-white/60">Clean Energy</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/explore" className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition transform hover:scale-105">
              Explore Projects
            </Link>
            <Link href="/api" className="px-8 py-3 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition">
              Access Free API
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Transforming Energy Finance
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-emerald-950/20 to-emerald-950/10 border border-emerald-500/20 rounded-2xl p-8">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-4">26,961 Projects</h3>
              <p className="text-white/70">
                Real-time tracking of renewable energy projects across 60 countries. 
                From 87,000 dam retrofits to next-gen nuclear reactors.
              </p>
            </div>

            <div className="bg-gradient-to-b from-cyan-950/20 to-cyan-950/10 border border-cyan-500/20 rounded-2xl p-8">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">74% Cost Savings</h3>
              <p className="text-white/70">
                Transmission corridor sharing reduces infrastructure costs by $47.6B. 
                Smart coordination makes clean energy economically inevitable.
              </p>
            </div>

            <div className="bg-gradient-to-b from-purple-950/20 to-purple-950/10 border border-purple-500/20 rounded-2xl p-8">
              <div className="text-5xl mb-4">🏘️</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4">Community Transfer™</h3>
              <p className="text-white/70">
                After 7 years and 12% returns, projects transition to community ownership. 
                Investors win, communities thrive, energy becomes a public good.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seven Principles Section */}
      <section className="py-24 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Seven Principles of Terra Atlas
          </h2>
          <p className="text-center text-white/60 mb-16 max-w-3xl mx-auto">
            Our investment philosophy balances returns with responsibility, profit with purpose
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Coherence', icon: '🔗', color: 'emerald', desc: 'Unified vision and action' },
              { name: 'Reciprocity', icon: '🤝', color: 'blue', desc: 'Mutual benefit for all' },
              { name: 'Regeneration', icon: '🌱', color: 'purple', desc: 'Healing Earth and economy' },
              { name: 'Transparency', icon: '💎', color: 'cyan', desc: 'Open data, clear terms' },
              { name: 'Resilience', icon: '🛡️', color: 'amber', desc: 'Built to last generations' },
              { name: 'Participation', icon: '👥', color: 'pink', desc: 'Everyone can invest' },
              { name: 'Hope', icon: '✨', color: 'lime', desc: 'Optimism grounded in action' },
            ].map((principle) => (
              <div key={principle.name} className="text-center">
                <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-${principle.color}-500/20 to-${principle.color}-600/10 border border-${principle.color}-500/30 flex items-center justify-center text-3xl`}>
                  {principle.icon}
                </div>
                <h3 className={`font-bold text-${principle.color}-400 mb-1`}>{principle.name}</h3>
                <p className="text-xs text-white/50">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Impact Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
            Real Impact, Real Returns
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-amber-400 mb-4">For Investors</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">12-15% IRR with infrastructure-backed security</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">Portfolio across 26,961 vetted projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">Start with as little as $10</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">Tax advantages through renewable energy credits</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">For Communities</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">1.38 million new jobs in clean energy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">Community ownership after 7 years</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">Local energy independence and resilience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-white/80">$658B in economic development</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Big Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/10">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">2,955 GW</div>
              <div className="text-sm text-white/60">Total Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">1.38M</div>
              <div className="text-sm text-white/60">Jobs Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">174M tons</div>
              <div className="text-sm text-white/60">CO₂ Reduced/Year</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">11.5 years</div>
              <div className="text-sm text-white/60">Avg. Payback</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            How Terra Atlas Works
          </h2>

          <div className="space-y-12">
            {[
              {
                step: 1,
                title: "Discover Opportunities",
                description: "Browse 26,961 clean energy projects filtered by location, technology, and impact",
                icon: "🔍"
              },
              {
                step: 2,
                title: "Analyze Returns",
                description: "See detailed financials, environmental impact, and community benefits",
                icon: "📊"
              },
              {
                step: 3,
                title: "Invest Together",
                description: "Pool resources with other investors to fund projects at any scale",
                icon: "💰"
              },
              {
                step: 4,
                title: "Track Progress",
                description: "Monitor construction, operation, and returns through our real-time dashboard",
                icon: "📈"
              },
              {
                step: 5,
                title: "Community Transfer",
                description: "After 7 years, projects transition to local community ownership",
                icon: "🏘️"
              }
            ].map((item, index) => (
              <div key={item.step} className={`flex gap-8 items-center ${index % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-400">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white/70 text-lg">{item.description}</p>
                </div>
                <div className="text-6xl">{item.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Ready to Transform Energy?
          </h2>
          <p className="text-xl text-white/70 mb-12">
            Join thousands of investors and communities building the clean energy future
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/explore" className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/30 transition transform hover:scale-105">
              Start Exploring Projects
            </Link>
            <Link href="/api/docs" className="px-10 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 transition">
              Build with Our API
            </Link>
          </div>

          <div className="text-sm text-white/40">
            Free • Open Source • No Sign-up Required
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Terra Atlas</h3>
              <p className="text-white/60 text-sm">
                The Global Coordination Grid for clean energy investment
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/projects" className="text-white/60 hover:text-white">Projects</Link></li>
                <li><Link href="/corridors" className="text-white/60 hover:text-white">Corridors</Link></li>
                <li><Link href="/smr" className="text-white/60 hover:text-white">Nuclear SMRs</Link></li>
                <li><Link href="/dams" className="text-white/60 hover:text-white">Dam Retrofits</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">Developers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/api" className="text-white/60 hover:text-white">API Docs</Link></li>
                <li><a href="https://github.com/terra-atlas" className="text-white/60 hover:text-white">GitHub</a></li>
                <li><Link href="/data" className="text-white/60 hover:text-white">Data Sources</Link></li>
                <li><Link href="/sdk" className="text-white/60 hover:text-white">SDKs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-white/60 hover:text-white">About</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white">Contact</Link></li>
                <li><Link href="/community-transfer" className="text-white/60 hover:text-white">Community Transfer™</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/40">
            <p>© 2025 Terra Atlas. Building energy abundance for all.</p>
            <p className="mt-2">
              Made with 💚 by the Luminous Dynamics team
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}