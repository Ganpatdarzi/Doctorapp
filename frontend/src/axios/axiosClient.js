import axios from 'axios'
import { storage } from '../services/storage'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
})

axiosClient.interceptors.request.use((config) => {
  if (config.headers.Authorization) return config
  const token = storage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isAuthRequest = error.config?.url?.startsWith('/auth/')

    if (status === 401 && !isAuthRequest) {
      storage.clearAuth()
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        const from = encodeURIComponent(currentPath + (window.location.search || ''))
        window.location.href = `/login?from=${from}`
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
