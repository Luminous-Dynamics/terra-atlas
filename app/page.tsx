'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for globe with subtle loading
const TerraGlobe = dynamic(
  () => import('../components/TerraGlobeBackground'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-black to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 border border-emerald-500/10 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse animation-delay-200"></div>
            <div className="absolute inset-0 w-32 h-32 border border-purple-500/10 rounded-full animate-pulse animation-delay-400"></div>
          </div>
        </div>
      </div>
    )
  }
)

// Dynamic import for test panel (only in development)
const IntelligenceTestPanel = dynamic(
  () => import('../components/IntelligenceTestPanel'),
  {
    ssr: false
  }
)

export default function Homepage() {
  const [mounted, setMounted] = useState(false)
  const [hoveredPrinciple, setHoveredPrinciple] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showTestPanel, setShowTestPanel] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchStats()
    // Enable test panel in development mode
    if (process.env.NODE_ENV === 'development') {
      setShowTestPanel(true)
    }

    // Scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-revealed')
        }
      })
    }, observerOptions)

    // Observe all elements with scroll-reveal class
    const elements = document.querySelectorAll('.scroll-reveal')
    elements.forEach(el => observer.observe(el))

    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      
      if (!response.ok) {
        // Log the error but don't crash the page
        console.error('Stats API error:', response.status)
        // Use default fallback values
        setStats(null)
      } else {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Use default fallback values on network error
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/5 to-black">
        <div className="h-screen flex items-center justify-center">
          <div className="text-emerald-400/30 animate-pulse">Awakening...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation - Elegant Glass Morphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-purple-400 opacity-80" />
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-purple-400 animate-pulse-slow blur-md" />
              </div>
              <h1 className="text-xl font-light tracking-wider">
                <span className="text-white/90 font-thin">Terra</span>
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-1.5 font-normal">Atlas</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/explore" className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group">
                Explore
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/horizon" className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group">
                Horizon
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/api" className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group">
                API
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/invest" className="relative overflow-hidden px-5 py-2 rounded-full text-white/90 text-sm tracking-wide group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 group-hover:from-emerald-500/30 group-hover:via-cyan-500/30 group-hover:to-purple-500/30 transition-all" />
                <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/30 transition-all" />
                <span className="relative">Start Investing</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced Globe-Centered Design */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-cyan-950 opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        </div>
        
        {/* Globe Background - Perfectly Centered and Prominent */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <TerraGlobe />
          </div>
        </div>
        
        {/* Refined Gradient Overlays - Ultra Minimal for Maximum Globe Visibility */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />
        
        {/* Subtle Energy Pulse Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent animate-pulse-slow" />
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent animate-pulse-slower" />
        </div>
        
        {/* Hero Content - Elegantly Positioned Around Globe */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Top Section - Refined Hero Headline */}
          <div className="flex-1 flex flex-col justify-start pt-24 md:pt-32 px-6">
            <div className="text-center max-w-5xl mx-auto">
              {/* Tagline Above - Professional Typography */}
              <div className="mb-6 animate-fade-in-up">
                <span className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-400/20 rounded-full text-sm font-medium text-emerald-300/90 tracking-wide">
                  Global Energy Investment Platform
                </span>
              </div>

              {/* Main Headline - Clean and Bold */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 animate-fade-in-up animation-delay-100">
                <span className="block text-white mb-2">
                  Invest in Clean Energy
                </span>
                <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent animate-gradient-flow bg-size-200">
                  Starting at $10
                </span>
              </h1>

              {/* Subheadline - Clear Value Prop */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/70 font-light leading-relaxed mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
                AI-powered platform analyzing <span className="text-emerald-400 font-medium">4M+ renewable projects</span> worldwide.
                Earn <span className="text-cyan-400 font-medium">11-14% returns</span> while building a sustainable future.
              </p>

              {/* Technology Badges */}
              <div className="flex flex-wrap justify-center gap-3 text-sm text-white/50 animate-fade-in-up animation-delay-300">
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">☀️ Solar</span>
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">💨 Wind</span>
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">💧 Hydro</span>
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">⚛️ Nuclear</span>
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">🔋 Storage</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Clean Stats and CTA */}
          <div className="px-6 pb-20">
            <div className="max-w-6xl mx-auto">
              {/* Refined Stats Grid - Clean and Professional */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-fade-in-up animation-delay-400">
                <div className="group relative px-6 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:border-emerald-400/40 hover:bg-white/10 transition-all">
                  <div className="text-3xl font-bold text-white mb-2">10,549</div>
                  <div className="text-sm text-white/50 font-medium">Active Projects</div>
                </div>
                <div className="group relative px-6 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:border-cyan-400/40 hover:bg-white/10 transition-all">
                  <div className="text-3xl font-bold text-white mb-2">$10</div>
                  <div className="text-sm text-white/50 font-medium">Minimum Entry</div>
                </div>
                <div className="group relative px-6 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:border-purple-400/40 hover:bg-white/10 transition-all">
                  <div className="text-3xl font-bold text-white mb-2">94%</div>
                  <div className="text-sm text-white/50 font-medium">AI Accuracy</div>
                </div>
                <div className="group relative px-6 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:border-amber-400/40 hover:bg-white/10 transition-all">
                  <div className="text-3xl font-bold text-white mb-2">13.7%</div>
                  <div className="text-sm text-white/50 font-medium">Avg Returns</div>
                </div>
              </div>

              {/* Primary CTA - Simplified and Bold */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-500">
                <Link
                  href="/explore"
                  className="group relative px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold text-base transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    Explore Projects
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/api"
                  className="px-10 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white/90 font-semibold text-base hover:bg-white/10 hover:border-white/30 transition-all"
                >
                  View API Docs
                </Link>
              </div>

              {/* Trust Badges - Refined */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/40 animate-fade-in-up animation-delay-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Real-time data
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Bank-grade security
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  SEC compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border border-white/20 rounded-full p-1">
            <div className="w-1 h-3 bg-white/40 rounded-full mx-auto animate-scroll-down"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="py-24 md:py-32 px-6 relative bg-gradient-to-b from-black via-slate-950/30 to-black">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Refined Typography */}
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-400/20 rounded-full text-xs font-semibold text-emerald-300/90 tracking-wider uppercase mb-6">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Start investing in clean energy in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 - Browse */}
            <div className="group relative scroll-reveal">
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-emerald-400/30 transition-all duration-300">
                {/* Step Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-xl mb-6">
                  <span className="text-xl font-bold text-emerald-400">1</span>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-3">
                  Browse & Discover
                </h3>
                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Explore 4M+ verified energy projects worldwide. Filter by technology, location, and returns.
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {[
                    { icon: '☀️', text: 'Solar farms & rooftops' },
                    { icon: '💨', text: 'Wind on/offshore' },
                    { icon: '💧', text: 'Hydro & storage' },
                    { icon: '⚛️', text: 'Next-gen nuclear' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/50">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 2 - Invest */}
            <div className="group relative scroll-reveal" style={{ animationDelay: '200ms' }}>
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-cyan-400/30 transition-all duration-300">
                {/* Step Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl mb-6">
                  <span className="text-xl font-bold text-cyan-400">2</span>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-3">
                  Invest Any Amount
                </h3>
                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Start with just $10. Build a diversified portfolio across multiple projects and technologies.
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {[
                    { icon: '🎯', text: 'No accreditation required' },
                    { icon: '📊', text: 'Fractional ownership' },
                    { icon: '🔄', text: 'Instant diversification' },
                    { icon: '⚡', text: 'One-click checkout' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/50">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 - Earn */}
            <div className="group relative scroll-reveal" style={{ animationDelay: '400ms' }}>
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-purple-400/30 transition-all duration-300">
                {/* Step Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl mb-6">
                  <span className="text-xl font-bold text-purple-400">3</span>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-3">
                  Earn & Track Returns
                </h3>
                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Receive quarterly distributions. Track performance and environmental impact in real-time.
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {[
                    { icon: '💰', text: '11-14% average returns' },
                    { icon: '📅', text: 'Quarterly payouts' },
                    { icon: '📈', text: 'Real-time monitoring' },
                    { icon: '🌱', text: 'Impact tracking' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/50">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Generative Economics Section - Revolutionary Model */}
      <section className="py-32 px-6 bg-gradient-to-b from-black via-emerald-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6">
              <span className="text-white/80">The</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent ml-3">
                Generative Economic Model
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-3xl mx-auto">
              A revolutionary approach where the platform becomes community-owned over time, creating lasting public value
            </p>
          </div>

          {/* Timeline Visual */}
          <div className="relative mb-16">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 top-1/2 -translate-y-1/2"></div>
            <div className="grid grid-cols-3 gap-4 relative">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-black border-4 border-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-emerald-400">0-3</span>
                </div>
                <h3 className="text-lg font-medium text-emerald-400 mb-2">Building Phase</h3>
                <p className="text-sm text-white/60">Traditional VC funding, rapid scaling, 2% platform fees</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-black border-4 border-cyan-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-cyan-400">3-7</span>
                </div>
                <h3 className="text-lg font-medium text-cyan-400 mb-2">Transition Phase</h3>
                <p className="text-sm text-white/60">Community tokens issued, fees reduce to 1%, governance begins</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-black border-4 border-purple-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-400">7+</span>
                </div>
                <h3 className="text-lg font-medium text-purple-400 mb-2">Community Phase</h3>
                <p className="text-sm text-white/60">Platform owned by users, optional donations, full sovereignty</p>
              </div>
            </div>
          </div>

          {/* Chimera Model Explanation */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-black to-cyan-950/30 backdrop-blur-xl border border-emerald-400/20 rounded-3xl p-8 mb-12">
            <h3 className="text-2xl font-medium text-emerald-400 mb-6">The Luminous Chimera Structure</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg text-cyan-400 mb-3">Mission Protection</h4>
                <p className="text-white/70 mb-4">
                  A Swiss foundation holds a "golden share" with veto power, ensuring the platform's mission 
                  can never be changed by hostile takeover or profit extraction.
                </p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>✓ Legally unchangeable purpose</li>
                  <li>✓ Swiss foundation law protection</li>
                  <li>✓ Community interests safeguarded</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg text-cyan-400 mb-3">Ownership Evolution</h4>
                <p className="text-white/70 mb-4">
                  Ownership gradually transfers to the community based on participation, contribution, 
                  and readiness metrics - not arbitrary timelines.
                </p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>✓ Merit-based token distribution</li>
                  <li>✓ Smart contract automation</li>
                  <li>✓ Democratic governance model</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="text-lg font-medium text-white/80 mb-2">Aligned Incentives</h3>
              <p className="text-sm text-white/60">Early investors get returns AND ownership. Everyone wins together.</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-lg font-medium text-white/80 mb-2">Protected Mission</h3>
              <p className="text-sm text-white/60">Legal structure prevents platform from becoming extractive.</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-lg font-medium text-white/80 mb-2">Public Good</h3>
              <p className="text-sm text-white/60">Platform becomes community infrastructure for generations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Calculator Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Your Impact Calculator
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-3xl mx-auto">
              See the real-world impact of your investment in clean energy
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/20 via-black to-cyan-950/20 backdrop-blur-xl border border-emerald-400/20 rounded-3xl p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-white/60 mb-4">If you invest</p>
                <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">$100</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-white/30">→</div>
              </div>
              <div>
                <p className="text-white/60 mb-4">Annual impact</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <span className="text-emerald-400 font-semibold">2.4 tons CO₂ saved</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <span className="text-cyan-400 font-semibold">3 homes powered</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">💰</span>
                    <span className="text-amber-400 font-semibold">$11-14 returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm">
              Impact calculations based on average performance across 31 operational projects
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Elegant and Meaningful */}
      <section className="py-32 px-6 bg-gradient-to-b from-black via-gray-950/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6">
              <span className="text-white/80">Built on</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-3">
                Seven Principles
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-3xl mx-auto">
              Our investment philosophy balances returns with responsibility, creating value for all stakeholders
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🌊', name: 'Transparency', desc: 'Open data, clear terms' },
              { icon: '🌱', name: 'Regeneration', desc: 'Healing Earth & economy' },
              { icon: '⚡', name: 'Efficiency', desc: '74% cost reduction' },
              { icon: '🛡️', name: 'Resilience', desc: 'Built for generations' },
              { icon: '🤲', name: 'Access', desc: 'Everyone can invest' },
              { icon: '🔄', name: 'Transition', desc: 'Path to public good' },
              { icon: '✨', name: 'Hope', desc: 'Action over anxiety' }
            ].map((principle, i) => (
              <div 
                key={i}
                className="group text-center cursor-pointer"
                onMouseEnter={() => setHoveredPrinciple(i)}
                onMouseLeave={() => setHoveredPrinciple(null)}
              >
                <div className={`
                  w-20 h-20 mx-auto mb-4 rounded-2xl
                  flex items-center justify-center text-3xl
                  transition-all transform
                  ${hoveredPrinciple === i 
                    ? 'bg-gradient-to-br from-white/20 to-white/10 scale-110 rotate-3' 
                    : 'bg-white/5 border border-white/10'
                  }
                `}>
                  {principle.icon}
                </div>
                <h3 className="text-white/80 font-light mb-1">{principle.name}</h3>
                <p className="text-xs text-white/40">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories - Social Proof */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6">
              <span className="text-white/80">Success</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent ml-3">
                Stories
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-light text-amber-400">For Investors</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2"></div>
                  <p className="text-white/70">Average 13.7% IRR across 31 operational projects</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2"></div>
                  <p className="text-white/70">$47.6B saved through transmission corridor sharing</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2"></div>
                  <p className="text-white/70">Tax-optimized structure with renewable energy credits</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2"></div>
                  <p className="text-white/70">Quarterly distributions with full transparency</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-light text-cyan-400">For Communities</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                  <p className="text-white/70">138,000 green jobs created across 60 countries</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                  <p className="text-white/70">5 projects already transitioned to community ownership</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                  <p className="text-white/70">$658B in local economic development generated</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                  <p className="text-white/70">Energy independence for 385,000+ homes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clear Next Step */}
      <section className="py-32 px-6 bg-gradient-to-t from-emerald-950/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extralight mb-6">
            <span className="text-white/80">Ready to</span>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-3">
              Make an Impact?
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-12 max-w-2xl mx-auto">
            Join thousands of investors building the clean energy infrastructure of tomorrow. 
            Start with as little as $10.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/explore" 
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:scale-105"
            >
              Browse Live Projects
            </Link>
            <Link 
              href="/api" 
              className="px-10 py-4 bg-white/5 backdrop-blur border border-white/20 rounded-full text-white/80 hover:bg-white/10 hover:border-white/30 transition-all"
            >
              Developer API Access
            </Link>
          </div>

          <p className="text-white/30 text-sm mt-12">
            No account required to explore • SEC-compliant investment platform • Your data stays private
          </p>
        </div>
      </section>

      {/* Footer - Minimal and Professional */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-white/40 text-sm">© 2025 Terra Atlas</p>
              <p className="text-white/30 text-xs mt-1">Building energy abundance for all</p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-white/40 hover:text-white/60 text-sm transition">Privacy</Link>
              <Link href="/terms" className="text-white/40 hover:text-white/60 text-sm transition">Terms</Link>
              <Link href="/contact" className="text-white/40 hover:text-white/60 text-sm transition">Contact</Link>
              <Link href="/api" className="text-white/40 hover:text-white/60 text-sm transition">API</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scroll-down {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.1; }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glow {
          0%, 100% {
            filter: brightness(1) drop-shadow(0 0 20px rgba(16, 185, 129, 0.3));
          }
          50% {
            filter: brightness(1.1) drop-shadow(0 0 30px rgba(16, 185, 129, 0.5));
          }
        }

        /* Scroll Reveal Animation */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .scroll-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 4s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-scroll-down {
          animation: scroll-down 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 8s ease-in-out infinite;
        }

        .animate-gradient-flow {
          animation: gradient-flow 5s ease infinite;
          background-size: 200% 200%;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }

        .bg-size-200 {
          background-size: 200% 200%;
        }
      `}</style>

      {/* Intelligence Test Panel (Development Only) */}
      {showTestPanel && <IntelligenceTestPanel />}
    </div>
  )
}