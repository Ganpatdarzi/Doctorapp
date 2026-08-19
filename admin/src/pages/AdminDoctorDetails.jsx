import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import getImageUrl from '../utils/imageUrl'
import { StatusBadge, LoadingState, ErrorBanner, ConfirmDialog, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './DoctorCommon.css'
import './AdminDoctorDetails.css'

const AdminDoctorDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify, toastEl } = useToast()
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDoctor = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/admin/doctors/${id}`)
      setDoctor(data.data || data)
      const apptRes = await axiosClient.get('/admin/appointments', {
        params: { doctorId: id, limit: 10 },
      })
      const res = apptRes.data.data || apptRes.data
      setAppointments(res.appointments || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctor()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/doctors/${id}`)
      notify('Doctor deleted successfully')
      setShowDelete(false)
      window.setTimeout(() => (window.location.href = '/doctors'), 800)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete doctor', 'error')
      setDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    setToggling(true)
    try {
      const { data } = await axiosClient.patch(`/admin/doctors/${id}/status`, {
        isAvailable: !doctor.isAvailable,
      })
      setDoctor((prev) => ({ ...prev, isAvailable: data.data?.isAvailable ?? !prev.isAvailable }))
      notify(`Doctor ${data.data?.isAvailable ? 'marked available' : 'marked unavailable'}`)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to toggle status', 'error')
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <LoadingState text="Loading doctor details..." />
  if (error) return (
    <div>
      <div className="d-error-banner">{error}</div>
      <Link to="/doctors" className="d-btn d-btn-outline">← Back to Doctors</Link>
    </div>
  )
  if (!doctor) return <div className="empty-state">Doctor not found</div>

  return (
    <div className="doctor-details-page">
      {toastEl}

      <div className="page-header">
        <h1>Doctor Details</h1>
        <div className="header-actions">
          <Link to={`/doctors/edit/${id}`} className="btn-edit-large">Edit Doctor</Link>
          <button className="btn-delete-large" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-card profile-card">
          <div className="profile-header">
            <img
              src={getImageUrl(doctor.image) || 'https://via.placeholder.com/120?text=D'}
              alt={doctor.name}
              className="profile-image"
            />
            <div className="profile-info">
              <h2>{doctor.name}</h2>
              <p className="profile-specialization">{doctor.specialization || 'N/A'}</p>
              <div className="profile-meta">
                <span className="rating">⭐ {doctor.rating || '0.0'}</span>
                <span className="reviews">({doctor.reviews || 0} reviews)</span>
              </div>
            </div>
          </div>
          <div className="status-section">
            <span className={`status-badge ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
              {doctor.isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button className="btn-toggle-status" onClick={handleToggleStatus} disabled={toggling}>
              {toggling ? 'Toggling...' : 'Toggle Status'}
            </button>
            {doctor.isOnline && <span className="online-indicator">● Online</span>}
          </div>
        </div>

        <div className="details-card">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{doctor.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{doctor.phone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender</span>
              <span className="info-value">{doctor.gender || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">{doctor.dob ? new Date(doctor.dob).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <h3>Professional Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Education</span>
              <span className="info-value">{doctor.education || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Experience</span>
              <span className="info-value">{doctor.experience || 0} years</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fees</span>
              <span className="info-value">{formatCurrency(doctor.fees)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Hospital</span>
              <span className="info-value">{doctor.hospital || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location</span>
              <span className="info-value">{doctor.location || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">{doctor.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <h3>About</h3>
          <p className="about-text">{doctor.about || 'No description provided.'}</p>
        </div>

        <div className="details-card">
          <h3>Languages</h3>
          <div className="tags-container">
            {Array.isArray(doctor.languages) && doctor.languages.length > 0
              ? doctor.languages.map((lang, i) => (
                  <span key={i} className="tag">{lang}</span>
                ))
              : <span className="info-value">N/A</span>
            }
          </div>
        </div>

        <div className="details-card">
          <h3>Available Days</h3>
          <div className="tags-container">
            {Array.isArray(doctor.availableDays) && doctor.availableDays.length > 0
              ? doctor.availableDays.map((day, i) => (
                  <span key={i} className="tag">{day}</span>
                ))
              : <span className="info-value">N/A</span>
            }
          </div>
        </div>

        <div className="details-card">
          <h3>Available Slots</h3>
          <div className="tags-container">
            {Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0
              ? doctor.availableSlots.map((slot, i) => (
                  <span key={i} className="tag">{slot}</span>
                ))
              : <span className="info-value">N/A</span>
            }
          </div>
        </div>
      </div>

      <div className="d-section" style={{ marginTop: 20 }}>
        <div className="d-section-header">
          <div>
            <h3 className="d-section-title">Recent Appointments</h3>
            <p className="d-section-subtitle">Latest {appointments.length} booking{appointments.length !== 1 ? 's' : ''} for this doctor</p>
          </div>
          <Link to={`/appointments?doctorId=${id}`} className="d-btn d-btn-ghost d-btn-sm">View All</Link>
        </div>
        {appointments.length === 0 ? (
          <div className="d-empty">No appointments yet.</div>
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const patient = appt.userId || {}
                  return (
                    <tr key={appt._id}>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'} alt={patient.name} className="d-avatar" />
                          <span className="d-user-name">{patient.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{formatDate(appt.date)}</td>
                      <td>{appt.timeSlot || 'N/A'}</td>
                      <td className="d-money">{formatCurrency(appt.consultationFee)}</td>
                      <td><StatusBadge status={appt.status} /></td>
                      <td>
                        <Link to={`/appointments/${appt._id}`} className="d-btn d-btn-ghost d-btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setShowDelete(false) }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default AdminDoctorDetails
