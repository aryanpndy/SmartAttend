'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { classesApi, attendanceApi, exportApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState, ProgressRing } from '@/components/ui'
import { BarChart2, Download } from 'lucide-react'
import { cn, getGradeColor } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TeacherReportsPage() {
  const { user } = useAuth()
  const [classId, setClassId] = useState('')
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year] = useState(String(new Date().getFullYear()))

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list().then(r => r.data),
  })

  const myClasses = (classes || []).filter((c: any) => c.teacher?.user?.id === user?.id)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['attendance-summary', classId, month, year],
    queryFn: () => attendanceApi.summary(classId, { month, year }).then(r => r.data),
    enabled: !!classId,
  })

  // Sort by attendance % ascending (lowest first = needs attention)
  const sorted = [...(summary || [])].sort((a: any, b: any) => {
    const pA = a.total ? a.present / a.total : 0
    const pB = b.total ? b.present / b.total : 0
    return pA - pB
  })

  const chartData = (summary || []).map((s: any) => ({
    name: s.studentName.split(' ')[0],
    present: s.present,
    absent: s.absent,
    late: s.late,
  }))

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Class Reports" sub="Monthly attendance summary per class"
        actions={classId && (
          <button onClick={() => exportApi.attendanceCsv({ classId, month, year })} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={classId} onChange={e => setClassId(e.target.value)} className="input w-auto min-w-40">
          <option value="">Select class…</option>
          {myClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="input w-auto">
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
            <option key={m} value={String(i + 1)}>{m} {year}</option>
          ))}
        </select>
      </div>

      {!classId ? (
        <EmptyState icon={BarChart2} title="Select a class to view report" />
      ) : isLoading ? <LoadingSpinner /> : (summary || []).length === 0 ? (
        <EmptyState icon={BarChart2} title="No data for this period" />
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          <div className="card p-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                <Bar dataKey="present" fill="#10b981" name="Present" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk students */}
          {sorted.filter((s: any) => s.total && (s.present / s.total) < 0.75).length > 0 && (
            <div className="card border-l-4 border-l-red-500 p-5">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">⚠️ Students Below 75% Attendance</h3>
              <div className="space-y-2">
                {sorted.filter((s: any) => s.total && (s.present / s.total) < 0.75).map((s: any) => {
                  const pct = Math.round((s.present / s.total) * 100)
                  return (
                    <div key={s.studentId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{s.studentName}</span>
                      <span className="font-bold text-red-600">{pct}% ({s.present}/{s.total})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="card table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Rate</th>
              </tr></thead>
              <tbody>
                {(summary || []).map((s: any) => {
                  const pct = s.total ? Math.round((s.present / s.total) * 100) : 0
                  return (
                    <tr key={s.studentId}>
                      <td className="font-medium text-sm text-gray-900 dark:text-white">{s.studentName}</td>
                      <td><span className="text-emerald-600 font-semibold">{s.present}</span></td>
                      <td><span className="text-red-500 font-semibold">{s.absent}</span></td>
                      <td><span className="text-amber-500 font-semibold">{s.late}</span></td>
                      <td className="text-gray-500">{s.total}</td>
                      <td>
                        <span className={cn('font-bold text-sm', getGradeColor(pct))}>{pct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
