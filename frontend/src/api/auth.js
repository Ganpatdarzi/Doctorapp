import axiosClient from '../axios/axiosClient'

export const register = async (payload) => {
  const { data } = await axiosClient.post('/auth/register', payload)
  return data.data
}

export const login = async (payload) => {
  const { data } = await axiosClient.post('/auth/login', payload)
  return data.data
}

export const logout = async () => {
  const { data } = await axiosClient.post('/auth/logout')
  return data
}

export const getCurrentUser = async () => {
  const { data } = await axiosClient.get('/auth/me')
  return data.data
}

export const updateProfile = async (payload) => {
  const { data } = await axiosClient.put('/auth/profile', payload)
  return data.data
}

export const changePassword = async (payload) => {
  const { data } = await axiosClient.put('/auth/change-password', payload)
  return data
}
