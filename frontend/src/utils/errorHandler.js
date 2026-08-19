export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) {
    const message = error.response.data.message
    const fieldErrors = error.response.data.errors
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors[0]
    }
    return message
  }
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection and try again.'
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }
  return fallback
}

export const getFieldErrors = (error) => {
  const data = error?.response?.data
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors
  }
  return []
}
