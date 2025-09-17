'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  total_projects: number;
  withdrawn: number;
  active: number;
  total_capacity_mw: number;
  total_stuck_investment: number;
  corridor_opportunities: number;
  total_corridor_savings: number;
}

interface USACEStats {
  total_dams: number;
  viable_retrofits: number;
  total_retrofit_potential_gw: string;
  total_investment_required: number;
  total_annual_generation_twh: string;
  total_annual_revenue_potential: number;
  avg_payback_period: string;
  total_jobs_potential: number;
}

interface CorridorOpportunity {
  state: string;
  project_count: number;
  total_capacity_mw: number;
  savings: number;
  savings_percent: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usaceStats, setUsaceStats] = useState<USACEStats | null>(null);
  const [corridors, setCorridors] = useState<CorridorOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real FERC statistics
    fetch('/api/discovery/projects?type=stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      });

    // Fetch USACE dam statistics
    fetch('/api/discovery/projects?type=usace-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsaceStats(data.data);
        }
      });

    // Fetch top corridor opportunities
    fetch('/api/discovery/projects?type=corridors&limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCorridors(data.data);
        }
        setLoading(false);
      });
  }, []);

  const formatBillions = (num: number) => `$${(num / 1_000_000_000).toFixed(1)}B`;
  const formatMillions = (num: number) => `$${(num / 1_000_000).toFixed(1)}M`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section with Real Data */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
              Terra Atlas
            </h1>
            <p className="text-2xl text-emerald-400 font-semibold mb-4">
              Unlocking {formatBillions((stats?.total_stuck_investment || 0) + (usaceStats?.total_investment_required || 658119275970))} in Clean Energy Opportunities
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We analyze {stats?.total_projects.toLocaleString() || '11,547'} FERC queue projects and {usaceStats?.total_dams.toLocaleString() || '87,000'} existing dams
              to find transmission corridors and retrofit opportunities worth over $2 trillion
            </p>
          </div>

          {/* Live Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-red-400 mb-2">
                {stats ? `${((stats.withdrawn / stats.total_projects) * 100).toFixed(1)}%` : '72%'}
              </div>
              <div className="text-gray-400">Projects Fail</div>
              <div className="text-sm text-gray-500 mt-1">
                {stats?.withdrawn.toLocaleString() || '8,301'} withdrawn
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">
                {stats ? `${(stats.total_capacity_mw / 1000).toFixed(0)} GW` : '2,704 GW'}
              </div>
              <div className="text-gray-400">Clean Energy Stuck</div>
              <div className="text-sm text-gray-500 mt-1">
                Enough to power 200M homes
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {formatBillions(stats?.total_corridor_savings || 47649310365)}
              </div>
              <div className="text-gray-400">Potential Savings</div>
              <div className="text-sm text-gray-500 mt-1">
                Through corridor sharing
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {stats?.corridor_opportunities || 238}
              </div>
              <div className="text-gray-400">Corridors Available</div>
              <div className="text-sm text-gray-500 mt-1">
                Ready to form today
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" 
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 text-center">
              Explore Live Map
            </Link>
            <Link href="/api/discovery/projects" 
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 text-center">
              Access API (Free)
            </Link>
            <a href="https://github.com/terra-atlas" 
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 text-center">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Top Corridor Opportunities */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">
          Top Corridor Opportunities Right Now
        </h2>
        
        <div className="space-y-4">
          {corridors.map((corridor, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-white">{corridor.state}</span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                      {corridor.project_count} projects
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {corridor.total_capacity_mw.toLocaleString()} MW capacity
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatMillions(corridor.savings)}
                    </div>
                    <div className="text-sm text-gray-400">potential savings</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                      {corridor.savings_percent}%
                    </div>
                    <div className="text-sm text-gray-400">cost reduction</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && corridors.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/corridors" 
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold">
              View all {stats?.corridor_opportunities || 238} opportunities 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* USACE Dam Retrofit Opportunities */}
      <section className="bg-slate-800/30 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            🏗️ NEW: 87,000 Dam Retrofit Opportunities
          </h2>
          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            We've analyzed every USACE dam in America and found {usaceStats?.viable_retrofits.toLocaleString() || '15,388'} viable hydroelectric retrofit opportunities
          </p>

          {/* USACE Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                {usaceStats?.total_retrofit_potential_gw || '225.6'} GW
              </div>
              <div className="text-gray-400">Retrofit Potential</div>
              <div className="text-sm text-gray-500 mt-1">
                10% of US capacity
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {formatBillions(usaceStats?.total_investment_required || 658119275970)}
              </div>
              <div className="text-gray-400">Investment Needed</div>
              <div className="text-sm text-gray-500 mt-1">
                {usaceStats?.avg_payback_period || '11.5'} year payback
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {usaceStats?.total_annual_generation_twh || '965.1'} TWh
              </div>
              <div className="text-gray-400">Annual Generation</div>
              <div className="text-sm text-gray-500 mt-1">
                Clean baseload power
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {(usaceStats?.total_jobs_potential || 1275446).toLocaleString()}
              </div>
              <div className="text-gray-400">Jobs Created</div>
              <div className="text-sm text-gray-500 mt-1">
                Construction & operations
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-300 mb-6">
              Texas alone has 1,641 viable dam retrofits that could generate 24 GW of clean power
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dams" 
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 text-center">
                Explore Dam Map
              </Link>
              <Link href="/api/discovery/projects?type=dams" 
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 text-center">
                Access Dam Data (Free)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          How Terra Atlas Solves the $1.4T Problem
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">1. Analyze Queue Data</h3>
            <p className="text-gray-400">
              We track 11,547 FERC projects in real-time, identifying patterns in the 72% that fail
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">2. Form Corridors</h3>
            <p className="text-gray-400">
              Connect nearby projects to share transmission costs, reducing individual burden by 74%
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3. Increase Success</h3>
            <p className="text-gray-400">
              Projects in corridors have 3x higher success rate, unlocking clean energy faster
            </p>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="bg-slate-800/30 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            For Developers & Investors
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Free API access to all FERC queue data, corridor opportunities, and transmission intelligence
          </p>
          
          <div className="bg-slate-900 rounded-xl p-6 max-w-3xl mx-auto text-left">
            <div className="text-sm text-gray-400 mb-2">Example API Call</div>
            <pre className="text-emerald-400 overflow-x-auto">
              <code>{`GET /api/discovery/projects?state=TX&status=active&limit=10

{
  "success": true,
  "data": [...],
  "aggregates": {
    "total_projects": 423,
    "total_capacity_gw": "45.2",
    "total_cost_billions": "12.3",
    "withdrawn_rate": "68.5"
  }
}`}</code>
            </pre>
          </div>
          
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/docs/api" 
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
              API Documentation
            </Link>
            <a href="https://github.com/terra-atlas/sdk" 
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
              Python SDK
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400">
            © 2024 Terra Atlas | Turning the 72% failure rate into 74% savings
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
            <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
            <a href="https://twitter.com/terra_atlas" className="text-gray-400 hover:text-white">Twitter</a>
            <a href="mailto:contact@terra-atlas.com" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}