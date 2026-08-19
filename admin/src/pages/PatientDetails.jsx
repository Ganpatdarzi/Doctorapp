import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, StatCard, LoadingState, EmptyState, ConfirmDialog, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const PatientDetails = () => {
  const { id } = useParams()
  const { notify, toastEl } = useToast()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPatient = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/admin/patients/${id}`)
      const res = data.data || data
      setPatient(res.patient || res)
      setAppointments(res.appointments || [])
      setStats(res.stats || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatient()
  }, [id])

  const handleToggleStatus = async () => {
    if (!patient) return
    try {
      const { data } = await axiosClient.patch(`/admin/patients/${id}/status`, {
        status: !patient.isActive,
      })
      setPatient((prev) => ({ ...prev, isActive: data.data?.isActive ?? !prev.isActive }))
      notify(`Patient ${data.data?.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/patients/${id}`)
      notify('Patient deleted successfully')
      setShowDelete(false)
      window.setTimeout(() => (window.location.href = '/patients'), 800)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete patient', 'error')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState text="Loading patient..." />
  if (error) return (
    <div>
      <div className="d-error-banner">{error}</div>
      <Link to="/patients" className="d-btn d-btn-outline">← Back to Patients</Link>
    </div>
  )

  if (!patient) return <EmptyState text="Patient not found" />

  return (
    <div className="d-patient-detail">
      {toastEl}

      <PageHeader title="Patient Details" subtitle={`Patient ID: ${patient._id || 'N/A'}`}>
        <Link to="/patients" className="d-btn d-btn-outline">← Back to Patients</Link>
      </PageHeader>

      <div className="d-detail-grid">
        <Section title="Profile">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/80?text=P'} alt={patient.name} className="d-avatar" style={{ width: 64, height: 64 }} />
            <div>
              <div className="d-user-name" style={{ fontSize: '1.1rem' }}>{patient.name}</div>
              <div className="d-user-sub">{patient.email}</div>
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
            <div className="d-detail-row">
              <span className="d-detail-label">Joined</span>
              <span className="d-detail-value">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <div className="d-actions" style={{ marginTop: 16 }}>
            <button className="d-btn d-btn-outline" onClick={handleToggleStatus}>
              {patient.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button className="d-btn d-btn-danger" onClick={() => setShowDelete(true)}>🗑 Delete</button>
          </div>
        </Section>

        <Section title="Appointment History" subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}>
          {appointments.length === 0 ? (
            <EmptyState text="No appointments yet." />
          ) : (
            <div className="d-table-wrap">
              <table className="d-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => {
                    const doctor = appt.doctorId || {}
                    return (
                      <tr key={appt._id}>
                        <td>
                          <div className="d-user-cell">
                            <img src={getImageUrl(doctor.image) || 'https://via.placeholder.com/40?text=D'} alt={doctor.name} className="d-avatar" />
                            <div>
                              <div className="d-user-name">{doctor.name || 'N/A'}</div>
                              <div className="d-user-sub">{doctor.specialization || ''}</div>
                            </div>
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
        </Section>
      </div>

      {stats && (
        <div className="d-stat-grid">
          <StatCard icon="📅" label="Total" value={stats.total || 0} color="blue" />
          <StatCard icon="✅" label="Completed" value={stats.completed || 0} color="green" />
          <StatCard icon="📌" label="Confirmed" value={stats.confirmed || 0} color="teal" />
          <StatCard icon="⏳" label="Pending" value={stats.pending || 0} color="orange" />
          <StatCard icon="❌" label="Cancelled" value={stats.cancelled || 0} color="red" />
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Patient"
        message="Delete this patient and all their appointments? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setShowDelete(false) }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default PatientDetails
