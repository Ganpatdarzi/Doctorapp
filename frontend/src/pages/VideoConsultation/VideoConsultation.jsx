import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMeeting, recordMeetingEvent } from '../../api/meetings'
import { loadJitsiScript } from '../../utils/jitsi'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import './VideoConsultation.css'

const VideoConsultation = () => {
  const { appointmentId } = useParams()
  const { notify, toastEl } = useToast()

  const [appointment, setAppointment] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callEnded, setCallEnded] = useState(false)

  const containerRef = useRef(null)
  const apiRef = useRef(null)
  const joinedRef = useRef(false)

  const recordLeave = useCallback(async () => {
    if (!joinedRef.current) return
    joinedRef.current = false
    try {
      await recordMeetingEvent(appointmentId, 'leave')
    } catch {
      // History logging is best-effort.
    }
  }, [appointmentId])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getMeeting(appointmentId)
      .then((res) => {
        if (!mounted) return
        setAppointment(res.appointment)
        setMeeting(res.meeting)
      })
      .catch((err) => {
        if (!mounted) return
        setError(getErrorMessage(err, 'Could not load the meeting.'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [appointmentId])

  const disposeApi = () => {
    if (apiRef.current) {
      apiRef.current.dispose()
      apiRef.current = null
    }
  }

  const startMeeting = async () => {
    setJoining(true)
    setError('')
    try {
      const JitsiMeetExternalAPI = await loadJitsiScript()
      const myName = appointment?.userId?.name || 'Patient'
      const myEmail = appointment?.userId?.email || ''

      const api = new JitsiMeetExternalAPI(meeting.domain, {
        roomName: meeting.room,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: { displayName: myName, email: myEmail },
        configOverwrite: {
          prejoinConfig: { enabled: true },
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableInviteFunctions: true,
          disableDeepLinking: true,
          hideConferenceSubject: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_LOGO_URL: '',
          DEFAULT_WELCOME_PAGE_LOGO_URL: '',
        },
      })
      apiRef.current = api

      api.addEventListeners({
        videoConferenceJoined: async () => {
          joinedRef.current = true
          setInCall(true)
          try {
            await recordMeetingEvent(appointmentId, 'join')
          } catch {
            // History logging is best-effort.
          }
        },
        videoConferenceLeft: () => {
          recordLeave()
          disposeApi()
          setInCall(false)
          setCallEnded(true)
        },
        readyToClose: () => {
          disposeApi()
        },
      })
      setJoining(false)
    } catch (err) {
      setJoining(false)
      setError(err.message || 'Could not start the meeting.')
      notify(err.message || 'Could not start the meeting.', 'error')
    }
  }

  const closeMeeting = () => {
    recordLeave()
    disposeApi()
    setInCall(false)
    setCallEnded(true)
  }

  useEffect(() => {
    return () => {
      recordLeave()
      disposeApi()
    }
  }, [recordLeave])

  if (loading) {
    return (
      <div className="vc-page">
        <div className="vc-loading">
          <div className="loading-spinner"></div>
          <p>Preparing your consultation...</p>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="vc-page">
        <div className="vc-error-box">
          <h2>Unable to start the meeting</h2>
          <p>{error}</p>
          <Link to="/my-appointments" className="vc-btn-primary">← Back to Appointments</Link>
        </div>
      </div>
    )
  }

  if (callEnded) {
    return (
      <div className="vc-page">
        <div className="vc-ended-box">
          <div className="vc-ended-icon">📞</div>
          <h2>Meeting Ended</h2>
          <p>Thank you for joining the video consultation.</p>
          <div className="vc-ended-actions">
            <Link to="/my-appointments" className="vc-btn-primary">Back to Appointments</Link>
          </div>
        </div>
      </div>
    )
  }

  const doctor = appointment?.doctorId || {}

  return (
    <div className="vc-page">
      {toastEl}

      <div className="vc-meeting-stage">
        {inCall ? (
          <div className="vc-call-container">
            <div className="vc-call-topbar">
              <span className="vc-live-badge"><span className="vc-live-dot"></span> Live consultation</span>
              <button className="vc-leave-btn" onClick={closeMeeting}>Leave Meeting</button>
            </div>
            <div ref={containerRef} className="vc-call-frame"></div>
          </div>
        ) : (
          <div className="vc-waiting-room">
            <div className="vc-waiting-card">
              <div className="vc-waiting-header">
                <div className="vc-waiting-avatar">
                  {doctor.image ? (
                    <img src={getImageUrl(doctor.image)} alt={doctor.name} />
                  ) : (
                    <span>{doctor.name?.[0] || 'D'}</span>
                  )}
                </div>
                <div className="vc-waiting-title">
                  <h2>{doctor.name || 'Doctor'}</h2>
                  <p>{doctor.specialization || 'Video Consultation'}</p>
                </div>
              </div>

              <div className="vc-schedule">
                <div className="vc-schedule-row">
                  <span>Date</span>
                  <strong>
                    {appointment?.date
                      ? new Date(appointment.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
                <div className="vc-schedule-row">
                  <span>Time</span>
                  <strong>{appointment?.timeSlot || '—'}</strong>
                </div>
              </div>

              <div className="vc-features">
                <p>This is a secure, private video consultation. Before you join:</p>
                <ul>
                  <li>Your camera and microphone will be checked in the pre-join screen.</li>
                  <li>Use the in-call tools for chat and screen sharing if needed.</li>
                  <li>If the doctor hasn't arrived yet, wait here — they will join the same room.</li>
                </ul>
              </div>

              {error && <div className="vc-error-inline">{error}</div>}

              <button
                className="vc-join-btn"
                onClick={startMeeting}
                disabled={joining || !meeting}
              >
                {joining ? 'Connecting...' : '📹 Join Video Call'}
              </button>
              <Link to="/my-appointments" className="vc-back-link">← Back to Appointments</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoConsultation
