'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Globe, DollarSign, Users, Zap, Shield, TrendingUp, Map, BarChart3, Sparkles, Activity, Layers, Wind, Sun, Atom, Battery, Droplets } from 'lucide-react'
import { useUSACEDams } from './hooks/useUSACEDams'

// Dynamic import for Three.js components
const AnimatedGlobe = dynamic(() => import('./components/AnimatedGlobe'), { ssr: false })
const GlobeReliable = dynamic(() => import('./components/GlobeReliable'), { ssr: false })
const RealTimeUpdates = dynamic(() => import('./components/RealTimeUpdates').then(mod => ({ default: mod.RealTimeUpdates })), { ssr: false })
const LiveActivityIndicator = dynamic(() => import('./components/RealTimeUpdates').then(mod => ({ default: mod.LiveActivityIndicator })), { ssr: false })
const PriceTicker = dynamic(() => import('./components/RealTimeUpdates').then(mod => ({ default: mod.PriceTicker })), { ssr: false })

// Animated counter component
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <span>{prefix}{displayValue.toFixed(decimals).toLocaleString()}{suffix}</span>
  )
}

// Floating particles background
function ParticlesBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
    }))
    setParticles(newParticles)
  }, [])
  
  if (!particles.length) return null
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
          }}
          animate={{
            x: particle.x + (Math.random() - 0.5) * 200,
            y: particle.y + (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

export default function Homepage() {
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load USACE dams data
  const { dams, loading: damsLoading, statistics } = useUSACEDams(100)

  useEffect(() => {
    setIsLoaded(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 3000)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(featureInterval)
    }
  }, [])

  // Calculate total projects including USACE dams
  const totalProjects = 79197 + (statistics?.total_dams || 87000)
  
  const features = [
    { icon: Globe, title: '72 Billion', subtitle: 'Market Opportunity', color: 'from-blue-500 to-cyan-500' },
    { icon: DollarSign, title: '11-14%', subtitle: 'Average Returns', color: 'from-green-500 to-emerald-500' },
    { icon: Users, title: '$10', subtitle: 'Minimum Investment', color: 'from-purple-500 to-pink-500' },
    { icon: Zap, title: totalProjects.toLocaleString(), subtitle: 'Live Projects', color: 'from-yellow-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden">
      <ParticlesBackground />
      
      {/* Enhanced Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-xl border-b border-white/5"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Terra Atlas
              </h1>
              <p className="text-xs text-gray-400">Global Energy Investment Platform</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/discover" className="text-sm text-gray-300 hover:text-white transition-colors">Discover</Link>
            <Link href="/invest" className="text-sm text-gray-300 hover:text-white transition-colors">Invest</Link>
            <Link href="/portfolio" className="text-sm text-gray-300 hover:text-white transition-colors">Portfolio</Link>
            <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">About</Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-semibold shadow-lg shadow-purple-500/25"
            >
              Get Started
            </motion.button>
          </nav>
        </div>
      </motion.header>

      {/* Price Ticker */}
      <div className="fixed top-[73px] left-0 right-0 z-40">
        <PriceTicker />
      </div>

      {/* Hero Section with Enhanced Globe */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-blue-900/20"></div>
        
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Democratizing Energy Investment</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                Invest in the
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="block"
              >
                Energy Revolution
              </motion.span>
            </h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-xl text-gray-300 mb-8 leading-relaxed"
            >
              Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 font-semibold">
                <AnimatedCounter value={79197} />
              </span> global energy projects with investments starting at just $10. 
              Shape the future of sustainable energy while earning 11-14% returns.
            </motion.p>

            {/* Dynamic Feature Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.slice(0, 2).map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                    className="relative group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                      <Icon className="w-8 h-8 mb-2 text-white" />
                      <div className="text-2xl font-bold">{feature.title}</div>
                      <div className="text-sm text-gray-400">{feature.subtitle}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-lg shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                Start Investing
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors"
              >
                View Live Projects
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Globe */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative h-[600px] lg:h-[700px]"
          >
            <AnimatedGlobe />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 1.5, delay: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* Live Impact Metrics */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Real-Time Global Impact
            </h2>
            <p className="text-xl text-gray-400">
              Watch as our platform transforms the energy landscape
            </p>
            
            {/* Live Activity Indicator */}
            <div className="mt-6 flex justify-center">
              <LiveActivityIndicator />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: 'Total Investment Volume', value: 3.2, suffix: 'B', prefix: '$', decimals: 1, icon: DollarSign, trend: 23 },
              { label: 'Active Investors', value: 125000, suffix: '+', prefix: '', decimals: 0, icon: Users, trend: 18 },
              { label: 'Clean Energy Generated', value: 450, suffix: ' GW', prefix: '', decimals: 0, icon: Zap, trend: 34 },
              { label: 'CO₂ Prevented', value: 2.8, suffix: 'M tons', prefix: '', decimals: 1, icon: Shield, trend: 27 }
            ].map((metric, index) => {
              const Icon = metric.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                    <Icon className="w-10 h-10 mb-4 text-blue-400" />
                    <div className="text-3xl font-bold mb-2">
                      <AnimatedCounter 
                        value={metric.value} 
                        prefix={metric.prefix} 
                        suffix={metric.suffix}
                        decimals={metric.decimals}
                      />
                    </div>
                    <div className="text-sm text-gray-400">{metric.label}</div>
                    <div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{metric.trend}% this month</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interactive Project Types with Icons */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Diverse Energy Investment Sectors
            </h2>
            <p className="text-xl text-gray-400">
              Choose from multiple energy technologies with verified returns
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                type: 'Solar',
                icon: Sun,
                irr: '14.2%',
                projects: 28453,
                color: 'from-yellow-500 to-orange-500',
              },
              {
                type: 'Wind',
                icon: Wind,
                irr: '16.5%',
                projects: 31244,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                type: 'Nuclear',
                icon: Atom,
                irr: '12.8%',
                projects: 156,
                color: 'from-purple-500 to-pink-500',
              },
              {
                type: 'Hydro',
                icon: Droplets,
                irr: '11.3%',
                projects: 8742,
                color: 'from-cyan-500 to-blue-500',
              },
              {
                type: 'Storage',
                icon: Battery,
                irr: '15.7%',
                projects: 10602,
                color: 'from-green-500 to-emerald-500',
              }
            ].map((type, index) => {
              const Icon = type.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="relative group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${type.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all overflow-hidden">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${type.color} opacity-20 blur-3xl`}></div>
                    
                    <div className="relative">
                      <Icon className={`w-12 h-12 mb-4 bg-gradient-to-r ${type.color} bg-clip-text`} style={{ fill: 'url(#gradient)' }} />
                      <h3 className="text-xl font-bold mb-3">{type.type}</h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">IRR</span>
                          <span className={`text-xl font-bold bg-gradient-to-r ${type.color} bg-clip-text text-transparent`}>
                            {type.irr}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Projects</span>
                          <span className="font-semibold text-sm">{type.projects.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* USACE Dams Integration Section */}
      <section className="relative py-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                NEW: USACE Dam Integration
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {statistics ? (
                <>We've just added {statistics.total_dams.toLocaleString()} U.S. Army Corps of Engineers dams, 
                including {statistics.hydro_dams.toLocaleString()} with hydroelectric potential 
                totaling {statistics.total_capacity_mw.toFixed(0)} MW of capacity.</>
              ) : (
                <>Loading USACE dam data...</>
              )}
            </p>
          </motion.div>

          {/* USACE Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <Droplets className="w-8 h-8 mb-3 text-blue-400" />
              <div className="text-3xl font-bold text-white mb-2">
                {statistics ? statistics.total_dams.toLocaleString() : '87,000+'}
              </div>
              <div className="text-gray-400">Total Dams</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <Zap className="w-8 h-8 mb-3 text-yellow-400" />
              <div className="text-3xl font-bold text-white mb-2">
                {statistics ? statistics.hydro_dams.toLocaleString() : '2,500+'}
              </div>
              <div className="text-gray-400">Hydro Potential</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <Activity className="w-8 h-8 mb-3 text-green-400" />
              <div className="text-3xl font-bold text-white mb-2">
                {statistics ? Math.round(statistics.total_capacity_mw).toLocaleString() : '5,000+'} MW
              </div>
              <div className="text-gray-400">Total Capacity</div>
            </motion.div>
          </div>

          {/* Integration Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-8 border border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Integration Status</h3>
                <p className="text-gray-300">
                  USACE National Inventory of Dams data is now live on Terra Atlas
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">✓ Live</div>
                <div className="text-sm text-gray-400">Real-time data</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Advanced Analytics
                  </span>
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Make informed decisions with our AI-powered site analysis, real-time performance tracking, 
                  and comprehensive risk assessment tools.
                </p>
                
                {/* Feature List */}
                <div className="space-y-4">
                  {[
                    { icon: BarChart3, text: 'Real-time performance metrics' },
                    { icon: Map, text: 'Satellite imagery analysis' },
                    { icon: Activity, text: 'Grid connection monitoring' },
                    { icon: Layers, text: 'Multi-layer risk assessment' }
                  ].map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="text-gray-300">{item.text}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Right Visual - Replace with Real-Time Updates */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <RealTimeUpdates />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Shape the Future?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of investors already profiting from the global energy transition. 
              Start with as little as $10 today.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl font-bold text-xl shadow-2xl shadow-purple-500/25"
            >
              Create Free Account
            </motion.button>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Global Coverage</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}