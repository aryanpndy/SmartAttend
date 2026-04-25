import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'hh:mm a')
}

export const STATUS_COLORS = {
  PRESENT: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  ABSENT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  LATE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  EXCUSED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
}

export function getAttendancePercent(present: number, total: number): number {
  if (!total) return 0
  return Math.round((present / total) * 100)
}

export function getGradeColor(pct: number) {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 75) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}

export const today = () => new Date().toISOString().split('T')[0]
