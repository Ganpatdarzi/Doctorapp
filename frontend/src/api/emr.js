import axiosClient from '../axios/axiosClient'

export const getMyMedicalRecords = async (params = {}) => {
  const { data } = await axiosClient.get('/emr/my-records', { params })
  return data.data
}

export const getMedicalRecordById = async (id) => {
  const { data } = await axiosClient.get(`/emr/my-records/${id}`)
  return data.data
}

const blobFrom = async (url) => {
  const res = await axiosClient.get(url, { responseType: 'blob' })
  const headerName = res.headers['content-disposition']
  let filename = 'download'
  if (headerName) {
    const match = headerName.match(/filename="?([^";]+)"?/i)
    if (match) filename = match[1]
  }
  return { blob: res.data, filename }
}

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const downloadPrescription = async (recordId) => {
  const { blob, filename } = await blobFrom(`/emr/records/${recordId}/prescription?download=1`)
  triggerDownload(blob, filename)
  return filename
}

export const viewPrescription = async (recordId) => {
  const res = await axiosClient.get(`/emr/records/${recordId}/prescription`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(res.data)
  window.open(url, '_blank')
}

export const downloadReport = async (recordId, reportId, originalName) => {
  const { blob } = await blobFrom(`/emr/records/${recordId}/reports/${reportId}`)
  triggerDownload(blob, originalName || 'report')
}

export const viewReport = async (recordId, reportId) => {
  const res = await axiosClient.get(`/emr/records/${recordId}/reports/${reportId}`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(res.data)
  window.open(url, '_blank')
}
