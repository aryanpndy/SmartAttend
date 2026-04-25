'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, ClipboardList,
  Camera, BarChart2, LogOut, Menu, X, Moon, Sun, Bell, ChevronRight,
  UserCheck, CalendarDays, Settings, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

interface NavItem { label: string; href: string; icon: any; roles?: string[] }

const NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Teachers', href: '/admin/teachers', icon: UserCheck },
    { label: 'Classes', href: '/admin/classes', icon: BookOpen },
    { label: 'Attendance', href: '/admin/attendance', icon: ClipboardList },
    { label: 'Teaching Logs', href: '/admin/teaching-logs', icon: FileText },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { label: 'My Attendance', href: '/teacher/attendance', icon: UserCheck },
    { label: 'Take Attendance', href: '/teacher/take-attendance', icon: Camera },
    { label: 'Teaching Logs', href: '/teacher/teaching-logs', icon: FileText },
    { label: 'My Classes', href: '/teacher/classes', icon: BookOpen },
    { label: 'Reports', href: '/teacher/reports', icon: BarChart2 },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'My Attendance', href: '/student/attendance', icon: ClipboardList },
    { label: 'Subjects & Topics', href: '/student/subjects', icon: BookOpen },
    { label: 'Profile', href: '/student/profile', icon: Users },
  ],
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

  const toggleDark = () => {
    setDark(d => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const navItems = user ? NAV[user.role] || [] : []
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'TEACHER' ? 'Teacher' : 'Student'
  const roleColor = user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
    user?.role === 'TEACHER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <div>
          <div className="font-display font-bold text-gray-900 dark:text-white leading-none">SmartAttend</div>
          <div className="text-xs text-gray-400 mt-0.5">School Management</div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 dark:text-brand-400 font-bold text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</div>
            <span className={cn('badge text-xs', roleColor)}>{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/teacher' && item.href !== '/student' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn('sidebar-link', active && 'active')}>
              <item.icon size={17} className="flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <button onClick={toggleDark} className="sidebar-link w-full">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={logout} className="sidebar-link w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 z-50">
            <div className="relative h-full">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-10 btn-ghost p-1.5 rounded-lg">
                <X size={18} />
              </button>
              <Sidebar mobile />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2 rounded-lg -ml-1">
              <Menu size={20} />
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2 rounded-xl relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button onClick={toggleDark} className="btn-ghost p-2 rounded-xl">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
