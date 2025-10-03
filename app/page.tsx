'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import EnhancedStatCard from '../components/EnhancedStatCard'

// Dynamic import for Terra Atlas Globe with REAL site data from Supabase
const TerraGlobe = dynamic(
  () => import('../components/TerraGlobeWithSites'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 border border-blue-500/20 rounded-full animate-spin"></div>
            <p className="text-emerald-400 text-center mt-4">Loading real site data...</p>
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

// Prefetch important routes for better navigation performance
if (typeof window !== 'undefined') {
  // Prefetch explore page after initial load
  setTimeout(() => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = '/explore'
    document.head.appendChild(link)
  }, 2000)
}

export default function Homepage() {
  const [hoveredPrinciple, setHoveredPrinciple] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showTestPanel, setShowTestPanel] = useState(false)

  useEffect(() => {
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

  // Removed mounted guard - React hydration handles this automatically
  // The page now renders immediately with beautiful content

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation - Mobile Optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo - Touch Optimized */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-h-[44px] min-w-[44px]">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-purple-400 opacity-80" />
                <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-purple-400 animate-pulse-slow blur-md" />
              </div>
              <h1 className="text-lg sm:text-xl font-light tracking-wider">
                <span className="text-white/90 font-thin">Terra</span>
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-1 sm:ml-1.5 font-normal">Atlas</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="/explore" prefetch={true} className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group min-h-[44px] flex items-center">
                Explore
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/horizon" prefetch={false} className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group min-h-[44px] flex items-center">
                Horizon
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/api" prefetch={true} className="relative text-white/60 hover:text-white transition-all text-sm tracking-wide group min-h-[44px] flex items-center">
                API
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/invest" prefetch={false} className="relative overflow-hidden px-5 py-2.5 rounded-full text-white/90 text-sm tracking-wide group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 group-hover:from-emerald-500/30 group-hover:via-cyan-500/30 group-hover:to-purple-500/30 transition-all" />
                <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/30 transition-all" />
                <span className="relative">Start Investing</span>
              </Link>
            </div>

            {/* Mobile CTA Button */}
            <div className="md:hidden">
              <Link
                href="/explore"
                prefetch={true}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-sm font-semibold min-h-[44px]"
              >
                Explore
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Serene & Beautiful Design - Full height for globe */}
      <section className="relative h-screen overflow-hidden">
        {/* Calming Background Gradient - Soft & Peaceful */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent animate-pulse-slower" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/5 via-transparent to-transparent" />
        </div>
        
        {/* Globe - Fully centered on page */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <TerraGlobe />
          </div>
        </div>
        
        {/* Minimal Gradient Overlays - Maximum Globe Visibility */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
        
        {/* Subtle Energy Pulse Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent animate-pulse-slow" />
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent animate-pulse-slower" />
        </div>
        
        {/* Hero Content - Elegantly Positioned Around Globe */}
        <div className="relative z-10 h-full flex flex-col pointer-events-none">
          {/* Top Section - Mobile Optimized Hero - Extra compact for maximum globe visibility */}
          <div className="flex-1 flex flex-col justify-start pt-16 sm:pt-20 px-4 sm:px-6">
            <div className="text-center max-w-5xl mx-auto">
              {/* Tagline Above - Inspiring & Calm */}
              <div className="mb-6 sm:mb-8 animate-fade-in-up">
                <span className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-emerald-400/30 rounded-full text-xs sm:text-sm font-light text-emerald-200 tracking-wider shadow-lg shadow-emerald-500/10">
                  ✨ Building Tomorrow's Clean Energy, Together
                </span>
              </div>

              {/* Main Headline - Beautiful & Hopeful - More Compact */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-tight mb-4 sm:mb-6 animate-fade-in-up animation-delay-100 px-2">
                <span className="block text-white/95 mb-1 sm:mb-2 font-extralight">
                  Your Planet.
                </span>
                <span className="block text-white/95 mb-1 sm:mb-2 font-extralight">
                  Your Future.
                </span>
                <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 to-emerald-300 bg-clip-text text-transparent animate-shimmer bg-size-200 font-normal"
                      style={{ backgroundSize: '200% auto' }}>
                  Your Investment.
                </span>
              </h1>

              {/* Subheadline - Inspiring & Peaceful - More Compact */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/60 font-extralight leading-relaxed mb-6 sm:mb-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-200 px-4">
                <span className="block mb-2">Join thousands investing in clean energy projects worldwide.</span>
                <span className="block text-sm sm:text-base md:text-lg text-white/50">
                  From <span className="text-emerald-300 font-light">$10</span>, earn <span className="text-cyan-300 font-light">11-14% returns</span> while healing our planet.
                </span>
              </p>

              {/* Energy Types - Beautiful & Inspiring */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm sm:text-base text-white/60 animate-fade-in-up animation-delay-300 px-2">
                <span className="px-4 sm:px-5 py-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md border border-amber-400/20 rounded-full whitespace-nowrap hover:border-amber-400/40 hover:bg-amber-500/15 transition-all shadow-lg shadow-amber-500/5 animate-float hover:scale-110" style={{ animationDelay: '0ms' }}>☀️ Solar</span>
                <span className="px-4 sm:px-5 py-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-cyan-400/20 rounded-full whitespace-nowrap hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all shadow-lg shadow-cyan-500/5 animate-float hover:scale-110" style={{ animationDelay: '200ms' }}>💨 Wind</span>
                <span className="px-4 sm:px-5 py-2 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-md border border-blue-400/20 rounded-full whitespace-nowrap hover:border-blue-400/40 hover:bg-blue-500/15 transition-all shadow-lg shadow-blue-500/5 animate-float hover:scale-110" style={{ animationDelay: '400ms' }}>💧 Hydro</span>
                <span className="px-4 sm:px-5 py-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-400/20 rounded-full whitespace-nowrap hover:border-purple-400/40 hover:bg-purple-500/15 transition-all shadow-lg shadow-purple-500/5 animate-float hover:scale-110" style={{ animationDelay: '600ms' }}>⚛️ Nuclear</span>
                <span className="px-4 sm:px-5 py-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md border border-emerald-400/20 rounded-full whitespace-nowrap hover:border-emerald-400/40 hover:bg-emerald-500/15 transition-all shadow-lg shadow-emerald-500/5 animate-float hover:scale-110" style={{ animationDelay: '800ms' }}>🔋 Storage</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Compact Stats and CTA - Extra margin for globe visibility */}
          <div className="px-4 sm:px-6 pb-8 sm:pb-10 mt-auto pointer-events-auto">
            <div className="max-w-6xl mx-auto">
              {/* Compact Stats - Single Line - Minimal to not obscure globe */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 animate-fade-in-up animation-delay-400">
                <EnhancedStatCard value="106K+" label="Projects" icon="🌍" index={0} />
                <EnhancedStatCard value="$10" label="Min" icon="💎" index={1} />
                <EnhancedStatCard value="13.7%" label="Returns" icon="📈" index={2} />
                <EnhancedStatCard value="2.4t" label="CO₂/$100" icon="🌱" index={3} />
              </div>

              {/* Beautiful CTAs - Inspiring & Peaceful */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center animate-fade-in-up animation-delay-500 px-2">
                <Link
                  href="/explore"
                  prefetch={true}
                  className="group relative overflow-hidden px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-2xl text-white font-light text-base sm:text-lg transition-all hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 hover:scale-[1.02] text-center min-h-[56px] flex items-center justify-center animate-glow-pulse"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <span className="relative flex items-center gap-2.5">
                    <span className="text-xl opacity-90">🌱</span>
                    Begin Your Impact Journey
                    <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/api"
                  prefetch={true}
                  className="group relative overflow-hidden px-8 sm:px-12 py-4 sm:py-5 bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl text-white/90 font-light text-base sm:text-lg hover:bg-white/10 hover:border-white/40 hover:shadow-xl hover:shadow-white/10 hover:-translate-y-1 transition-all duration-300 text-center min-h-[56px] flex items-center justify-center"
                >
                  <span className="relative flex items-center gap-2.5">
                    <span className="text-xl opacity-80">🔌</span>
                    Integrate with API
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </Link>
              </div>

              {/* Trust Badges - Beautiful & Reassuring */}
              <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-3 sm:gap-4 animate-fade-in-up animation-delay-600 px-2">
                <span className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-emerald-500/5 backdrop-blur-md border border-emerald-400/20 rounded-full text-xs sm:text-sm text-emerald-200/80 font-light whitespace-nowrap hover:bg-emerald-500/10 hover:border-emerald-400/30 transition-all duration-300">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                  Live data streams
                </span>
                <span className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-cyan-500/5 backdrop-blur-md border border-cyan-400/20 rounded-full text-xs sm:text-sm text-cyan-200/80 font-light whitespace-nowrap hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all duration-300">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="hidden xs:inline">Bank-level security</span>
                  <span className="xs:hidden">Secure</span>
                </span>
                <span className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-blue-500/5 backdrop-blur-md border border-blue-400/20 rounded-full text-xs sm:text-sm text-blue-200/80 font-light whitespace-nowrap hover:bg-blue-500/10 hover:border-blue-400/30 transition-all duration-300">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Regulated & compliant
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

      {/* How It Works Section - Peaceful & Inspiring */}
      <section className="py-24 md:py-32 px-6 relative bg-gradient-to-b from-black via-slate-950/30 to-black">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Beautiful & Calming */}
          <div className="text-center mb-16 md:mb-20 animate-fade-in-up">
            <div className="inline-block px-5 py-2 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-emerald-400/20 rounded-full text-xs font-light text-emerald-200/90 tracking-widest uppercase mb-6 shadow-lg shadow-emerald-500/5">
              ✨ Your Journey Begins
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight mb-5 text-white/95 leading-tight">
              Three Steps to
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent font-light">
                Making an Impact
              </span>
            </h2>
            <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
              Your path to meaningful investment starts here. Simple, secure, and inspiring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 - Browse */}
            <div className="group relative scroll-reveal">
              <div className="relative bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-lg border border-emerald-400/20 rounded-3xl p-8 hover:from-emerald-500/10 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500">
                {/* Step Number Badge - Enhanced */}
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border-2 border-emerald-400/40 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
                  <span className="text-2xl font-light text-emerald-300">1</span>
                </div>

                <h3 className="text-2xl font-light text-white/95 mb-4">
                  Browse & Discover
                </h3>
                <p className="text-white/50 text-base leading-relaxed mb-6 font-light">
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
              <div className="relative bg-gradient-to-br from-cyan-500/5 to-transparent backdrop-blur-lg border border-cyan-400/20 rounded-3xl p-8 hover:from-cyan-500/10 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-500">
                {/* Step Number Badge - Enhanced */}
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 border-2 border-cyan-400/40 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/20">
                  <span className="text-2xl font-light text-cyan-300">2</span>
                </div>

                <h3 className="text-2xl font-light text-white/95 mb-4">
                  Invest Any Amount
                </h3>
                <p className="text-white/50 text-base leading-relaxed mb-6 font-light">
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
              <div className="relative bg-gradient-to-br from-purple-500/5 to-transparent backdrop-blur-lg border border-purple-400/20 rounded-3xl p-8 hover:from-purple-500/10 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500">
                {/* Step Number Badge - Enhanced */}
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-400/20 to-pink-400/20 border-2 border-purple-400/40 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                  <span className="text-2xl font-light text-purple-300">3</span>
                </div>

                <h3 className="text-2xl font-light text-white/95 mb-4">
                  Earn & Track Returns
                </h3>
                <p className="text-white/50 text-base leading-relaxed mb-6 font-light">
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

      {/* Generative Economics Section - Mobile Optimized */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-black via-emerald-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight mb-4 sm:mb-6 px-2">
              <span className="text-white/80">The</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent ml-2 sm:ml-3">
                Generative Economic Model
              </span>
            </h2>
            <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-2">
              A revolutionary approach where the platform becomes community-owned over time, creating lasting public value
            </p>
          </div>

          {/* Timeline Visual - Mobile Responsive */}
          <div className="relative mb-12 sm:mb-16">
            {/* Horizontal line - Hidden on mobile, shown on tablet+ */}
            <div className="hidden sm:block absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 top-1/2 -translate-y-1/2"></div>

            {/* Mobile: Vertical Timeline / Desktop: Horizontal Grid */}
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-8 sm:gap-4 relative">
              {/* Phase 1 */}
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-black border-4 border-emerald-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400">0-3</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-emerald-400 mb-2">Building Phase</h3>
                <p className="text-xs sm:text-sm text-white/60 px-2">Traditional VC funding, rapid scaling, 2% platform fees</p>
              </div>

              {/* Phase 2 */}
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-black border-4 border-cyan-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-cyan-400">3-7</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-cyan-400 mb-2">Transition Phase</h3>
                <p className="text-xs sm:text-sm text-white/60 px-2">Community tokens issued, fees reduce to 1%, governance begins</p>
              </div>

              {/* Phase 3 */}
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-black border-4 border-purple-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-purple-400">7+</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-purple-400 mb-2">Community Phase</h3>
                <p className="text-xs sm:text-sm text-white/60 px-2">Platform owned by users, optional donations, full sovereignty</p>
              </div>
            </div>
          </div>

          {/* Chimera Model Explanation - Mobile Optimized */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-black to-cyan-950/30 backdrop-blur-xl border border-emerald-400/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-medium text-emerald-400 mb-4 sm:mb-6">The Luminous Chimera Structure</h3>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h4 className="text-base sm:text-lg text-cyan-400 mb-2 sm:mb-3">Mission Protection</h4>
                <p className="text-sm sm:text-base text-white/70 mb-3 sm:mb-4">
                  A Swiss foundation holds a "golden share" with veto power, ensuring the platform's mission
                  can never be changed by hostile takeover or profit extraction.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/60">
                  <li>✓ Legally unchangeable purpose</li>
                  <li>✓ Swiss foundation law protection</li>
                  <li>✓ Community interests safeguarded</li>
                </ul>
              </div>
              <div>
                <h4 className="text-base sm:text-lg text-cyan-400 mb-2 sm:mb-3">Ownership Evolution</h4>
                <p className="text-sm sm:text-base text-white/70 mb-3 sm:mb-4">
                  Ownership gradually transfers to the community based on participation, contribution,
                  and readiness metrics - not arbitrary timelines.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/60">
                  <li>✓ Merit-based token distribution</li>
                  <li>✓ Smart contract automation</li>
                  <li>✓ Democratic governance model</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits Grid - Mobile Optimized */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🤝</div>
              <h3 className="text-base sm:text-lg font-medium text-white/80 mb-1.5 sm:mb-2">Aligned Incentives</h3>
              <p className="text-xs sm:text-sm text-white/60">Early investors get returns AND ownership. Everyone wins together.</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🛡️</div>
              <h3 className="text-base sm:text-lg font-medium text-white/80 mb-1.5 sm:mb-2">Protected Mission</h3>
              <p className="text-xs sm:text-sm text-white/60">Legal structure prevents platform from becoming extractive.</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center sm:col-span-2 md:col-span-1">
              <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🌍</div>
              <h3 className="text-base sm:text-lg font-medium text-white/80 mb-1.5 sm:mb-2">Public Good</h3>
              <p className="text-xs sm:text-sm text-white/60">Platform becomes community infrastructure for generations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Calculator Section - Mobile Optimized */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight mb-4 sm:mb-6 px-2">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Your Impact Calculator
              </span>
            </h2>
            <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-2">
              See the real-world impact of your investment in clean energy
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/20 via-black to-cyan-950/20 backdrop-blur-xl border border-emerald-400/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div>
                <p className="text-white/60 text-sm sm:text-base mb-3 sm:mb-4">If you invest</p>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">$100</div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="text-white/30 text-2xl">→</div>
              </div>
              <div className="md:hidden">
                <div className="text-white/30 text-2xl">↓</div>
              </div>
              <div>
                <p className="text-white/60 text-sm sm:text-base mb-3 sm:mb-4">Annual impact</p>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🌱</span>
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">2.4 tons CO₂ saved</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">⚡</span>
                    <span className="text-cyan-400 font-semibold text-sm sm:text-base">3 homes powered</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">💰</span>
                    <span className="text-amber-400 font-semibold text-sm sm:text-base">$11-14 returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <p className="text-white/40 text-xs sm:text-sm px-4">
              Impact calculations based on average performance across 31 operational projects
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Mobile Optimized */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-black via-gray-950/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight mb-4 sm:mb-6 px-2">
              <span className="text-white/80">Built on</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-2 sm:ml-3">
                Seven Principles
              </span>
            </h2>
            <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-2">
              Our investment philosophy balances returns with responsibility, creating value for all stakeholders
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
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
                  w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl
                  flex items-center justify-center text-2xl sm:text-3xl
                  transition-all transform
                  ${hoveredPrinciple === i
                    ? 'bg-gradient-to-br from-white/20 to-white/10 scale-110 rotate-3'
                    : 'bg-white/5 border border-white/10'
                  }
                `}>
                  {principle.icon}
                </div>
                <h3 className="text-white/80 font-light text-sm sm:text-base mb-1">{principle.name}</h3>
                <p className="text-xs text-white/40">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories - Mobile Optimized */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight mb-4 sm:mb-6 px-2">
              <span className="text-white/80">Success</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent ml-2 sm:ml-3">
                Stories
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 sm:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <h3 className="text-xl sm:text-2xl font-light text-amber-400">For Investors</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">Average 13.7% IRR across 31 operational projects</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">$47.6B saved through transmission corridor sharing</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">Tax-optimized structure with renewable energy credits</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">Quarterly distributions with full transparency</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <h3 className="text-xl sm:text-2xl font-light text-cyan-400">For Communities</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">138,000 green jobs created across 60 countries</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">5 projects already transitioned to community ownership</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">$658B in local economic development generated</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm sm:text-base">Energy independence for 385,000+ homes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-t from-emerald-950/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight mb-4 sm:mb-6 px-2">
            <span className="text-white/80">Ready to</span>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-2 sm:ml-3">
              Make an Impact?
            </span>
          </h2>
          <p className="text-white/50 text-sm sm:text-base md:text-lg mb-10 sm:mb-12 max-w-2xl mx-auto px-2">
            Join thousands of investors building the clean energy infrastructure of tomorrow.
            Start with as little as $10.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-2">
            <Link
              href="/explore"
              prefetch={true}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:scale-105 text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
            >
              Browse Live Projects
            </Link>
            <Link
              href="/api"
              prefetch={true}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-white/5 backdrop-blur border border-white/20 rounded-full text-white/80 hover:bg-white/10 hover:border-white/30 transition-all text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
            >
              Developer API Access
            </Link>
          </div>

          <p className="text-white/30 text-xs sm:text-sm mt-10 sm:mt-12 px-4">
            No account required to explore • SEC-compliant investment platform • Your data stays private
          </p>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-white/40 text-sm">© 2025 Terra Atlas</p>
              <p className="text-white/30 text-xs mt-1">Building energy abundance for all</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link href="/privacy" className="text-white/40 hover:text-white/60 text-xs sm:text-sm transition">Privacy</Link>
              <Link href="/terms" className="text-white/40 hover:text-white/60 text-xs sm:text-sm transition">Terms</Link>
              <Link href="/contact" className="text-white/40 hover:text-white/60 text-xs sm:text-sm transition">Contact</Link>
              <Link href="/api" className="text-white/40 hover:text-white/60 text-xs sm:text-sm transition">API</Link>
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