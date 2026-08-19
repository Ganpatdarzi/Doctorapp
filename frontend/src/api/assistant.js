import axiosClient from '../axios/axiosClient'

export const checkSymptoms = async (symptoms) => {
  const { data } = await axiosClient.post('/assistant/symptom-check', { symptoms })
  return data.data
}

export const chatWithAssistant = async (message) => {
  const { data } = await axiosClient.post('/assistant/chat', { message })
  return data.data
}

export const getFAQs = async (q = '') => {
  const { data } = await axiosClient.get('/assistant/faqs', { params: q ? { q } : {} })
  return data.data
}

export const getHealthTips = async (category = '') => {
  const { data } = await axiosClient.get('/assistant/health-tips', {
    params: category ? { category } : {},
  })
  return data.data
}
