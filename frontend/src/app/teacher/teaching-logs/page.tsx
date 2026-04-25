'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teachingLogsApi, classesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState, Modal } from '@/components/ui'
import { FileText, Plus, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

export default function TeacherTeachingLogsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset } = useForm<any>()

  const { data, isLoading } = useQuery({
    queryKey: ['my-teaching-logs'],
    queryFn: () => teachingLogsApi.list({ limit: 50 }).then(r => r.data),
  })

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classesApi.list().then(r => r.data) })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data).catch(() => []) })

  const addMutation = useMutation({
    mutationFn: (d: any) => teachingLogsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-teaching-logs'] })
      toast.success('Teaching log saved!')
      setShowAdd(false)
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to save'),
  })

  const logs = data?.logs || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Teaching Logs" sub="Record what you taught each day"
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} />Add Log</button>}
      />

      {isLoading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No teaching logs yet" sub="Start by adding what you taught today" />
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={17} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{log.subject?.name}</span>
                      <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">{log.class?.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{log.topicsCovered}</p>
                    {log.objectives && <p className="text-xs text-gray-500 mt-1">Objective: {log.objectives}</p>}
                    {log.homework && <p className="text-xs text-gray-500">HW: {log.homework}</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(log.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Teaching Log">
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class *</label>
              <select {...register('classId', { required: true })} className="input">
                <option value="">Select class</option>
                {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select {...register('subjectId', { required: true })} className="input">
                <option value="">Select subject</option>
                {(subjects || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Date *</label>
              <input {...register('date', { required: true })} type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="label">Topics Covered *</label>
            <textarea {...register('topicsCovered', { required: true })} className="input min-h-20 resize-y"
              placeholder="Describe the topics taught today…" />
          </div>
          <div>
            <label className="label">Learning Objectives</label>
            <textarea {...register('objectives')} className="input min-h-16 resize-y"
              placeholder="What students should understand after this class…" />
          </div>
          <div>
            <label className="label">Homework Assigned</label>
            <input {...register('homework')} className="input" placeholder="Exercise numbers, page references, projects…" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} className="input min-h-14 resize-y"
              placeholder="Any observations or special notes…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1">
              {addMutation.isPending ? 'Saving…' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
