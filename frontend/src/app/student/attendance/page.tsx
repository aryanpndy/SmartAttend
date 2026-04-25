'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge, ProgressRing } from '@/components/ui'
import { ClipboardList } from 'lucide-react'
import { formatDate, getGradeColor } from '@/lib/utils'

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const studentId = user?.student?.id
  const [months] = useState(3)

  const { data, isLoading } = useQuery({
    queryKey: ['student-analytics', studentId, months],
    queryFn: () => analyticsApi.student(studentId!, { months }).then(r => r.data),
    enabled: !!studentId,
  })

  const records = data?.records || []
  const stats = data?.stats || {}
  const monthly = data?.monthly || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Attendance" sub="Last 3 months attendance records" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Days', value: stats.total || 0, color: 'text-gray-700 dark:text-gray-300' },
          { label: 'Present', value: stats.present || 0, color: 'text-emerald-600' },
          { label: 'Absent', value: stats.absent || 0, color: 'text-red-500' },
          { label: 'Attendance %', value: `${stats.percentage || 0}%`, color: getGradeColor(stats.percentage || 0) },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Monthly Breakdown</h3>
          <div className="space-y-4">
            {monthly.map((m: any) => {
              const total = m.present + m.absent + m.late
              const pct = total ? Math.round((m.present / total) * 100) : 0
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                  </span>
                  <div className="flex-1">
                    <div className="flex gap-px h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <div className="bg-emerald-500" style={{ width: `${total ? (m.present / total) * 100 : 0}%` }} />
                      <div className="bg-amber-400" style={{ width: `${total ? (m.late / total) * 100 : 0}%` }} />
                      <div className="bg-red-500" style={{ width: `${total ? (m.absent / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className={`w-12 text-right text-sm font-bold flex-shrink-0 ${getGradeColor(pct)}`}>{pct}%</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />Late</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-full" />Absent</span>
          </div>
        </div>
      )}

      {/* Full records table */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>Date</th><th>Day</th><th>Status</th><th>Marked By</th>
            </tr></thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={4}><EmptyState icon={ClipboardList} title="No records found" /></td></tr>
              ) : [...records].reverse().map((rec: any) => (
                <tr key={rec.id}>
                  <td className="font-medium text-sm">{formatDate(rec.date)}</td>
                  <td className="text-sm text-gray-500">
                    {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                  </td>
                  <td><StatusBadge status={rec.status} /></td>
                  <td>
                    <span className="text-xs text-gray-400">
                      {rec.isAiMarked ? '🤖 AI' : '👤 Teacher'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
