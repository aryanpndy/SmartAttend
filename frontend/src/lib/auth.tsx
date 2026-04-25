'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { authApi } from './api'

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  teacher?: { id: string; employeeId: string; specialization?: string }
  student?: { id: string; rollNumber: string; classId: string; class: { name: string } }
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>({} as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = Cookies.get('token') || localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      authApi.me()
        .then(r => setUser(r.data))
        .catch(() => { Cookies.remove('token'); localStorage.removeItem('token') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    const { token: t, user: u } = data
    Cookies.set('token', t, { expires: 7, sameSite: 'strict' })
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    authApi.logout().catch(() => {})
    Cookies.remove('token')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    window.location.href = '/auth/login'
  }

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
