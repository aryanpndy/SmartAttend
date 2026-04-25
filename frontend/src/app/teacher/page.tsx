'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi, teachersApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { StatCard, LoadingSpinner, StatusBadge } from '@/components/ui'
import { ClipboardList, BookOpen, Clock, TrendingUp, LogIn, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const teacherId = user?.teacher?.id

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['teacher-analytics', teacherId],
    queryFn: () => analyticsApi.teacher(teacherId!).then(r => r.data),
    enabled: !!teacherId,
  })

  const { data: todayAttendance } = useQuery({
    queryKey: ['teacher-today-att', teacherId],
    queryFn: () => teachersApi.attendance({ teacherId }).then(r => r.data[0]),
    enabled: !!teacherId,
  })

  const checkInMutation = useMutation({
    mutationFn: () => teachersApi.checkIn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teacher-today-att'] }); toast.success('Checked in!') },
    onError: () => toast.error('Check-in failed'),
  })

  const checkOutMutation = useMutation({
    mutationFn: () => teachersApi.checkOut(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teacher-today-att'] }); toast.success('Checked out!') },
    onError: () => toast.error('Check-out failed'),
  })

  if (isLoading) return <LoadingSpinner text="Loading your dashboard…" />

  const stats = analytics?.attendanceStats || {}
  const recentLogs = (analytics?.logs || []).slice(0, 5)

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header">
        <div>
          <h1 className="section-title">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name.split(' ')[0]}!</h1>
          <p className="section-sub">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          {!todayAttendance?.timeIn ? (
            <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending}
              className="btn-primary">
              <LogIn size={15} /> {checkInMutation.isPending ? 'Checking in…' : 'Check In'}
            </button>
          ) : !todayAttendance?.timeOut ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">In: <strong>{formatTime(todayAttendance.timeIn)}</strong></span>
              <button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending}
                className="btn-secondary">
                <LogOut size={15} /> {checkOutMutation.isPending ? 'Checking out…' : 'Check Out'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>In: <strong>{formatTime(todayAttendance.timeIn)}</strong></span>
              <span>Out: <strong>{formatTime(todayAttendance.timeOut)}</strong></span>
              <StatusBadge status="PRESENT" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Days Present" value={stats.present || 0} icon={ClipboardList} iconColor="text-emerald-600"
          sub={`of ${stats.total || 0} working days`} />
        <StatCard label="Attendance Rate" value={`${stats.total ? Math.round((stats.present / stats.total) * 100) : 0}%`}
          icon={TrendingUp} iconColor="text-brand-600" />
        <StatCard label="Teaching Logs" value={analytics?.logs?.length || 0} icon={BookOpen} iconColor="text-purple-600" />
        <StatCard label="Days Absent" value={stats.absent || 0} icon={Clock} iconColor="text-red-500" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Take Attendance', sub: 'Mark student attendance', href: '/teacher/take-attendance', color: 'bg-brand-600', icon: ClipboardList },
          { label: 'Add Teaching Log', sub: "Record today's topics", href: '/teacher/teaching-logs', color: 'bg-purple-600', icon: BookOpen },
          { label: 'View Reports', sub: 'Class performance', href: '/teacher/reports', color: 'bg-amber-600', icon: TrendingUp },
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

      {/* Recent teaching logs */}
      {recentLogs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-display font-bold text-gray-900 dark:text-white">Recent Teaching Logs</h3>
            <Link href="/teacher/teaching-logs" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={15} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{log.subject?.name}</span>
                    <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">{log.class?.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{log.topicsCovered}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(log.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
