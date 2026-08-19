import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, ConfirmDialog, formatDate, formatTime, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']

const AdminAppointmentDetails = () => {
  const { id } = useParams()
  const { notify, toastEl } = useToast()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchAppointment = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/admin/appointments/${id}`)
      const appt = data.data || data
      setAppointment(appt)
      setStatus(appt.status || '')
      setCancellationReason(appt.cancellationReason || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointment()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { status }
      if (status === 'cancelled') payload.cancellationReason = cancellationReason
      const { data } = await axiosClient.patch(`/admin/appointments/${id}/status`, payload)
      setAppointment(data.data || data)
      notify(`Appointment status updated to ${status}`)
      fetchAppointment()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update appointment', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/appointments/${id}`)
      notify('Appointment deleted successfully')
      setShowDelete(false)
      window.setTimeout(() => (window.location.href = '/appointments'), 800)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete appointment', 'error')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState text="Loading appointment..." />
  if (error) return (
    <div>
      <div className="d-error-banner">{error}</div>
      <Link to="/appointments" className="d-btn d-btn-outline">← Back to Appointments</Link>
    </div>
  )

  if (!appointment) return <EmptyState text="Appointment not found" />

  const patient = appointment.userId || {}
  const doctor = appointment.doctorId || {}

  return (
    <div className="d-appointment-detail">
      {toastEl}

      <PageHeader
        title="Appointment Details"
        subtitle={`Booking reference: ${appointment._id || 'N/A'}`}
      >
        <Link to="/appointments" className="d-btn d-btn-outline">← Back to Appointments</Link>
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

        <Section title="Doctor Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img src={getImageUrl(doctor.image) || 'https://via.placeholder.com/60?text=D'} alt={doctor.name} className="d-avatar" style={{ width: 56, height: 56 }} />
            <div>
              <div className="d-user-name" style={{ fontSize: '1.05rem' }}>{doctor.name || 'N/A'}</div>
              <div className="d-user-sub">{doctor.specialization || ''}</div>
            </div>
          </div>
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Email</span>
              <span className="d-detail-value">{doctor.email || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Phone</span>
              <span className="d-detail-value">{doctor.phone || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Fee</span>
              <span className="d-detail-value">{formatCurrency(doctor.fees)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Profile</span>
              <span className="d-detail-value">
                <Link to={`/doctors/${doctor._id}`} className="d-btn d-btn-ghost d-btn-sm">View</Link>
              </span>
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
              <span className="d-detail-label">Consultation Fee</span>
              <span className="d-detail-value">{formatCurrency(appointment.consultationFee)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Payment</span>
              <span className="d-detail-value"><StatusBadge status={appointment.paymentStatus} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Patient Notes</span>
              <span className="d-detail-value">{appointment.patientNotes || '—'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Doctor Notes</span>
              <span className="d-detail-value">{appointment.doctorNotes || '—'}</span>
            </div>
            {appointment.cancellationReason && (
              <div className="d-detail-row">
                <span className="d-detail-label">Cancellation Reason</span>
                <span className="d-detail-value">{appointment.cancellationReason}</span>
              </div>
            )}
            <div className="d-detail-row">
              <span className="d-detail-label">Booked</span>
              <span className="d-detail-value">{appointment.createdAt ? new Date(appointment.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </Section>

        <Section title="Update Status">
          <div className="d-form" style={{ maxWidth: '100%' }}>
            <div className="d-form-grid">
              <div className="d-form-group full">
                <label>Status</label>
                <select className="d-select" style={{ width: '100%' }} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              {status === 'cancelled' && (
                <div className="d-form-group full">
                  <label>Cancellation Reason</label>
                  <textarea
                    className="d-textarea"
                    rows="3"
                    placeholder="Reason for cancellation..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="d-form-actions">
              <button className="d-btn d-btn-outline" onClick={() => setShowDelete(true)}>🗑 Delete Appointment</button>
              <button className="d-btn d-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setShowDelete(false) }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default AdminAppointmentDetails
