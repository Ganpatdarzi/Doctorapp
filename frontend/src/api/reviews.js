import axiosClient from '../axios/axiosClient'

export const getDoctorReviews = async (doctorId, params = {}) => {
  const { data } = await axiosClient.get(`/reviews/doctor/${doctorId}`, { params })
  return data.data
}

export const getMyReviewForDoctor = async (doctorId) => {
  const { data } = await axiosClient.get(`/reviews/my/${doctorId}`)
  return data.data
}

export const submitReview = async (payload) => {
  const { data } = await axiosClient.post('/reviews', payload)
  return data.data
}

export const deleteReview = async (id) => {
  const { data } = await axiosClient.delete(`/reviews/${id}`)
  return data.data
}
