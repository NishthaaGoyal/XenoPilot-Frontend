'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles, Loader2, CheckCircle2, Rocket, Edit3, RotateCcw,
  MessageSquare, Mail, Smartphone, TrendingUp, AlertCircle,
  ChevronRight, Target, Zap
} from 'lucide-react'
import { generateCampaign, predictOutcomes, createCampaign, launchCampaign } from '@/lib/api'
import { CampaignContent, PredictionResult } from '@/lib/types'
import { formatCurrency, formatPercent, formatNumber, getChannelLabel } from '@/lib/utils'

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ['Audience', 'Generate', 'Predict', 'Launch']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center flex-wrap gap-1 mb-6 sm:mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            i === current ? 'bg-primary/15 text-primary border border-primary/25' :
            i < current ? 'text-success' : 'text-muted'
          }`}>
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> :
             i === current ? <span className="w-3.5 h-3.5 rounded-full border-2 border-primary inline-block" /> :
             <span className="w-3.5 h-3.5 rounded-full border border-muted/40 inline-block" />}
            {s}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className={`w-3.5 h-3.5 mx-0.5 sm:mx-1 ${i < current ? 'text-success' : 'text-muted/30'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Channel icon ──────────────────────────────────────────────────────────────
function ChannelBadge({ channel, confidence }: { channel: string; confidence: number }) {
  const icons: Record<string, React.ElementType> = { whatsapp: MessageSquare, email: Mail, sms: Smartphone }
  const colors: Record<string, string> = {
    whatsapp: 'border-green-500/20 bg-green-500/10 text-green-400',
    email: 'border-primary/20 bg-primary/10 text-primary',
    sms: 'border-warning/20 bg-warning/10 text-warning',
  }
  const Icon = icons[channel] || MessageSquare
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${colors[channel] || colors.email}`}>
      <Icon className="w-4 h-4" />
      {getChannelLabel(channel)}
      <span className="opacity-70">· {Math.round(confidence * 100)}% confidence</span>
    </div>
  )
}

// ── Prediction metric card ────────────────────────────────────────────────────
function PredMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  )
}

// ── Editable field ────────────────────────────────────────────────────────────
function EditableField({
  label, value, multiline, onChange
}: { label: string; value: string; multiline?: boolean; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted uppercase tracking-wider font-medium">{label}</p>
        <button onClick={() => setEditing(!editing)}
          className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-3 h-3" />
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="w-full bg-white/[0.05] border border-primary/30 rounded-lg px-3 py-2.5 text-sm text-slate-200 resize-none focus:outline-none focus:border-primary/50"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/[0.05] border border-primary/30 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary/50"
          />
        )
      ) : (
        <p className={`text-sm text-slate-200 ${multiline ? 'whitespace-pre-line' : ''}`}>{value}</p>
      )}
    </div>
  )
}

function CampaignsPageInner() {
  const searchParams = useSearchParams()
  const audienceParam = searchParams.get('audience')

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Audience context
  const [audienceData, setAudienceData] = useState<{
    query: string; explanation: string
    metrics: { audience_size: number; avg_spend: number; recoverable_revenue: number; channel_breakdown?: Record<string, number> }
    filters: any[]
  } | null>(null)

  // Campaign content (editable)
  const [content, setContent] = useState<CampaignContent | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)

  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)
  const [launchMsg, setLaunchMsg] = useState('')

  // Determine health focus from audience
  const healthFocus = (() => {
    if (!audienceData?.query) return 'mixed'
    const q = audienceData.query.toLowerCase()
    if (q.includes('churn')) return 'churning'
    if (q.includes('risk') || q.includes('lapsed')) return 'at_risk'
    if (q.includes('healthy') || q.includes('premium') || q.includes('vip')) return 'healthy'
    return 'mixed'
  })()

  useEffect(() => {
    if (audienceParam) {
      try {
        setAudienceData(JSON.parse(decodeURIComponent(audienceParam)))
        setStep(1)
      } catch { }
    }
  }, [audienceParam])

  async function handleGenerate() {
    if (!audienceData) return
    setLoading(true)
    setError('')
    try {
      const result = await generateCampaign({
        query: audienceData.explanation || audienceData.query,
        audience_size: audienceData.metrics.audience_size,
        avg_spend: audienceData.metrics.avg_spend,
        health_focus: healthFocus,
        recoverable_revenue: audienceData.metrics.recoverable_revenue,
      })
      setContent(result as CampaignContent)
      setStep(2)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  async function handlePredict() {
    if (!content || !audienceData) return
    setLoading(true)
    setError('')
    try {
      const result = await predictOutcomes({
        channel: content.channel,
        audience_size: audienceData.metrics.audience_size,
        avg_spend: audienceData.metrics.avg_spend,
        health_focus: healthFocus,
      })
      setPrediction(result as PredictionResult)

      // Also persist campaign to DB
      const saved = await createCampaign({
        name: content.name,
        goal: content.goal,
        channel: content.channel,
        audience_filters: audienceData.filters || [],
        audience_size: audienceData.metrics.audience_size,
        subject_line: content.subject_line,
        message_body: content.message_body,
        cta: content.cta,
        predicted_open_rate: (result as PredictionResult).predicted_open_rate,
        predicted_ctr: (result as PredictionResult).predicted_ctr,
        predicted_conversion_rate: (result as PredictionResult).predicted_conversion_rate,
        prediction_confidence: (result as PredictionResult).confidence_score,
      }) as any

      setCampaignId(saved.id)
      setStep(3)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  async function handleLaunch() {
    if (!campaignId) return
    setLoading(true)
    setError('')
    try {
      const result = await launchCampaign(campaignId) as any
      setLaunchMsg(result.message || 'Campaign launched!')
      setLaunched(true)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  // ── No audience yet ───────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Campaign Studio</h1>
          <p className="text-text-secondary text-sm mb-8">Build a campaign from start to launch with AI guidance.</p>
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-base font-medium text-white mb-2">Start with an audience</p>
            <p className="text-sm text-muted max-w-xs mb-6">
              Go to the Audience Builder first to find who you want to target, then come back here to build your campaign.
            </p>
            <a href="/audience" className="btn-primary">
              <Sparkles className="w-4 h-4" />
              Find Your Audience
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Launched success ──────────────────────────────────────────────────────
  if (launched) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Launched! 🚀</h2>
            <p className="text-text-secondary mb-6 max-w-sm mx-auto">{launchMsg}</p>
            <div className="flex gap-3 justify-center">
              {campaignId && (
                <a href={`/analytics?campaign=${campaignId}`} className="btn-primary">
                  <TrendingUp className="w-4 h-4" />
                  View Analytics
                </a>
              )}
              <a href="/audience" className="btn-secondary">
                <RotateCcw className="w-4 h-4" />
                New Campaign
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Campaign Studio</h1>
          <p className="text-text-secondary text-sm mt-1">AI-assisted campaign creation, from copy to channel.</p>
        </div>

        <StepBar current={step - 1} />

        {error && (
          <div className="card border-danger/20 bg-danger-subtle p-4 text-sm text-danger flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1 – Audience Review */}
        {step === 1 && audienceData && (
          <div className="space-y-4 animate-slide-up">
            <div className="card space-y-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Target Audience</p>
                <p className="text-sm text-slate-200 leading-relaxed">{audienceData.explanation}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] text-center">
                  <p className="text-xl font-bold text-white">{formatNumber(audienceData.metrics.audience_size)}</p>
                  <p className="text-xs text-muted mt-0.5">Customers</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] text-center">
                  <p className="text-xl font-bold text-white">{formatCurrency(audienceData.metrics.avg_spend)}</p>
                  <p className="text-xs text-muted mt-0.5">Avg. Spend</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] text-center">
                  <p className="text-xl font-bold text-primary">{formatCurrency(audienceData.metrics.recoverable_revenue)}</p>
                  <p className="text-xs text-muted mt-0.5">Recoverable Rev.</p>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating campaign...</> :
                <><Sparkles className="w-4 h-4" />Generate Campaign with AI</>}
            </button>
          </div>
        )}

        {/* STEP 2 – Campaign Content + Channel */}
        {step === 2 && content && (
          <div className="space-y-4 animate-slide-up">
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider font-medium mb-0.5">Campaign Generated</p>
                  <p className="font-semibold text-white">{content.name}</p>
                </div>
                <button onClick={() => { setContent(null); setStep(1) }}
                  className="text-xs text-muted hover:text-text-secondary flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Regenerate
                </button>
              </div>

              <div className="h-px bg-white/[0.05]" />

              <EditableField label="Campaign Goal" value={content.goal}
                onChange={(v) => setContent({ ...content, goal: v })} />

              <EditableField label="Subject / Opening Line" value={content.subject_line}
                onChange={(v) => setContent({ ...content, subject_line: v })} />

              <EditableField label="Message Body" value={content.message_body} multiline
                onChange={(v) => setContent({ ...content, message_body: v })} />

              <EditableField label="Call to Action" value={content.cta}
                onChange={(v) => setContent({ ...content, cta: v })} />

              <div className="h-px bg-white/[0.05]" />

              {/* Channel recommendation */}
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Recommended Channel</p>
                <ChannelBadge channel={content.channel} confidence={content.channel_confidence} />
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">{content.channel_reasoning}</p>
              </div>
            </div>

            <button onClick={handlePredict} disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Predicting outcomes...</> :
                <><Zap className="w-4 h-4" />Predict Campaign Outcomes</>}
            </button>
          </div>
        )}

        {/* STEP 3 – Predictions + Launch */}
        {step === 3 && prediction && content && (
          <div className="space-y-4 animate-slide-up">
            {/* Prediction card */}
            <div className="relative overflow-hidden rounded-xl border border-primary/20 p-5"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.04) 100%)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Pre-launch Prediction</p>
                <span className="ml-auto text-xs text-muted">
                  Confidence: {formatPercent(prediction.confidence_score)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <PredMetric label="Predicted Open Rate" value={formatPercent(prediction.predicted_open_rate)} color="text-primary" />
                <PredMetric label="Predicted Click Rate" value={formatPercent(prediction.predicted_ctr)} color="text-success" />
                <PredMetric label="Conversion Rate" value={formatPercent(prediction.predicted_conversion_rate)} color="text-warning" />
                <PredMetric label="Predicted Revenue" value={formatCurrency(prediction.predicted_revenue)} color="text-primary" />
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                  <span>Prediction confidence</span>
                  <span>{Math.round(prediction.confidence_score * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                    style={{ width: `${prediction.confidence_score * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Campaign summary */}
            <div className="card space-y-3">
              <p className="text-xs text-muted uppercase tracking-wider font-medium">Ready to Launch</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted">Campaign:</span> <span className="text-slate-200 font-medium">{content.name}</span></div>
                <div><span className="text-muted">Channel:</span> <span className="text-slate-200 font-medium">{getChannelLabel(content.channel)}</span></div>
                <div><span className="text-muted">Audience:</span> <span className="text-slate-200 font-medium">{formatNumber(audienceData?.metrics.audience_size || 0)} customers</span></div>
                <div><span className="text-muted">Goal:</span> <span className="text-slate-200 font-medium">{content.goal.slice(0, 40)}…</span></div>
              </div>
            </div>

            <button onClick={handleLaunch} disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base
                bg-gradient-to-r from-primary via-violet-500 to-purple-600
                hover:shadow-glow-primary hover:scale-[1.01] transition-all duration-200
                flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Launching...</> :
                <><Rocket className="w-5 h-5" />Launch Campaign Now</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="shimmer h-8 w-64 rounded" />
        <div className="shimmer h-4 w-96 rounded" />
      </div>
    }>
      <CampaignsPageInner />
    </Suspense>
  )
}
