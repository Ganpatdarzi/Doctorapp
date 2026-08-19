import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { chatWithAssistant } from '../../api/assistant'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import './AssistantWidget.css'

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: "Hello! 👋 I'm your DocBook health assistant. Describe your symptoms, ask about doctors or appointments, or tap a quick action below.",
}

const QUICK_ACTIONS = [
  { key: 'symptoms', label: '🩺 Check symptoms' },
  { key: 'tip', label: '💡 Health tip' },
  { key: 'book', label: '📅 Book a doctor' },
  { key: 'help', label: '❓ Help' },
]

const AssistantWidget = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleQuickAction = (key) => {
    setError('')
    if (key === 'symptoms') {
      setOpen(false)
      navigate('/assistant')
      return
    }
    if (key === 'book') {
      setOpen(false)
      navigate('/doctors')
      return
    }
    const preset = key === 'tip' ? 'Give me a health tip' : 'What can you do?'
    sendMessage(preset)
  }

  const sendMessage = async (text) => {
    const message = (text ?? input).trim()
    if (!message || sending) return
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setSending(true)
    try {
      const reply = await chatWithAssistant(message)
      setMessages((prev) => [...prev, { role: 'assistant', ...reply }])
    } catch (err) {
      setError(getErrorMessage(err, 'Sorry, I could not respond right now.'))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  return (
    <div className={`aiw-root ${open ? 'open' : ''}`}>
      {open && (
        <div className="aiw-panel">
          <div className="aiw-header">
            <div className="aiw-header-info">
              <span className="aiw-avatar">🤖</span>
              <div>
                <strong>Health Assistant</strong>
                <span className="aiw-online"><span className="aiw-dot"></span> Online</span>
              </div>
            </div>
            <button className="aiw-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="aiw-messages">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`aiw-bubble ${m.role}`}>
                  <div className="aiw-bubble-text">{m.text}</div>
                  {m.type === 'symptom-check' && m.data?.conditions?.length > 0 && (
                    <div className="aiw-conditions">
                      {m.data.conditions.map((c) => (
                        <span key={c.id} className={`aiw-cond-chip sev-${c.severity}`}>
                          {c.name} · {c.specialist}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.data?.doctors?.length > 0 && (
                    <div className="aiw-doctors">
                      {m.data.doctors.map((d) => (
                        <Link
                          to={`/book-appointment/${d._id}`}
                          key={d._id}
                          className="aiw-doctor-row"
                          onClick={() => setOpen(false)}
                        >
                          <img
                            src={getImageUrl(d.image) || 'https://via.placeholder.com/32?text=D'}
                            alt={d.name}
                          />
                          <div>
                            <strong>{d.name}</strong>
                            <span>{d.specialization} · Rs. {d.fees}</span>
                          </div>
                          <span className="aiw-book">Book</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.type === 'symptom-check' && m.data?.specialist && (
                    <Link
                      to={`/doctors?specialization=${encodeURIComponent(m.data.specialist)}`}
                      className="aiw-find-doctors"
                      onClick={() => setOpen(false)}
                    >
                      Find {m.data.specialist}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="aiw-bubble assistant">
                <div className="aiw-typing"><span></span><span></span><span></span></div>
              </div>
            )}
            {error && <div className="aiw-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="aiw-quick-actions">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.key} className="aiw-action" onClick={() => handleQuickAction(a.key)}>
                {a.label}
              </button>
            ))}
          </div>

          <form className="aiw-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="aiw-send" disabled={sending || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}

      <button className="aiw-fab" onClick={() => setOpen(!open)} aria-label="Open health assistant">
        {open ? '✕' : '🤖'}
      </button>
    </div>
  )
}

export default AssistantWidget
