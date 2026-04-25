'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, classesApi } from '@/lib/api'
import { StatCard, LoadingSpinner, AttendanceBar } from '@/components/ui'
import { Users, UserCheck, BookOpen, TrendingUp, Download, Camera, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { cn, formatDate, exportApi } from '@/lib/utils'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: dash, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => analyticsApi.dashboard().then(r => r.data) })

  if (isLoading) return <LoadingSpinner text="Loading dashboard…" />

  const s = dash?.summary || {}
  const COLORS = ['#10b981', '#ef4444', '#f59e0b']

  const pieData = [
    { name: 'Present', value: s.todayPresent || 0 },
    { name: 'Absent', value: s.todayAbsent || 0 },
    { name: 'Late', value: (s.todayTotal || 0) - (s.todayPresent || 0) - (s.todayAbsent || 0) },
  ].filter(d => d.value > 0)

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-sub">Overview for {formatDate(new Date())}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportApi.attendanceCsv({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })}
            className="btn-secondary gap-2">
            <Download size={15} /> Export CSV
          </button>
          <Link href="/admin/attendance" className="btn-primary">View All Attendance</Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={s.totalStudents || 0} icon={Users} iconColor="text-brand-600" />
        <StatCard label="Total Teachers" value={s.totalTeachers || 0} icon={UserCheck} iconColor="text-purple-600" />
        <StatCard label="Classes" value={s.totalClasses || 0} icon={BookOpen} iconColor="text-amber-600" />
        <StatCard label="Today's Attendance" value={`${s.attendanceRate || 0}%`} icon={TrendingUp}
          iconColor={s.attendanceRate >= 90 ? 'text-emerald-600' : s.attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'}
          sub={`${s.todayPresent || 0} / ${s.todayTotal || 0} students`} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend line */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dash?.trend || []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Today's Distribution</h3>
          {s.todayTotal > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, '']} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No attendance today</div>
          )}
        </div>
      </div>

      {/* Class stats table */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Class-wise Today</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {(dash?.classStats || []).map((cls: any) => (
            <div key={cls.classId} className="flex items-center px-6 py-4 gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{cls.className}</div>
                <AttendanceBar present={cls.present} absent={cls.total - cls.present} />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-sm text-gray-900 dark:text-white">
                  {cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400">{cls.present}/{cls.enrolled}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Add Student', href: '/admin/students', icon: Users, color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
          { label: 'Add Teacher', href: '/admin/teachers', icon: UserCheck, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
          { label: 'View Logs', href: '/admin/teaching-logs', icon: FileText, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
          { label: 'AI Attendance', href: '/admin/attendance', icon: Camera, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
        ].map(a => (
          <Link key={a.label} href={a.href} className="card-hover p-5 flex flex-col items-center gap-3 text-center">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', a.color)}>
              <a.icon size={20} />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
