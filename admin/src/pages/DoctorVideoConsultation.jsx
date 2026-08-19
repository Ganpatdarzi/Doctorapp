import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { loadJitsiScript } from '../utils/jitsi'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorVideoConsultation.css'

const DoctorVideoConsultation = () => {
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

  const recordEvent = useCallback(async (event) => {
    try {
      await axiosClient.post(`/doctor/meetings/${appointmentId}/history`, { event })
    } catch {
      // History logging is best-effort.
    }
  }, [appointmentId])

  const recordLeave = useCallback(async () => {
    if (!joinedRef.current) return
    joinedRef.current = false
    try {
      await recordEvent('leave')
    } catch {
      // History logging is best-effort.
    }
  }, [recordEvent])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    axiosClient
      .get(`/doctor/meetings/${appointmentId}`)
      .then(({ data }) => {
        if (!mounted) return
        const res = data.data || data
        setAppointment(res.appointment)
        setMeeting(res.meeting)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.response?.data?.message || 'Could not load the meeting.')
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
      const myName = appointment?.doctorId?.name || 'Doctor'
      const myEmail = appointment?.doctorId?.email || ''

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
            await recordEvent('join')
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
      <div className="dvc-page">
        <div className="dvc-loading">
          <div className="loading-spinner"></div>
          <p>Preparing your consultation...</p>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="dvc-page">
        <div className="dvc-error-box">
          <h2>Unable to start the meeting</h2>
          <p>{error}</p>
          <Link to="/doctor/appointments" className="dvc-btn-primary">← Back to Appointments</Link>
        </div>
      </div>
    )
  }

  if (callEnded) {
    return (
      <div className="dvc-page">
        <div className="dvc-ended-box">
          <div className="dvc-ended-icon">📞</div>
          <h2>Meeting Ended</h2>
          <p>Thank you for joining the video consultation.</p>
          <div className="dvc-ended-actions">
            <Link to="/doctor/appointments" className="dvc-btn-primary">Back to Appointments</Link>
          </div>
        </div>
      </div>
    )
  }

  const patient = appointment?.userId || {}

  return (
    <div className="dvc-page">
      {toastEl}

      <div className="dvc-meeting-stage">
        {inCall ? (
          <div className="dvc-call-container">
            <div className="dvc-call-topbar">
              <span className="dvc-live-badge"><span className="dvc-live-dot"></span> Live consultation</span>
              <button className="dvc-leave-btn" onClick={closeMeeting}>Leave Meeting</button>
            </div>
            <div ref={containerRef} className="dvc-call-frame"></div>
          </div>
        ) : (
          <div className="dvc-waiting-room">
            <div className="dvc-waiting-card">
              <div className="dvc-waiting-header">
                <div className="dvc-waiting-avatar">
                  {patient.image ? (
                    <img src={getImageUrl(patient.image)} alt={patient.name} />
                  ) : (
                    <span>{patient.name?.[0] || 'P'}</span>
                  )}
                </div>
                <div className="dvc-waiting-title">
                  <h2>{patient.name || 'Patient'}</h2>
                  <p>{patient.email || 'Video Consultation'}</p>
                </div>
              </div>

              <div className="dvc-schedule">
                <div className="dvc-schedule-row">
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
                <div className="dvc-schedule-row">
                  <span>Time</span>
                  <strong>{appointment?.timeSlot || '—'}</strong>
                </div>
                <div className="dvc-schedule-row">
                  <span>Patient Phone</span>
                  <strong>{patient.phone || '—'}</strong>
                </div>
              </div>

              <div className="dvc-features">
                <p>Before you join:</p>
                <ul>
                  <li>Your camera and microphone will be checked in the pre-join screen.</li>
                  <li>Use the in-call tools for chat and screen sharing if needed.</li>
                  <li>The patient will join the same room — no links to share.</li>
                </ul>
              </div>

              {error && <div className="dvc-error-inline">{error}</div>}

              <button
                className="dvc-join-btn"
                onClick={startMeeting}
                disabled={joining || !meeting}
              >
                {joining ? 'Connecting...' : '📹 Join Video Call'}
              </button>
              <Link to="/doctor/appointments" className="dvc-back-link">← Back to Appointments</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorVideoConsultation
