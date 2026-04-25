'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, classesApi, exportApi } from '@/lib/api'
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge, Modal } from '@/components/ui'
import { Users, Search, Plus, Download, UserCircle, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

export default function AdminStudentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', classFilter, search],
    queryFn: () => studentsApi.list({ classId: classFilter || undefined, search: search || undefined }).then(r => r.data),
  })

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classesApi.list().then(r => r.data) })

  const { register, handleSubmit, reset } = useForm<any>()

  const addMutation = useMutation({
    mutationFn: (data: any) => studentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student added!')
      setShowAdd(false)
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add student'),
  })

  const filtered = (students || []).filter((s: any) =>
    !search || s.user.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.includes(search)
  )

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Students" sub={`${filtered.length} students enrolled`}
        actions={<>
          <button onClick={() => exportApi.studentsCsv()} className="btn-secondary"><Download size={15} />Export CSV</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} />Add Student</button>
        </>}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or roll no…" className="input pl-9" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input w-auto min-w-36">
          <option value="">All Classes</option>
          {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={Users} title="No students found" /></td></tr>
                ) : filtered.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 dark:text-brand-400 font-bold text-xs">{s.user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{s.user.name}</div>
                          <div className="text-xs text-gray-400">{s.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{s.rollNumber}</span></td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <BookOpen size={11} /> {s.class?.name}
                      </span>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400 text-sm">{s.parentName || '—'}</td>
                    <td className="text-gray-500 text-sm">{s.parentPhone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student">
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Student name" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input {...register('email', { required: true })} type="email" className="input" placeholder="student@school.edu" />
            </div>
            <div>
              <label className="label">Roll Number *</label>
              <input {...register('rollNumber', { required: true })} className="input" placeholder="e.g. 3A01" />
            </div>
            <div>
              <label className="label">Class *</label>
              <select {...register('classId', { required: true })} className="input">
                <option value="">Select class</option>
                {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Parent Name</label>
              <input {...register('parentName')} className="input" placeholder="Parent/Guardian name" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input {...register('parentPhone')} className="input" placeholder="+91-XXXXXXXXXX" />
            </div>
            <div className="col-span-2">
              <label className="label">Date of Birth</label>
              <input {...register('dateOfBirth')} type="date" className="input" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Default password: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Student@123</code></p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1">
              {addMutation.isPending ? 'Adding…' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
