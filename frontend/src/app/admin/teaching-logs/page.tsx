'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teachingLogsApi, exportApi } from '@/lib/api'
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui'
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminTeachingLogsPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const { data, isLoading } = useQuery({
    queryKey: ['teaching-logs', month, year],
    queryFn: () => teachingLogsApi.list({ limit: 100 }).then(r => r.data),
  })

  const logs = data?.logs || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Teaching Logs" sub={`${logs.length} entries found`}
        actions={
          <button onClick={() => exportApi.teachingLogsCsv({ year, month })} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        }
      />

      {isLoading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No teaching logs" sub="Logs will appear here once teachers submit them" />
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{log.teacher?.user?.name}</span>
                    <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">{log.class?.name}</span>
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">{log.subject?.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 truncate">{log.topicsCovered}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{formatDate(log.date)}</span>
                  {expanded === log.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded === log.id && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 grid sm:grid-cols-3 gap-4 pt-4 animate-fade-in">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Topics Covered</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{log.topicsCovered}</p>
                  </div>
                  {log.objectives && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Objectives</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.objectives}</p>
                    </div>
                  )}
                  {log.homework && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Homework</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.homework}</p>
                    </div>
                  )}
                  {log.notes && (
                    <div className="sm:col-span-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{log.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
