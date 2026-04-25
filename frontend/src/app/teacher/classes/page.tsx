'use client'
import { useQuery } from '@tanstack/react-query'
import { classesApi, attendanceApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState, AttendanceBar } from '@/components/ui'
import { BookOpen, Users } from 'lucide-react'
import { today } from '@/lib/utils'
import Link from 'next/link'

export default function TeacherClassesPage() {
  const { user } = useAuth()

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list().then(r => r.data),
  })

  // Filter to only this teacher's classes
  const myClasses = (classes || []).filter(
    (c: any) => c.teacher?.user?.id === user?.id
  )

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Classes" sub={`${myClasses.length} class${myClasses.length !== 1 ? 'es' : ''} assigned`} />

      {isLoading ? <LoadingSpinner /> : myClasses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes assigned" sub="Contact admin to get classes assigned to you" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {myClasses.map((cls: any) => (
            <div key={cls.id} className="card-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <span className="font-display font-bold text-brand-700 dark:text-brand-400 text-xl">
                    {cls.grade}{cls.section}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg">{cls.name}</h3>
                  {cls.room && <p className="text-sm text-gray-400">Room {cls.room}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Users size={14} />
                <span>{cls._count?.students || 0} students enrolled</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/teacher/take-attendance?classId=${cls.id}`}
                  className="btn-primary flex-1 justify-center text-sm py-2">
                  Take Attendance
                </Link>
                <Link href={`/teacher/reports?classId=${cls.id}`}
                  className="btn-secondary flex-1 justify-center text-sm py-2">
                  View Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
