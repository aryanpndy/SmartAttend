'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, classesApi, exportApi } from '@/lib/api'
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge } from '@/components/ui'
import { ClipboardList, Download, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { today } from '@/lib/utils'

export default function AdminAttendancePage() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(today())
  const [editing, setEditing] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classesApi.list().then(r => r.data) })

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: () => attendanceApi.list({ classId: classId || undefined, date }).then(r => r.data),
    enabled: !!(classId || date),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => attendanceApi.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Updated'); setEditing(null) },
    onError: () => toast.error('Update failed'),
  })

  const startEdit = (rec: any) => { setEditing(rec.id); setEditStatus(rec.status) }

  const summary = (records || []).reduce((a: any, r: any) => {
    a[r.status] = (a[r.status] || 0) + 1; return a
  }, {})

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance Records" sub="View and manage student attendance"
        actions={<button onClick={() => exportApi.attendanceCsv({ classId, year: date.slice(0, 4), month: date.slice(5, 7) })}
          className="btn-secondary"><Download size={15} />Export CSV</button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={classId} onChange={e => setClassId(e.target.value)} className="input w-auto min-w-40">
          <option value="">All Classes</option>
          {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-auto" />
      </div>

      {/* Summary chips */}
      {records && records.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {[['PRESENT', 'emerald'], ['ABSENT', 'red'], ['LATE', 'amber']].map(([s, c]) => (
            summary[s] > 0 && (
              <div key={s} className={`badge bg-${c}-100 text-${c}-700 dark:bg-${c}-900/30 dark:text-${c}-400 text-sm px-3 py-1.5`}>
                {s}: {summary[s]}
              </div>
            )
          ))}
          <div className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-sm px-3 py-1.5">
            Total: {records.length}
          </div>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead><tr>
              <th>Student</th><th>Class</th><th>Status</th><th>AI Marked</th><th>Confidence</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {(records || []).length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={ClipboardList} title="No attendance records" sub="Select a class and date" /></td></tr>
              ) : (records || []).map((rec: any) => (
                <tr key={rec.id}>
                  <td>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{rec.student?.user?.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{rec.student?.rollNumber}</div>
                  </td>
                  <td className="text-sm text-gray-500">{rec.class?.name}</td>
                  <td>
                    {editing === rec.id ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="input py-1 text-xs w-28">
                        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : <StatusBadge status={rec.status} />}
                  </td>
                  <td>
                    <span className={`badge text-xs ${rec.isAiMarked ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500'}`}>
                      {rec.isAiMarked ? '🤖 AI' : '👤 Manual'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-500">
                    {rec.aiConfidence ? `${(rec.aiConfidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td>
                    {editing === rec.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => updateMutation.mutate({ id: rec.id, status: editStatus })}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(rec)} className="btn-ghost py-1 px-2 text-xs">
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
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
