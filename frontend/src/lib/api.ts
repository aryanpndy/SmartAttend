import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT from cookie/localStorage on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: (params?: { classId?: string; search?: string }) => api.get('/students', { params }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export const teachersApi = {
  list: () => api.get('/teachers'),
  get: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  checkIn: () => api.post('/teacher-attendance/check-in', {}),
  checkOut: () => api.post('/teacher-attendance/check-out', {}),
  attendance: (params?: any) => api.get('/teacher-attendance', { params }),
}

// ── Classes ───────────────────────────────────────────────────────────────────
export const classesApi = {
  list: () => api.get('/classes'),
  students: (classId: string) => api.get(`/classes/${classId}/students`),
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }),
  bulkSave: (data: { classId: string; date: string; records: any[] }) => api.post('/attendance/bulk', data),
  update: (id: string, data: { status: string; notes?: string }) => api.patch(`/attendance/${id}`, data),
  summary: (classId: string, params?: any) => api.get(`/attendance/summary/${classId}`, { params }),
  uploadPhoto: (formData: FormData) =>
    api.post('/attendance/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Teaching Logs ─────────────────────────────────────────────────────────────
export const teachingLogsApi = {
  list: (params?: any) => api.get('/teaching-logs', { params }),
  create: (data: any) => api.post('/teaching-logs', data),
  update: (id: string, data: any) => api.patch(`/teaching-logs/${id}`, data),
  delete: (id: string) => api.delete(`/teaching-logs/${id}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  student: (studentId: string, params?: any) => api.get(`/analytics/student/${studentId}`, { params }),
  teacher: (teacherId: string) => api.get(`/analytics/teacher/${teacherId}`),
}

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  attendanceCsv: (params: any) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`${API_URL}/export/attendance/csv?${qs}`, '_blank')
  },
  teachingLogsCsv: (params: any) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`${API_URL}/export/teaching-logs/csv?${qs}`, '_blank')
  },
  studentsCsv: () => window.open(`${API_URL}/export/students/csv`, '_blank'),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
}
