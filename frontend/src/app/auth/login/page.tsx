'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { ROLE_ROUTES, cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password too short'),
})
type FormData = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@school.edu', password: 'Admin@123', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { role: 'Teacher', email: 'sarah.johnson@school.edu', password: 'Teacher@123', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { role: 'Student', email: 'aarav.sharma@student.school.edu', password: 'Student@123', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`)
      router.push(ROLE_ROUTES[user.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setValue('email', acc.email)
    setValue('password', acc.password)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${20 + (i * 17) % 80}px`, height: `${20 + (i * 17) % 80}px`, top: `${(i * 23) % 90}%`, left: `${(i * 31) % 90}%`, opacity: 0.3 + (i % 5) * 0.1 }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-display font-bold text-xl">SmartAttend</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-white font-display text-4xl font-bold leading-tight mb-4">
            Smarter Schools<br />Start Here
          </h2>
          <p className="text-white/70 text-lg mb-8">AI-powered attendance & teaching management for the modern classroom.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: '2,400+', l: 'Students Tracked' },
              { n: '98.2%', l: 'AI Accuracy' },
              { n: '1,200+', l: 'Teaching Logs' },
              { n: '40+', l: 'Active Teachers' },
            ].map(s => (
              <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-white font-display text-2xl font-bold">{s.n}</div>
                <div className="text-white/60 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">© 2025 SmartAttend. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">SmartAttend</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your school account</p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Demo Access</p>
            <div className="flex gap-2 flex-wrap">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={() => fillDemo(acc)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95', acc.color)}>
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@school.edu" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            SmartAttend v1.0 · Powered by AI Face Recognition
          </p>
        </div>
      </div>
    </div>
  )
}
