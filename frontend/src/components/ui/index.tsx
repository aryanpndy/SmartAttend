'use client'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: any
  iconColor?: string
  trend?: number // positive = up, negative = down
  sub?: string
  loading?: boolean
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-brand-600', trend, sub, loading }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10', iconColor.replace('text-', 'bg-').replace('-6', '-1'))}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            trend > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
              trend < 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        {loading ? (
          <div className="skeleton h-8 w-24 mb-1" />
        ) : (
          <div className="text-3xl font-display font-bold text-gray-900 dark:text-white">{value}</div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EXCUSED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', STATUS_STYLES[status] || 'bg-gray-100 text-gray-600')}>
      <span className={cn('w-1.5 h-1.5 rounded-full',
        status === 'PRESENT' ? 'bg-emerald-500' : status === 'ABSENT' ? 'bg-red-500' :
          status === 'LATE' ? 'bg-amber-500' : 'bg-blue-500')} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ── ProgressRing ──────────────────────────────────────────────────────────────
export function ProgressRing({ pct, size = 80, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 90 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-gray-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <p className="font-semibold text-gray-600 dark:text-gray-400">{title}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="animate-spin text-brand-500" size={28} />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

// ── AttendanceBar ─────────────────────────────────────────────────────────────
export function AttendanceBar({ present, absent, late = 0 }: { present: number; absent: number; late?: number }) {
  const total = present + absent + late
  if (!total) return null
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      <div className="bg-emerald-500 transition-all" style={{ width: `${(present / total) * 100}%` }} />
      <div className="bg-amber-400 transition-all" style={{ width: `${(late / total) * 100}%` }} />
      <div className="bg-red-500 transition-all" style={{ width: `${(absent / total) * 100}%` }} />
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="section-title">{title}</h1>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-gray-400">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
