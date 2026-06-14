// Utility: merge Tailwind class names
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN')
}

export function daysSince(dateStr?: string): number {
  if (!dateStr) return 999
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function getHealthColor(status: string): string {
  switch (status) {
    case 'healthy': return 'text-success'
    case 'at_risk': return 'text-warning'
    case 'churning': return 'text-danger'
    default: return 'text-text-secondary'
  }
}

export function getChannelIcon(channel: string): string {
  switch (channel) {
    case 'whatsapp': return '💬'
    case 'sms': return '📱'
    case 'email': return '✉️'
    default: return '📢'
  }
}

export function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'whatsapp': return 'WhatsApp'
    case 'sms': return 'SMS'
    case 'email': return 'Email'
    default: return channel
  }
}
