'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teachersApi } from '@/lib/api'
import { PageHeader, LoadingSpinner, EmptyState, Modal } from '@/components/ui'
import { UserCheck, Plus, Mail, Phone, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { formatDate } from '@/lib/utils'

export default function AdminTeachersPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset } = useForm<any>()

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.list().then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: any) => teachersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher added!')
      setShowAdd(false)
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Teachers" sub={`${(teachers || []).length} staff members`}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} />Add Teacher</button>}
      />

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(teachers || []).length === 0 ? (
            <div className="col-span-3"><EmptyState icon={UserCheck} title="No teachers found" /></div>
          ) : (teachers || []).map((t: any) => (
            <div key={t.id} className="card-hover p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 dark:text-purple-400 font-bold text-lg">{t.user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white">{t.user.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{t.employeeId}</div>
                  {t.specialization && (
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mt-1">
                      <BookOpen size={10} />{t.specialization}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Mail size={12} className="flex-shrink-0" />
                  <span className="truncate">{t.user.email}</span>
                </div>
                {t.user.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone size={12} />{t.user.phone}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>{t._count?.teachingLogs || 0} teaching logs</span>
                <span>{t.classes?.length || 0} classes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Teacher">
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Teacher name" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="label">Employee ID *</label>
              <input {...register('employeeId', { required: true })} className="input" placeholder="EMP0001" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91-XXXXXXXXXX" />
            </div>
            <div>
              <label className="label">Qualification</label>
              <input {...register('qualification')} className="input" placeholder="B.Ed, M.Sc" />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input {...register('specialization')} className="input" placeholder="Mathematics" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Default password: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Teacher@123</code></p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1">
              {addMutation.isPending ? 'Adding…' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
