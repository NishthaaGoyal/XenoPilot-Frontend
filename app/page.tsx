'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getDashboardStats, getRevenueTrend } from '@/lib/api'
import { DashboardStats, RevenueTrendPoint } from '@/lib/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

const HEALTH_COLORS = { healthy: '#10b981', at_risk: '#f59e0b', churning: '#ef4444' }
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa']

function StatCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub?: string; icon: React.ElementType
  color: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="card group hover:border-white/[0.12] transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-2 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5 text-danger" />
          ) : null}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="shimmer h-3 w-24 rounded mb-3" />
      <div className="shimmer h-8 w-32 rounded mb-2" />
      <div className="shimmer h-3 w-20 rounded" />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card-elevated text-xs p-3 shadow-lg">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.name === 'revenue' ? formatCurrency(p.value) : formatNumber(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDashboardStats(), getRevenueTrend()])
      .then(([s, t]) => { setStats(s as DashboardStats); setTrend(t as RevenueTrendPoint[]) })
      .catch(() => setError('Unable to connect to backend. Make sure the server is running.'))
      .finally(() => setLoading(false))
  }, [])

  const healthPieData = stats
    ? [
        { name: 'Healthy', value: stats.health_distribution.healthy, color: HEALTH_COLORS.healthy },
        { name: 'At Risk', value: stats.health_distribution.at_risk, color: HEALTH_COLORS.at_risk },
        { name: 'Churning', value: stats.health_distribution.churning, color: HEALTH_COLORS.churning },
      ]
    : []

  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">Customer Intelligence</h1>
          <p className="text-text-secondary text-sm mt-1">Here's what's happening with your customers today.</p>
        </div>
        <Link href="/audience" className="btn-primary">
          <Sparkles className="w-4 h-4" />
          Build Audience
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {error && (
        <div className="card border-danger/20 bg-danger-subtle p-4 text-sm text-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title="Total Customers"
              value={formatNumber(stats.total_customers)}
              sub={`${formatNumber(stats.repeat_customers)} repeat buyers`}
              icon={Users}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.total_revenue)}
              sub={`Avg order ₹${stats.avg_order_value.toFixed(0)}`}
              icon={DollarSign}
              color="bg-success/10 text-success"
              trend="up"
            />
            <StatCard
              title="At Risk"
              value={formatNumber(stats.at_risk_customers)}
              sub="Need re-engagement"
              icon={RefreshCw}
              color="bg-warning/10 text-warning"
              trend="down"
            />
            <StatCard
              title="Churning"
              value={formatNumber(stats.churning_customers)}
              sub="Urgent intervention needed"
              icon={AlertTriangle}
              color="bg-danger/10 text-danger"
            />
          </>
        ) : null}
      </div>

      {/* AI Insight Card */}
      {stats && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 opacity-5"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
          <div className="flex items-start gap-3 relative">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">AI Insight</p>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow" />
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{stats.ai_insight}</p>
              <Link href="/audience" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover mt-3 font-medium transition-colors">
                Build a campaign for this audience
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
              <p className="text-xs text-muted mt-0.5">Last 6 months</p>
            </div>
          </div>
          {loading ? (
            <div className="shimmer h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Health Distribution */}
        <div className="card">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">Customer Health</h2>
            <p className="text-xs text-muted mt-0.5">RFM-based segmentation</p>
          </div>
          {loading ? (
            <div className="shimmer h-48 rounded-lg" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={healthPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {healthPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), '']}
                    contentStyle={{ background: '#161625', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {healthPieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-text-secondary">{d.name}</span>
                    </div>
                    <span className="font-medium text-white">{formatNumber(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Action */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Target at-risk customers', query: 'at-risk customers who haven\'t purchased recently', href: '/audience', color: 'border-warning/20 hover:border-warning/40', icon: '⚠️' },
          { label: 'Win back churning customers', query: 'churning customers', href: '/audience', color: 'border-danger/20 hover:border-danger/40', icon: '🔄' },
          { label: 'Reward healthy customers', query: 'healthy high-value customers', href: '/audience', color: 'border-success/20 hover:border-success/40', icon: '⭐' },
        ].map((a) => (
          <Link
            key={a.label}
            href={`/audience?q=${encodeURIComponent(a.query)}`}
            className={`card group transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${a.color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.icon}</span>
                <p className="text-sm font-medium text-slate-200">{a.label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-text-secondary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
