'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Megaphone, BarChart3, Sparkles, Zap, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Who needs attention?' },
  { href: '/audience', label: 'Audience Builder', icon: Users, description: 'Who should I target?' },
  { href: '/campaigns', label: 'Campaign Studio', icon: Megaphone, description: 'What should I send?' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, description: 'What happened?' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">XenoPilot</h1>
            <p className="text-[10px] text-muted">AI Campaign Copilot</p>
          </div>
        </div>
        {/* Close button – mobile only */}
        <button
          className="md:hidden text-muted hover:text-white p-1 transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, description }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:text-slate-200 hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary' : 'text-muted group-hover:text-text-secondary')} />
              <div className="min-w-0">
                <p className={cn('text-sm font-medium leading-none', active ? 'text-primary' : '')}>{label}</p>
                <p className="text-[10px] text-muted mt-0.5 leading-none">{description}</p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* AI Status */}
      <div className="px-4 py-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-primary leading-none">AI Copilot</p>
            <p className="text-[10px] text-muted mt-0.5">Active &amp; Ready</p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className="hidden md:fixed md:flex md:left-0 md:top-0 md:h-full md:w-60 md:flex-col z-40 border-r border-white/[0.05]"
        style={{ background: 'rgba(7,7,17,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <NavContent />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-white/[0.05]"
        style={{ background: 'rgba(7,7,17,0.97)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">XenoPilot</span>
        </div>
        <button
          className="text-muted hover:text-white p-1.5 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative flex flex-col w-72 h-full z-10 border-r border-white/[0.05]"
            style={{ background: 'rgba(7,7,17,0.99)', backdropFilter: 'blur(20px)' }}
          >
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
