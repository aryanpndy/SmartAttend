'use client'
import { useQuery } from '@tanstack/react-query'
import { classesApi } from '@/lib/api'
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui'
import { BookOpen, Users, UserCheck } from 'lucide-react'

export default function AdminClassesPage() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list().then(r => r.data),
  })

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Classes" sub={`${(classes || []).length} classes configured`} />

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(classes || []).length === 0 ? (
            <EmptyState icon={BookOpen} title="No classes found" />
          ) : (classes || []).map((cls: any) => (
            <div key={cls.id} className="card-hover p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-brand-700 dark:text-brand-400 text-lg">
                    {cls.grade}{cls.section}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{cls.name}</div>
                  {cls.room && <div className="text-xs text-gray-400">Room {cls.room}</div>}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Users size={13} />Students</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cls._count?.students || 0} / {cls.capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${((cls._count?.students || 0) / cls.capacity) * 100}%` }} />
                </div>
                {cls.teacher && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <UserCheck size={12} />
                    <span>{cls.teacher.user?.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
