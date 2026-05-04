import axios from 'axios'

const api = axios.create({
  // baseURL: '/api',
  baseURL: 'https://kktcsms.net/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
          if (res.data?.data?.access_token) {
            localStorage.setItem('access_token', res.data.data.access_token)
            localStorage.setItem('refresh_token', res.data.data.refresh_token)
            original.headers.Authorization = `Bearer ${res.data.data.access_token}`
            return api(original)
          }
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
