'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import AppShell from '@/components/AppShell'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'TEACHER')) {
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  if (loading || !user) return null
  return <AppShell>{children}</AppShell>
}
