import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { register as registerApi, login as loginApi, getCurrentUser, logout as logoutApi } from '../api/auth'
import { storage } from '../services/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => storage.getUser())
  const [token, setToken] = useState(() => storage.getToken())
  const [loading, setLoading] = useState(true)

  const persistAuth = (authData) => {
    storage.setToken(authData.token)
    storage.setUser({
      _id: authData._id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
      phone: authData.phone || '',
      image: authData.image || '',
    })
    setToken(authData.token)
    setUser({
      _id: authData._id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
      phone: authData.phone || '',
      image: authData.image || '',
    })
  }

  const login = useCallback(async (email, password) => {
    const data = await loginApi({ email, password })
    persistAuth(data)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await registerApi({ name, email, password })
    persistAuth(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore network errors on logout
    }
    storage.clearAuth()
    setUser(null)
    setToken(null)
  }, [])

  const updateUser = useCallback((next) => {
    setUser((prev) => {
      const merged = { ...prev, ...next }
      storage.setUser(merged)
      return merged
    })
  }, [])

  useEffect(() => {
    const validateSession = async () => {
      const savedToken = storage.getToken()
      if (!savedToken) {
        setLoading(false)
        return
      }
      try {
        const currentUser = await getCurrentUser()
        setToken(savedToken)
        setUser({
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          phone: currentUser.phone || '',
          image: currentUser.image || '',
          dob: currentUser.dob || '',
          gender: currentUser.gender || '',
          address: currentUser.address || '',
        })
        storage.setUser({
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          phone: currentUser.phone || '',
          image: currentUser.image || '',
          dob: currentUser.dob || '',
          gender: currentUser.gender || '',
          address: currentUser.address || '',
        })
      } catch {
        storage.clearAuth()
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    validateSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
