'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { LoadingSpinner, PageHeader, AttendanceBar } from '@/components/ui'
import { BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function AdminAnalyticsPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner text="Loading analytics…" />

  const trend = dash?.trend || []
  const classStats = dash?.classStats || []

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Analytics" sub="School-wide attendance and performance insights" />

      {/* Weekly trend */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">7-Day Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Class comparison */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Class-wise Attendance Rate (Today)</h3>
        <div className="space-y-4">
          {classStats.map((cls: any) => {
            const rate = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0
            return (
              <div key={cls.classId} className="flex items-center gap-4">
                <div className="w-24 text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">{cls.className}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{cls.present}/{cls.total} present</span>
                    <span className={`text-xs font-bold ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: dash?.summary?.totalStudents || 0, color: 'text-brand-600' },
          { label: 'Total Teachers', value: dash?.summary?.totalTeachers || 0, color: 'text-purple-600' },
          { label: 'Teachers Present Today', value: dash?.summary?.teachersPresentToday || 0, color: 'text-emerald-600' },
          { label: 'Avg Attendance Rate', value: `${dash?.summary?.attendanceRate || 0}%`, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
