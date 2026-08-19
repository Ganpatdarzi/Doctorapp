import axiosClient from '../axios/axiosClient'

export const createCheckoutSession = async (appointmentId) => {
  const { data } = await axiosClient.post('/payments/checkout', { appointmentId })
  return data.data
}

export const getPaymentForAppointment = async (appointmentId) => {
  const { data } = await axiosClient.get(`/payments/appointment/${appointmentId}`)
  return data.data
}

export const getMyPayments = async (params = {}) => {
  const { data } = await axiosClient.get('/payments/history', { params })
  return data.data
}

export const getPaymentById = async (id) => {
  const { data } = await axiosClient.get(`/payments/${id}`)
  return data.data
}
