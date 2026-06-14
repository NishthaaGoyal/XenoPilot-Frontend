'use client'

import { Suspense } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles, Search, ArrowRight, Users, DollarSign, Clock,
  TrendingUp, ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { generateAudience } from '@/lib/api'
import { AudienceResponse, Customer } from '@/lib/types'
import { formatCurrency, formatNumber, daysSince } from '@/lib/utils'

const EXAMPLE_QUERIES = [
  "Show premium customers who haven't purchased recently",
  'Find customers likely to churn',
  'High-value customers from Chennai and Bangalore',
  'Frequent buyers with low average spend — upsell candidates',
  'Women aged 25–40 who prefer WhatsApp',
]

function HealthDot({ status }: { status: string }) {
  const colors: Record<string, string> = { healthy: 'bg-success', at_risk: 'bg-warning', churning: 'bg-danger' }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-muted'}`} />
}

function AudienceInsightCard({ audience }: { audience: AudienceResponse }) {
  const [expanded, setExpanded] = useState(true)
  const { metrics } = audience

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Why This Audience */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.04) 100%)' }}>
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Why This Audience?</p>
              <p className="text-sm text-slate-200 leading-relaxed">{audience.explanation}</p>
            </div>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted flex-shrink-0 mt-1" />
            : <ChevronDown className="w-4 h-4 text-muted flex-shrink-0 mt-1" />}
        </button>

        {expanded && (
          <div className="mt-4 ml-11 space-y-3 border-t border-white/[0.05] pt-4">
            <p className="text-sm text-text-secondary leading-relaxed">{audience.why_selected}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Audience Size', value: formatNumber(metrics.audience_size), icon: Users, color: 'text-primary' },
                { label: 'Avg. Spend', value: formatCurrency(metrics.avg_spend), icon: DollarSign, color: 'text-success' },
                { label: 'Avg. Days Silent', value: `${metrics.avg_days_since_purchase.toFixed(0)}d`, icon: Clock, color: 'text-warning' },
                { label: 'Recoverable Rev.', value: formatCurrency(metrics.recoverable_revenue), icon: TrendingUp, color: 'text-primary' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                  <Icon className={`w-3.5 h-3.5 ${color} mb-1.5`} />
                  <p className="text-base font-bold text-white">{value}</p>
                  <p className="text-[10px] text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Filters applied */}
            <div className="flex flex-wrap gap-2 mt-3">
              {audience.filters_applied.map((f, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/15 font-mono">
                  {f.field} {f.operator} {String(f.value)}
                </span>
              ))}
            </div>

            {/* City + Channel breakdowns */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Top Cities</p>
                {Object.entries(metrics.city_breakdown)
                  .sort((a, b) => b[1] - a[1]).slice(0, 3)
                  .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-secondary">{city}</span>
                      <span className="text-white font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Preferred Channel</p>
                {Object.entries(metrics.channel_breakdown)
                  .sort((a, b) => b[1] - a[1]).slice(0, 3)
                  .map(([ch, count]) => (
                    <div key={ch} className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-secondary capitalize">{ch}</span>
                      <span className="text-white font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Build Campaign CTA */}
      <Link
        href={`/campaigns?audience=${encodeURIComponent(JSON.stringify({
          query: audience.query,
          explanation: audience.explanation,
          metrics: audience.metrics,
          filters: audience.filters_applied,
        }))}`}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        <Sparkles className="w-4 h-4" />
        Build Campaign for This Audience
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

function CustomerRow({ c }: { c: Customer }) {
  const days = daysSince(c.last_purchase_date)
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <HealthDot status={c.health_status} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
          <p className="text-xs text-muted truncate">{c.city} · {c.preferred_channel}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="text-sm font-medium text-white">{formatCurrency(c.total_spent)}</p>
        <p className="text-xs text-muted">{days < 999 ? `${days}d ago` : 'Never'}</p>
      </div>
    </div>
  )
}

// Inner component that uses useSearchParams (must be inside Suspense)
function AudiencePageInner() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [audience, setAudience] = useState<AudienceResponse | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setAudience(null)
    try {
      const result = await generateAudience(searchQuery)
      setAudience(result as AudienceResponse)
    } catch (e: any) {
      setError(e.message || 'Failed to generate audience')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Audience Builder</h1>
          <p className="text-text-secondary text-sm mt-1">
            Describe your target audience in plain English. AI will find them for you.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left – Search panel */}
          <div className="xl:col-span-2 space-y-4">
            <div className="card space-y-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Who do you want to target?
              </label>
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
                }}
                placeholder="e.g. 'Show premium customers who haven't purchased in 60 days'..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-slate-200
                  placeholder:text-muted resize-none focus:outline-none focus:border-primary/40 focus:bg-white/[0.06]
                  transition-all duration-150"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />AI is building your audience...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Find Audience</>
                )}
              </button>
            </div>

            {/* Example queries */}
            <div className="card space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Try these</p>
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); handleSearch(q) }}
                  className="w-full text-left text-xs text-text-secondary hover:text-slate-200 py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors flex items-start gap-2"
                >
                  <Search className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Right – Results */}
          <div className="xl:col-span-3 space-y-4">
            {error && (
              <div className="card border-danger/20 bg-danger-subtle p-4 text-sm text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="card border-primary/20"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.04) 100%)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">AI is analysing your query</p>
                      <p className="ai-thinking text-xs text-muted mt-0.5">
                        <span>Interpreting intent</span><span> · </span>
                        <span>Building filters</span><span> · </span>
                        <span>Querying database</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card space-y-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-12 rounded-lg" />)}
                </div>
              </div>
            )}

            {!loading && !audience && !error && (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-base font-medium text-white mb-2">Start with a question</p>
                <p className="text-sm text-muted max-w-xs">
                  Describe your audience in plain English, or pick an example query to get started.
                </p>
              </div>
            )}

            {audience && !loading && (
              <>
                <AudienceInsightCard audience={audience} />
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-white">
                      {formatNumber(audience.metrics.audience_size)} Customers Selected
                    </p>
                    <p className="text-xs text-muted">Showing first {Math.min(audience.customers.length, 100)}</p>
                  </div>
                  <div className="space-y-0 max-h-80 overflow-y-auto">
                    {audience.customers.slice(0, 100).map((c) => (
                      <CustomerRow key={c.id} c={c} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AudiencePage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="shimmer h-8 w-64 rounded" />
        <div className="shimmer h-4 w-96 rounded" />
      </div>
    }>
      <AudiencePageInner />
    </Suspense>
  )
}
