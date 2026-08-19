import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, formatDate, formatTime, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const DoctorAppointmentDetails = () => {
  const { id } = useParams()
  const { notify, toastEl } = useToast()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const fetchAppointment = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/doctor/appointments/${id}`)
      const appt = data.data || data
      setAppointment(appt)
      setNotes(appt.doctorNotes || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointment()
  }, [id])

  const handleAction = async (action) => {
    setActionLoading(action)
    try {
      await axiosClient.patch(`/doctor/appointments/${id}`, { action, doctorNotes: notes })
      notify(`Appointment ${action === 'accept' ? 'accepted' : action} successfully`)
      fetchAppointment()
    } catch (err) {
      notify(err.response?.data?.message || `Failed to ${action} appointment`, 'error')
    } finally {
      setActionLoading('')
    }
  }

  const handleCancel = async () => {
    const reason = window.prompt('Please provide a cancellation reason (optional):', notes) ?? null
    if (reason === null) return
    setActionLoading('cancel')
    try {
      await axiosClient.patch(`/doctor/appointments/${id}`, { action: 'cancel', doctorNotes: reason })
      notify('Appointment cancelled')
      fetchAppointment()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to cancel appointment', 'error')
    } finally {
      setActionLoading('')
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await axiosClient.patch(`/doctor/appointments/${id}/notes`, { doctorNotes: notes })
      notify('Consultation notes saved')
      fetchAppointment()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save notes', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleClinicPayment = async (action) => {
    setActionLoading(action)
    try {
      await axiosClient.patch(`/doctor/appointments/${id}/clinic-payment`, { action })
      notify(action === 'paid' ? 'Payment marked as received' : 'Payment marked as unpaid')
      fetchAppointment()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update payment', 'error')
    } finally {
      setActionLoading('')
    }
  }

  if (loading) return <LoadingState text="Loading appointment..." />
  if (error) return (
    <div>
      <div className="d-error-banner">{error}</div>
      <Link to="/doctor/appointments" className="d-btn d-btn-outline">← Back to Appointments</Link>
    </div>
  )

  if (!appointment) return <EmptyState text="Appointment not found" />

  const patient = appointment.userId || {}

  return (
    <div className="d-appointment-detail">
      {toastEl}

      <PageHeader
        title="Appointment Details"
        subtitle={`Booking reference: ${appointment._id || 'N/A'}`}
      >
        <Link to="/doctor/appointments" className="d-btn d-btn-outline">← Back to Appointments</Link>
      </PageHeader>

      <div className="d-detail-grid">
        <Section title="Patient Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/60?text=P'} alt={patient.name} className="d-avatar" style={{ width: 56, height: 56 }} />
            <div>
              <div className="d-user-name" style={{ fontSize: '1.05rem' }}>{patient.name || 'Unknown'}</div>
              <div className="d-user-sub">{patient.email || ''}</div>
            </div>
          </div>
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Phone</span>
              <span className="d-detail-value">{patient.phone || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Gender</span>
              <span className="d-detail-value">{patient.gender || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Date of Birth</span>
              <span className="d-detail-value">{patient.dob ? formatDate(patient.dob) : 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Address</span>
              <span className="d-detail-value">{patient.address || 'N/A'}</span>
            </div>
          </div>
        </Section>

        <Section title="Appointment Information">
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Date</span>
              <span className="d-detail-value">{formatDate(appointment.date)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Time</span>
              <span className="d-detail-value">{formatTime(appointment.timeSlot)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Status</span>
              <span className="d-detail-value"><StatusBadge status={appointment.status} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Consultation Type</span>
              <span className="d-detail-value">
                {appointment.meetingType === 'video' ? '📹 Video Call' : '🏥 In Clinic'}
              </span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Consultation Fee</span>
              <span className="d-detail-value">{formatCurrency(appointment.consultationFee)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Payment</span>
              <span className="d-detail-value"><StatusBadge status={appointment.paymentStatus || 'unpaid'} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Payment Method</span>
              <span className="d-detail-value">{appointment.paymentMethod ? (appointment.paymentMethod === 'online' ? 'Online' : 'Clinic') : '—'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Patient Notes</span>
              <span className="d-detail-value">{appointment.patientNotes || '—'}</span>
            </div>
            {appointment.cancellationReason && (
              <div className="d-detail-row">
                <span className="d-detail-label">Cancellation Reason</span>
                <span className="d-detail-value">{appointment.cancellationReason}</span>
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section title="Manage Appointment">
        <div className="d-actions" style={{ gap: 10 }}>
          {appointment.status === 'pending' && (
            <>
              <button className="d-btn d-btn-success" disabled={!!actionLoading} onClick={() => handleAction('accept')}>
                {actionLoading === 'accept' ? 'Processing...' : '✓ Accept Request'}
              </button>
              <button className="d-btn d-btn-danger" disabled={!!actionLoading} onClick={() => handleAction('reject')}>
                {actionLoading === 'reject' ? 'Processing...' : '✕ Reject'}
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              {appointment.meetingType === 'video' && (
                <Link to={`/doctor/consultation/${appointment._id}`} className="d-btn d-btn-success">
                  📹 Join Video Consultation
                </Link>
              )}
              <button className="d-btn d-btn-success" disabled={!!actionLoading} onClick={() => handleAction('complete')}>
                {actionLoading === 'complete' ? 'Processing...' : '✓ Mark Completed'}
              </button>
              <button className="d-btn d-btn-danger" disabled={!!actionLoading} onClick={handleCancel}>
                {actionLoading === 'cancel' ? 'Processing...' : '✕ Cancel Appointment'}
              </button>
            </>
          )}
          {appointment.status === 'pending' && (
            <button className="d-btn d-btn-danger" disabled={!!actionLoading} onClick={handleCancel}>
              {actionLoading === 'cancel' ? 'Processing...' : '✕ Cancel'}
            </button>
          )}
          {!['pending', 'confirmed'].includes(appointment.status) && (
            <span className="d-user-sub">This appointment can no longer be modified.</span>
          )}
          {appointment.paymentMethod === 'clinic' && appointment.paymentStatus === 'pending' && (
            <button className="d-btn d-btn-success" disabled={!!actionLoading} onClick={() => handleClinicPayment('paid')}>
              {actionLoading === 'paid' ? 'Processing...' : '💵 Mark Payment Received'}
            </button>
          )}
          {appointment.paymentMethod === 'clinic' && appointment.paymentStatus === 'paid' && (
            <button className="d-btn d-btn-outline" disabled={!!actionLoading} onClick={() => handleClinicPayment('pending')}>
              {actionLoading === 'pending' ? 'Processing...' : 'Undo Payment'}
            </button>
          )}
        </div>
      </Section>

      <Section title="Consultation Notes" subtitle="Add clinical notes for this consultation.">
        <textarea
          className="d-textarea"
          rows="4"
          placeholder="Write your consultation notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="d-form-actions">
          <button className="d-btn d-btn-primary" disabled={savingNotes} onClick={handleSaveNotes}>
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </Section>

      {['confirmed', 'completed'].includes(appointment.status) && (
        <Section title="Electronic Medical Record" subtitle="Create or manage the medical record for this patient.">
          <Link to={`/doctor/emr/new?appointmentId=${appointment._id}&patientId=${appointment.userId?._id || ''}`} className="d-btn d-btn-primary">
            📋 Create Medical Record
          </Link>
        </Section>
      )}
    </div>
  )
}

export default DoctorAppointmentDetails
