import axiosClient from '../axios/axiosClient'

export const getMyAppointments = async (params = {}) => {
  const { data } = await axiosClient.get('/appointments/my', { params })
  return data.data
}

export const getAppointmentById = async (id) => {
  const { data } = await axiosClient.get(`/appointments/${id}`)
  return data.data
}

export const bookAppointment = async (payload) => {
  const { data } = await axiosClient.post('/appointments', payload)
  return data.data
}

export const cancelAppointment = async (id, reason = '') => {
  const { data } = await axiosClient.patch(`/appointments/${id}/cancel`, {
    cancellationReason: reason,
  })
  return data
}

export const rescheduleAppointment = async (id, payload) => {
  const { data } = await axiosClient.put(`/appointments/${id}/reschedule`, payload)
  return data.data
}
