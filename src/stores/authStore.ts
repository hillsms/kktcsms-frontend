import { create } from 'zustand'
import api from '@/api/client'
import type { UserInfo } from '@/types'

interface AuthState {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ requiresMfa: boolean; mfaToken?: string; mfaMethod?: string }>
  verifyMfa: (mfaToken: string, code: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const data = res.data.data

    if (data.requires_mfa) {
      return { requiresMfa: true, mfaToken: data.mfa_token, mfaMethod: data.mfa_method }
    }

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
    return { requiresMfa: false }
  },

  verifyMfa: async (mfaToken, code) => {
    const res = await api.post('/auth/mfa/verify', { mfa_token: mfaToken, code })
    const data = res.data.data
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.data, isAuthenticated: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))
