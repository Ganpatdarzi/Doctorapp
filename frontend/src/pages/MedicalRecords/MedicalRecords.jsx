import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMyMedicalRecords } from '../../api/emr'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import Error from '../../components/Error/Error'
import EmptyState from '../../components/EmptyState/EmptyState'
import './MedicalRecords.css'

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return value
}

const MedicalRecords = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyMedicalRecords({ page, limit: 10 })
      setRecords(res.records || res || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load medical records.'))
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <div className="med-records-page">
      <div className="med-records-container">
        <div className="med-records-header">
          <h1>Medical Records</h1>
          <Link to="/my-appointments" className="book-new-btn">My Appointments</Link>
        </div>

        <p className="med-records-intro">
          Your medical history, prescriptions, reports and follow-up notes shared by your doctors.
        </p>

        {loading ? (
          <div className="med-records-loading">
            <div className="loading-spinner"></div>
            <p>Loading medical records...</p>
          </div>
        ) : error ? (
          <Error message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No medical records yet"
            description="Prescriptions, diagnoses and reports from your consultations will appear here."
          />
        ) : (
          <div className="med-records-list">
            {records.map((record) => {
              const doctor = record.doctorId || {}
              const appointment = record.appointmentId || {}
              return (
                <Link key={record._id} to={`/medical-records/${record._id}`} className="med-record-card">
                  <div className="med-record-left">
                    <img
                      src={getImageUrl(doctor.image) || 'https://via.placeholder.com/48?text=D'}
                      alt={doctor.name || 'Doctor'}
                      className="med-record-doctor-img"
                    />
                    <div className="med-record-doctor-info">
                      <h4 className="med-record-doctor-name">{doctor.name || 'Unknown Doctor'}</h4>
                      <p className="med-record-doctor-spec">{doctor.specialization || ''}</p>
                    </div>
                  </div>
                  <div className="med-record-center">
                    <div className="med-record-detail">
                      <span className="detail-label">Visit Date</span>
                      <span className="detail-value">{formatDate(record.visitDate || appointment.date)}</span>
                    </div>
                    <div className="med-record-detail">
                      <span className="detail-label">Diagnosis</span>
                      <span className="detail-value diagnosis">{record.diagnosis || '—'}</span>
                    </div>
                    <div className="med-record-detail">
                      <span className="detail-label">Medications</span>
                      <span className="detail-value">{(record.prescriptions || []).length}</span>
                    </div>
                    <div className="med-record-detail">
                      <span className="detail-label">Reports</span>
                      <span className="detail-value">{(record.reports || []).length}</span>
                    </div>
                  </div>
                  <div className="med-record-right">
                    {record.prescriptionPdf && <span className="med-record-rx-badge">📄 Rx PDF</span>}
                    <span className="med-record-view">View Record →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="page-btn"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalRecords
