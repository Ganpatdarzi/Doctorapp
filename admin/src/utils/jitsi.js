let cachedScript = null

export const loadJitsiScript = () => {
  if (cachedScript) return Promise.resolve(cachedScript)
  if (window.JitsiMeetExternalAPI) {
    cachedScript = window.JitsiMeetExternalAPI
    return Promise.resolve(cachedScript)
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => {
      cachedScript = window.JitsiMeetExternalAPI
      resolve(cachedScript)
    }
    script.onerror = () =>
      reject(new Error('Failed to load the Jitsi Meet API. Please check your internet connection.'))
    document.head.appendChild(script)
  })
}
