'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { LoadingSpinner, ProgressRing, StatusBadge } from '@/components/ui'
import { formatDate, getGradeColor } from '@/lib/utils'
import { BookOpen, CalendarDays, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function StudentDashboard() {
  const { user } = useAuth()
  const studentId = user?.student?.id

  const { data, isLoading } = useQuery({
    queryKey: ['student-analytics', studentId],
    queryFn: () => analyticsApi.student(studentId!).then(r => r.data),
    enabled: !!studentId,
  })

  if (isLoading) return <LoadingSpinner text="Loading your dashboard…" />

  const stats = data?.stats || {}
  const recentRecords = (data?.records || []).slice(-7).reverse()

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="section-title">Hi, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="section-sub">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')} · {user?.student?.class?.name}</p>
      </div>

      {/* Attendance ring card */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ProgressRing pct={stats.percentage || 0} size={100} stroke={9} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-display font-bold ${getGradeColor(stats.percentage || 0)}`}>
              {stats.percentage || 0}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg mb-3">My Attendance</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Present', value: stats.present || 0, color: 'text-emerald-600' },
              { label: 'Absent', value: stats.absent || 0, color: 'text-red-500' },
              { label: 'Late', value: stats.late || 0, color: 'text-amber-500' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
          {(stats.percentage || 0) < 75 && (
            <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ Your attendance is below 75%. Please attend regularly.
            </div>
          )}
          {(stats.percentage || 0) >= 90 && (
            <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              🌟 Excellent attendance! Keep it up.
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Full Attendance', sub: 'See all records', href: '/student/attendance', icon: CalendarDays, color: 'bg-brand-600' },
          { label: 'Subjects & Topics', sub: 'What was taught', href: '/student/subjects', icon: BookOpen, color: 'bg-purple-600' },
          { label: 'My Profile', sub: 'View your details', href: '/student/profile', icon: TrendingUp, color: 'bg-amber-600' },
        ].map(a => (
          <Link key={a.label} href={a.href} className="card-hover p-5 group">
            <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <a.icon size={18} className="text-white" />
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">{a.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{a.sub}</div>
          </Link>
        ))}
      </div>

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-display font-bold text-gray-900 dark:text-white">Recent Attendance</h3>
            <Link href="/student/attendance" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentRecords.map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(rec.date)}</span>
                <div className="flex items-center gap-2">
                  {rec.isAiMarked && <span className="text-xs text-gray-400">🤖</span>}
                  <StatusBadge status={rec.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
