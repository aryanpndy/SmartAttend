'use client'
import { useQuery } from '@tanstack/react-query'
import { teachersApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge } from '@/components/ui'
import { UserCheck } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function TeacherAttendancePage() {
  const { user } = useAuth()
  const teacherId = user?.teacher?.id

  const { data: records, isLoading } = useQuery({
    queryKey: ['my-attendance', teacherId],
    queryFn: () => teachersApi.attendance({ teacherId }).then(r => r.data),
    enabled: !!teacherId,
  })

  const present = (records || []).filter((r: any) => r.status === 'PRESENT').length
  const total = (records || []).length

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Attendance" sub="Your daily check-in/check-out history" />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Days Present', value: present, color: 'text-emerald-600' },
          { label: 'Days Absent', value: total - present, color: 'text-red-500' },
          { label: 'Attendance %', value: total ? `${Math.round((present / total) * 100)}%` : '—', color: 'text-brand-600' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th>
            </tr></thead>
            <tbody>
              {(records || []).length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={UserCheck} title="No attendance records" /></td></tr>
              ) : (records || []).map((r: any) => {
                let duration = '—'
                if (r.timeIn && r.timeOut) {
                  const mins = Math.round((new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 60000)
                  duration = `${Math.floor(mins / 60)}h ${mins % 60}m`
                }
                return (
                  <tr key={r.id}>
                    <td className="font-medium text-sm">{formatDate(r.date)}</td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">{r.timeIn ? formatTime(r.timeIn) : '—'}</td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">{r.timeOut ? formatTime(r.timeOut) : '—'}</td>
                    <td className="text-sm text-gray-500">{duration}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
