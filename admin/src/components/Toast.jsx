import { useState, useCallback } from 'react'
import './Toast.css'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const toastEl = (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : '✕'}</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  )

  return { notify, toastEl }
}
