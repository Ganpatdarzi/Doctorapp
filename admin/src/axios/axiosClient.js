import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const axiosClient = axios.create({ baseURL, timeout: 20000 })

const clearSession = (url) => {
  const isDoctor = url?.startsWith('/doctor')
  if (isDoctor) {
    localStorage.removeItem('doctorToken')
    localStorage.removeItem('doctorUser')
  } else {
    localStorage.removeItem('adminToken')
  }
}

axiosClient.interceptors.request.use((config) => {
  if (config.headers.Authorization) return config
  const isDoctor = config.url?.startsWith('/doctor')
  const token = isDoctor
    ? localStorage.getItem('doctorToken')
    : localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error
    if (response?.status === 401 && config?.url && !config.url.includes('/login')) {
      clearSession(config.url)
      if (!window.location.pathname.startsWith('/doctor')) {
        window.location.assign('/login')
      } else {
        window.location.assign('/doctor-login')
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
