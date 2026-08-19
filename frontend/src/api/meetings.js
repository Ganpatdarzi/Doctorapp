import axiosClient from '../axios/axiosClient'

export const getMeeting = async (appointmentId) => {
  const { data } = await axiosClient.get(`/meetings/${appointmentId}`)
  return data.data
}

export const recordMeetingEvent = async (appointmentId, event, joinedAt) => {
  const { data } = await axiosClient.post(`/meetings/${appointmentId}/history`, {
    event,
    joinedAt,
  })
  return data.data
}
