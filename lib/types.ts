// Shared TypeScript types matching backend Pydantic schemas

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  city: string
  age: number
  gender: string
  preferred_channel: 'whatsapp' | 'email' | 'sms'
  total_spent: number
  last_purchase_date?: string
  health_score: number
  health_status: 'healthy' | 'at_risk' | 'churning'
  order_count: number
}

export interface DashboardStats {
  total_customers: number
  total_revenue: number
  repeat_customers: number
  at_risk_customers: number
  churning_customers: number
  healthy_customers: number
  avg_order_value: number
  ai_insight: string
  health_distribution: {
    healthy: number
    at_risk: number
    churning: number
  }
}

export interface RevenueTrendPoint {
  month: string
  revenue: number
  orders: number
}

export interface AudienceFilter {
  field: string
  operator: string
  value: string | number
}

export interface AudienceMetrics {
  audience_size: number
  avg_spend: number
  avg_days_since_purchase: number
  recoverable_revenue: number
  city_breakdown: Record<string, number>
  channel_breakdown: Record<string, number>
}

export interface AudienceResponse {
  query: string
  explanation: string
  why_selected: string
  filters_applied: AudienceFilter[]
  metrics: AudienceMetrics
  customers: Customer[]
}

export interface CampaignContent {
  name: string
  goal: string
  subject_line: string
  message_body: string
  cta: string
  channel: string
  channel_confidence: number
  channel_reasoning: string
}

export interface PredictionResult {
  predicted_open_rate: number
  predicted_ctr: number
  predicted_conversion_rate: number
  confidence_score: number
  predicted_revenue: number
}

export interface Campaign {
  id: string
  name: string
  goal: string
  channel: string
  status: 'draft' | 'active' | 'completed'
  audience_size: number
  subject_line?: string
  message_body?: string
  cta?: string
  predicted_open_rate?: number
  predicted_ctr?: number
  predicted_conversion_rate?: number
  prediction_confidence?: number
  created_at: string
  launched_at?: string
  sent?: number
}

export interface CampaignAnalytics {
  campaign_id: string
  campaign_name: string
  channel: string
  status: string
  total_sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
  failed: number
  open_rate: number
  ctr: number
  conversion_rate: number
  delivery_rate: number
  estimated_revenue: number
  city_breakdown: Record<string, number>
  event_timeline: Array<{ time: string; events: number }>
}

export interface Recommendation {
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
  estimated_impact: string
}

export interface CampaignInsights {
  campaign_id: string
  summary: string
  top_performing_city: string
  best_channel: string
  open_rate_assessment: string
  recommendations: Recommendation[]
}
