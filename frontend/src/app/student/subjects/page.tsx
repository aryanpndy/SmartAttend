'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teachingLogsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function StudentSubjectsPage() {
  const { user } = useAuth()
  const classId = user?.student?.classId
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['teaching-logs-student', classId],
    queryFn: () => teachingLogsApi.list({ classId, limit: 100 }).then(r => r.data),
    enabled: !!classId,
  })

  const logs = data?.logs || []

  // Group by subject
  const bySubject: Record<string, any[]> = {}
  for (const log of logs) {
    const key = log.subject?.name || 'Other'
    if (!bySubject[key]) bySubject[key] = []
    bySubject[key].push(log)
  }

  const subjectColors: Record<string, string> = {
    Mathematics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    English: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Science: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Social Studies': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Hindi: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Computer Science': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Physical Education': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Art & Craft': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Subjects & Topics" sub="Topics covered in your class" />

      {isLoading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState icon={BookOpen} title="No topics recorded yet" sub="Topics will appear here once your teacher logs them" />
      ) : (
        <div className="space-y-4">
          {Object.entries(bySubject).map(([subject, subLogs]) => (
            <div key={subject} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === subject ? null : subject)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{subject}</span>
                    <span className={`badge text-xs ${subjectColors[subject] || 'bg-gray-100 text-gray-600'}`}>
                      {subLogs.length} session{subLogs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">
                    Latest: {subLogs[0]?.topicsCovered}
                  </p>
                </div>
                {expanded === subject
                  ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
              </button>

              {expanded === subject && (
                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 animate-fade-in">
                  {subLogs.map((log: any) => (
                    <div key={log.id} className="px-5 py-4 pl-[4.5rem]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.topicsCovered}</p>
                          {log.objectives && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-semibold">Objective:</span> {log.objectives}
                            </p>
                          )}
                          {log.homework && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <span className="font-semibold">📝 Homework:</span> {log.homework}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(log.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
