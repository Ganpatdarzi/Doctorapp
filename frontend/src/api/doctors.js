import axiosClient from '../axios/axiosClient'

export const getDoctors = async (params = {}) => {
  const { data } = await axiosClient.get('/doctors', { params })
  return data.data
}

export const getDoctorById = async (id) => {
  const { data } = await axiosClient.get(`/doctors/${id}`)
  return data.data
}

export const getSpecializations = async () => {
  const { data } = await axiosClient.get('/doctors/specializations')
  return data.data
}

export const getStats = async () => {
  const { data } = await axiosClient.get('/doctors/stats')
  return data.data
}
