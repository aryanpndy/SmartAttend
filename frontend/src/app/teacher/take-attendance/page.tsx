'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi, attendanceApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { StatusBadge, LoadingSpinner, PageHeader } from '@/components/ui'
import { Camera, CheckCircle, AlertCircle, Save, RefreshCw, Users, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { today } from '@/lib/utils'

type AttendanceRecord = {
  studentId: string
  studentName: string
  rollNumber: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  isAiMarked: boolean
  aiConfidence?: number
}

export default function TakeAttendancePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(today())
  const [cameraOn, setCameraOn] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [step, setStep] = useState<'setup' | 'camera' | 'review'>('setup')
  const [stream, setStream] = useState<MediaStream | null>(null)

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classesApi.list().then(r => r.data) })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => classesApi.students(classId).then(r => r.data),
    enabled: !!classId,
  })

  // Start webcam
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }
      setCameraOn(true)
      setStep('camera')
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraOn(false)
  }

  // Simulate AI processing (in production, send to Python microservice or use face-api.js)
  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || !students) return
    setCapturing(true)
    const ctx = canvasRef.current.getContext('2d')!
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)

    setProcessing(true)
    toast.loading('AI processing photo…', { id: 'ai-proc' })

    // Simulate AI detection with random confidence scores
    // In production: POST canvas blob to /api/v1/attendance/upload-photo → AI microservice
    await new Promise(r => setTimeout(r, 2000))

    const aiRecords: AttendanceRecord[] = (students || []).map((s: any) => {
      const rand = Math.random()
      const recognized = rand > 0.1 // 90% detection rate simulation
      const confidence = 0.72 + Math.random() * 0.27
      return {
        studentId: s.id,
        studentName: s.user.name,
        rollNumber: s.rollNumber,
        status: recognized ? 'PRESENT' : 'ABSENT',
        isAiMarked: recognized,
        aiConfidence: recognized ? confidence : undefined,
      }
    })

    toast.dismiss('ai-proc')
    toast.success(`AI detected ${aiRecords.filter(r => r.isAiMarked).length} students!`)
    setRecords(aiRecords)
    setProcessing(false)
    setCapturing(false)
    stopCamera()
    setStep('review')
  }

  // Manual attendance (no camera)
  const initManual = () => {
    if (!students || !classId) return
    setRecords((students || []).map((s: any) => ({
      studentId: s.id,
      studentName: s.user.name,
      rollNumber: s.rollNumber,
      status: 'PRESENT' as const,
      isAiMarked: false,
    })))
    setStep('review')
  }

  const toggleStatus = (studentId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.studentId !== studentId) return r
      const cycle: AttendanceRecord['status'][] = ['PRESENT', 'LATE', 'ABSENT']
      const next = cycle[(cycle.indexOf(r.status) + 1) % cycle.length]
      return { ...r, status: next, isAiMarked: false }
    }))
  }

  const saveMutation = useMutation({
    mutationFn: () => attendanceApi.bulkSave({ classId, date, records }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance saved successfully!')
      setStep('setup')
      setRecords([])
    },
    onError: () => toast.error('Failed to save attendance'),
  })

  const presentCount = records.filter(r => r.status === 'PRESENT').length
  const absentCount = records.filter(r => r.status === 'ABSENT').length
  const lateCount = records.filter(r => r.status === 'LATE').length

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Take Attendance" sub="AI-powered or manual attendance marking" />

      {step === 'setup' && (
        <div className="max-w-xl space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-display font-bold text-gray-900 dark:text-white">Select Class & Date</h3>
            <div>
              <label className="label">Class *</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="input">
                <option value="">Choose a class…</option>
                {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </div>

            {classId && !studentsLoading && (
              <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-sm text-brand-700 dark:text-brand-400 flex items-center gap-2">
                <Users size={15} />
                {(students || []).length} students in this class
              </div>
            )}

            {classId && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={startCamera} disabled={!classId}
                  className="btn-primary flex-col h-24 gap-2 rounded-2xl">
                  <Camera size={22} />
                  <span className="text-sm">AI Camera</span>
                  <span className="text-xs opacity-70">Auto face detection</span>
                </button>
                <button onClick={initManual} disabled={!classId}
                  className="btn-secondary flex-col h-24 gap-2 rounded-2xl">
                  <CheckCircle size={22} />
                  <span className="text-sm">Manual</span>
                  <span className="text-xs opacity-70">Mark individually</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'camera' && (
        <div className="max-w-2xl space-y-4">
          <div className="card overflow-hidden">
            <div className="relative bg-black rounded-t-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning overlay */}
              {!capturing && (
                <div className="absolute inset-0 border-2 border-brand-500/50 rounded-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-brand-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-brand-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-brand-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-brand-400 rounded-br-lg" />
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-brand-900/80 flex flex-col items-center justify-center gap-3">
                  <Zap size={32} className="text-brand-400 animate-pulse" />
                  <span className="text-white font-semibold">AI processing faces…</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 flex gap-3">
              <button onClick={() => { stopCamera(); setStep('setup') }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={captureAndProcess} disabled={capturing}
                className="btn-primary flex-1 gap-2">
                <Camera size={16} />
                {capturing ? 'Processing…' : 'Capture & Detect'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Position the class in frame for best results. Ensure good lighting.
          </p>
        </div>
      )}

      {step === 'review' && records.length > 0 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card p-4 flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Summary:</span>
            <div className="flex gap-3 flex-wrap flex-1">
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ {presentCount} Present</span>
              <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">✗ {absentCount} Absent</span>
              {lateCount > 0 && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">⏱ {lateCount} Late</span>}
              <span className="badge bg-gray-100 text-gray-500 dark:bg-gray-800">Total: {records.length}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRecords([]); setStep('setup') }} className="btn-secondary gap-1.5">
                <RefreshCw size={14} /> Reset
              </button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className="btn-primary gap-1.5">
                <Save size={14} />
                {saveMutation.isPending ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>Student</th><th>Roll No</th><th>Status</th><th>AI Detection</th>
                </tr></thead>
                <tbody>
                  {records.map(rec => (
                    <tr key={rec.studentId}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <span className="text-brand-700 dark:text-brand-400 font-bold text-xs">{rec.studentName.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{rec.studentName}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{rec.rollNumber}</span></td>
                      <td>
                        <button onClick={() => toggleStatus(rec.studentId)} className="group">
                          <StatusBadge status={rec.status} />
                          <span className="text-xs text-gray-400 ml-1 group-hover:text-gray-600">(click to change)</span>
                        </button>
                      </td>
                      <td>
                        {rec.isAiMarked ? (
                          <div className="flex items-center gap-1.5">
                            <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                              🤖 {(rec.aiConfidence! * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-500 text-xs">👤 Manual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
