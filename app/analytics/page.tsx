'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import {
  TrendingUp, Sparkles, AlertCircle, Loader2, RefreshCw,
  ChevronDown, ArrowUpRight, CheckCircle2, MessageSquare,
  Target, Zap, ArrowRight
} from 'lucide-react'
import { listCampaigns, getCampaignAnalytics, getCampaignRecommendations } from '@/lib/api'
import { Campaign, CampaignAnalytics, CampaignInsights, Recommendation } from '@/lib/types'
import { formatCurrency, formatNumber, formatPercent, getChannelLabel } from '@/lib/utils'

// ── Funnel data builder ───────────────────────────────────────────────────────
function buildFunnel(a: CampaignAnalytics) {
  return [
    { name: 'Sent', value: a.total_sent, color: '#6366f1' },
    { name: 'Delivered', value: a.delivered, color: '#8b5cf6' },
    { name: 'Opened', value: a.opened, color: '#a78bfa' },
    { name: 'Clicked', value: a.clicked, color: '#10b981' },
    { name: 'Converted', value: a.converted, color: '#059669' },
  ]
}

function buildPieData(a: CampaignAnalytics) {
  return Object.entries(a.city_breakdown).map(([city, count], i) => ({
    name: city,
    value: count,
    color: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
  }))
}

// ── Components ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card">
      <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-danger/20 bg-danger-subtle',
  medium: 'border-warning/20 bg-warning/5',
  low: 'border-white/[0.07] bg-white/[0.02]',
}
const PRIORITY_DOTS: Record<string, string> = {
  high: 'bg-danger',
  medium: 'bg-warning',
  low: 'bg-muted',
}

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${PRIORITY_COLORS[rec.priority]}`}
      style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_DOTS[rec.priority]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-sm font-semibold text-white">{rec.title}</p>
            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-muted flex-shrink-0">
              {rec.priority}
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed mb-2">{rec.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary font-medium">{rec.estimated_impact}</span>
            <a href="/audience" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium transition-colors">
              {rec.action}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card-elevated text-xs p-3 shadow-lg">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
            {p.name}: {formatNumber(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function AnalyticsPageInner() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('campaign')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedId, setSelectedId] = useState<string>(preselected || '')
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [insights, setInsights] = useState<CampaignInsights | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listCampaigns()
      .then((c) => {
        setCampaigns(c as Campaign[])
        if (preselected) setSelectedId(preselected)
        else if ((c as Campaign[]).length > 0) setSelectedId((c as Campaign[])[0].id)
      })
      .catch(() => setError('Could not load campaigns'))
      .finally(() => setLoadingList(false))
  }, [preselected])

  useEffect(() => {
    if (!selectedId) return
    setAnalytics(null)
    setInsights(null)
    setLoadingAnalytics(true)
    getCampaignAnalytics(selectedId)
      .then((a) => setAnalytics(a as CampaignAnalytics))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingAnalytics(false))
  }, [selectedId])

  async function loadInsights() {
    if (!selectedId) return
    setLoadingInsights(true)
    try {
      const result = await getCampaignRecommendations(selectedId)
      setInsights(result as CampaignInsights)
    } catch (e: any) { setError(e.message) } finally { setLoadingInsights(false) }
  }

  const funnelData = analytics ? buildFunnel(analytics) : []
  const pieData = analytics ? buildPieData(analytics) : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Recommendations</h1>
          <p className="text-text-secondary text-sm mt-1">What happened, and what to do next.</p>
        </div>
      </div>

      {error && (
        <div className="card border-danger/20 bg-danger-subtle p-4 text-sm text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Campaign selector */}
      <div className="card">
        <label className="text-xs text-muted uppercase tracking-wider font-medium mb-2 block">Select Campaign</label>
        {loadingList ? (
          <div className="shimmer h-10 rounded-lg" />
        ) : campaigns.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertCircle className="w-4 h-4" />
            No campaigns yet. <a href="/audience" className="text-primary hover:underline">Build your first campaign →</a>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200
                appearance-none focus:outline-none focus:border-primary/40 cursor-pointer"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#0f0f1a' }}>
                  {c.name} ({c.status}) · {getChannelLabel(c.channel)} · {formatNumber(c.audience_size)} recipients
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {loadingAnalytics && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card">
              <div className="shimmer h-3 w-20 rounded mb-3" />
              <div className="shimmer h-8 w-24 rounded" />
            </div>
          ))}
        </div>
      )}

      {analytics && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <KpiCard label="Sent" value={formatNumber(analytics.total_sent)} color="text-white" />
            <KpiCard label="Delivered" value={formatNumber(analytics.delivered)} sub={`${formatPercent(analytics.delivery_rate)} rate`} color="text-primary" />
            <KpiCard label="Opened" value={formatNumber(analytics.opened)} sub={`${formatPercent(analytics.open_rate)} open rate`} color="text-primary-hover" />
            <KpiCard label="Clicked" value={formatNumber(analytics.clicked)} sub={`${formatPercent(analytics.ctr)} CTR`} color="text-success" />
            <KpiCard label="Converted" value={formatNumber(analytics.converted)} sub={formatCurrency(analytics.estimated_revenue)} color="text-success" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Funnel */}
            <div className="card xl:col-span-2">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-white">Campaign Funnel</h2>
                <p className="text-xs text-muted mt-0.5">Message delivery lifecycle</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNumber} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="customers">
                    {funnelData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* City breakdown */}
            <div className="card">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-white">City Distribution</h2>
                <p className="text-xs text-muted mt-0.5">Audience by location</p>
              </div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                        paddingAngle={2} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [formatNumber(v), '']}
                        contentStyle={{ background: '#161625', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-text-secondary">{d.name}</span>
                        </div>
                        <span className="text-white font-medium">{formatNumber(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted text-sm">
                  No city data yet — launch the campaign first.
                </div>
              )}
            </div>
          </div>

          {/* Event timeline */}
          {analytics.event_timeline.length > 0 && (
            <div className="card">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-white">Event Timeline</h2>
                <p className="text-xs text-muted mt-0.5">Events over time</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={analytics.event_timeline} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="events" stroke="#10b981" strokeWidth={2} fill="url(#timeGrad)" name="events" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">AI Next Best Action</h2>
                <p className="text-xs text-muted mt-0.5">AI-generated recommendations based on campaign results</p>
              </div>
              {!insights && (
                <button onClick={loadInsights} disabled={loadingInsights} className="btn-primary">
                  {loadingInsights ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Analysing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Generate Insights</>
                  )}
                </button>
              )}
              {insights && (
                <button onClick={loadInsights} disabled={loadingInsights} className="btn-secondary">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              )}
            </div>

            {insights && (
              <div className="space-y-4 animate-slide-up">
                {/* Summary card */}
                <div className="relative overflow-hidden rounded-xl border border-primary/20 p-5"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Campaign Summary</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                          insights.open_rate_assessment === 'excellent' ? 'bg-success/15 text-success' :
                          insights.open_rate_assessment === 'good' ? 'bg-primary/15 text-primary' :
                          'bg-warning/15 text-warning'
                        }`}>{insights.open_rate_assessment} performance</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed mb-3">{insights.summary}</p>
                      <div className="flex gap-4 text-xs text-text-secondary">
                        <span>📍 Best city: <span className="text-white font-medium">{insights.top_performing_city}</span></span>
                        <span>📢 Channel: <span className="text-white font-medium">{getChannelLabel(insights.best_channel)}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation cards */}
                <div className="space-y-3">
                  {insights.recommendations.map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* No campaigns placeholder */}
      {!loadingList && !loadingAnalytics && !analytics && campaigns.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-base font-medium text-white mb-2">No campaigns launched yet</p>
          <p className="text-sm text-muted max-w-xs mb-6">
            Launch your first campaign to see analytics and AI recommendations here.
          </p>
          <a href="/audience" className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Build Your First Campaign
          </a>
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="shimmer h-8 w-64 rounded" />
        <div className="shimmer h-4 w-96 rounded" />
      </div>
    }>
      <AnalyticsPageInner />
    </Suspense>
  )
}
