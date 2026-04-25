'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { analyticsApi, authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, ProgressRing } from '@/components/ui'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getGradeColor, formatDate } from '@/lib/utils'

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [changingPw, setChangingPw] = useState(false)
  const { register, handleSubmit, reset } = useForm<any>()

  const studentId = user?.student?.id

  const { data } = useQuery({
    queryKey: ['student-analytics', studentId],
    queryFn: () => analyticsApi.student(studentId!).then(r => r.data),
    enabled: !!studentId,
  })

  const pwMutation = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d.currentPassword, d.newPassword),
    onSuccess: () => { toast.success('Password changed!'); setChangingPw(false); reset() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const stats = data?.stats || {}

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <PageHeader title="My Profile" />

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 dark:text-brand-400 font-display font-bold text-3xl">
              {user?.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Student</span>
              {user?.student?.class?.name && (
                <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {user.student.class.name}
                </span>
              )}
              {user?.student?.rollNumber && (
                <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-mono">
                  Roll: {user.student.rollNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance summary */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={stats.percentage || 0} size={90} stroke={8} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-display font-bold ${getGradeColor(stats.percentage || 0)}`}>
                {stats.percentage || 0}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {[
              { label: 'Total Days', value: stats.total || 0 },
              { label: 'Present', value: stats.present || 0 },
              { label: 'Absent', value: stats.absent || 0 },
              { label: 'Late', value: stats.late || 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-display font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Security</h3>
          <button onClick={() => setChangingPw(!changingPw)} className="btn-secondary text-sm py-1.5">
            {changingPw ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {changingPw && (
          <form onSubmit={handleSubmit(d => pwMutation.mutate(d))} className="space-y-4 animate-fade-in">
            <div>
              <label className="label">Current Password</label>
              <input {...register('currentPassword', { required: true })} type="password" className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input {...register('newPassword', { required: true, minLength: 8 })} type="password" className="input"
                placeholder="At least 8 characters" />
            </div>
            <button type="submit" disabled={pwMutation.isPending} className="btn-primary">
              {pwMutation.isPending ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
