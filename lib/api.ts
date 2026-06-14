// API client – all calls to the FastAPI backend
// NEXT_PUBLIC_API_URL must be set in Vercel environment variables
// pointing to the deployed Render backend URL (e.g. https://xenopilot-backend-xxxx.onrender.com)
const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const errText = await res.text()
    let errMsg = errText
    try {
      const errJson = JSON.parse(errText)
      if (errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errMsg = errJson.detail.map((e: any) => {
            const loc = e.loc?.join('.') || 'Field'
            return `${loc}: ${e.msg}`
          }).join(', ')
        } else if (typeof errJson.detail === 'string') {
          errMsg = errJson.detail
        }
      }
    } catch (e) {
      // fallback to raw text
    }
    throw new Error(errMsg || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Customers / Dashboard ─────────────────────────────────────────────────────

export const getDashboardStats = () =>
  request('/customers/stats')

export const getRevenueTrend = () =>
  request('/customers/revenue-trend')

export const getCustomers = (params?: { page?: number; limit?: number; health?: string }) => {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.health) q.set('health', params.health)
  return request(`/customers?${q}`)
}

// ── Audiences ─────────────────────────────────────────────────────────────────

export const generateAudience = (query: string) =>
  request('/audiences/generate', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const generateCampaign = (payload: {
  query: string
  audience_size: number
  avg_spend: number
  health_focus: string
  recoverable_revenue: number
}) =>
  request('/campaigns/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const predictOutcomes = (payload: {
  channel: string
  audience_size: number
  avg_spend: number
  health_focus: string
}) =>
  request('/campaigns/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createCampaign = (payload: object) =>
  request('/campaigns/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const launchCampaign = (campaign_id: string) =>
  request('/campaigns/launch', {
    method: 'POST',
    body: JSON.stringify({ campaign_id }),
  })

export const listCampaigns = () =>
  request('/campaigns')

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getCampaignAnalytics = (campaign_id: string) =>
  request(`/analytics/${campaign_id}`)

// ── Recommendations ───────────────────────────────────────────────────────────

export const getCampaignRecommendations = (campaign_id: string) =>
  request(`/recommendations/${campaign_id}`)
