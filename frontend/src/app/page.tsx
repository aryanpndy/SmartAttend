'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ROLE_ROUTES } from '@/lib/utils'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) router.replace(ROLE_ROUTES[user.role])
      else router.replace('/auth/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center animate-pulse-soft">
          <span className="text-white font-display font-bold text-xl">S</span>
        </div>
        <p className="text-gray-400 text-sm">Loading SmartAttend…</p>
      </div>
    </div>
  )
}
