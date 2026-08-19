import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getMedicalRecordById,
  downloadPrescription,
  viewPrescription,
  downloadReport,
  viewReport,
} from '../../api/emr'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import Error from '../../components/Error/Error'
import './MedicalRecordDetails.css'

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return value
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isViewable = (fileType, originalName) => {
  const name = (originalName || '').toLowerCase()
  if (name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif')) {
    return true
  }
  if (fileType && (fileType.includes('pdf') || fileType.includes('image/'))) return true
  return false
}

const MedicalRecordDetails = () => {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState('')

  const fetchRecord = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMedicalRecordById(id)
      setRecord(res)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load medical record.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecord()
  }, [id])

  const handleDownloadPrescription = async () => {
    setBusy('rx')
    try {
      await downloadPrescription(id)
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to download prescription.'))
    } finally {
      setBusy('')
    }
  }

  const handleViewPrescription = async () => {
    setBusy('rx')
    try {
      await viewPrescription(id)
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to open prescription.'))
    } finally {
      setBusy('')
    }
  }

  const handleDownloadReport = async (report) => {
    setBusy(`d-${report._id}`)
    try {
      await downloadReport(id, report._id, report.originalName)
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to download report.'))
    } finally {
      setBusy('')
    }
  }

  const handleViewReport = async (report) => {
    setBusy(`v-${report._id}`)
    try {
      await viewReport(id, report._id)
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to open report.'))
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <div className="med-record-detail-page">
        <div className="med-record-detail-container">
          <div className="med-records-loading">
            <div className="loading-spinner"></div>
            <p>Loading medical record...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="med-record-detail-page">
        <div className="med-record-detail-container">
          <Link to="/medical-records" className="back-link">← Back to Medical Records</Link>
          <Error message={error} onRetry={fetchRecord} />
        </div>
      </div>
    )
  }

  if (!record) return null

  const doctor = record.doctorId || {}
  const appointment = record.appointmentId || {}

  return (
    <div className="med-record-detail-page">
      <div className="med-record-detail-container">
        <div className="med-record-detail-header">
          <div>
            <Link to="/medical-records" className="back-link">← Back to Medical Records</Link>
            <h1>Medical Record</h1>
            <p className="med-record-detail-sub">Visit date: {formatDate(record.visitDate || appointment.date)}</p>
          </div>
          <div className="med-record-actions">
            {record.prescriptionPdf && (
              <>
                <button className="detail-btn primary" onClick={handleDownloadPrescription} disabled={busy === 'rx'}>
                  {busy === 'rx' ? 'Working...' : '📄 Download Prescription'}
                </button>
                <button className="detail-btn outline" onClick={handleViewPrescription} disabled={busy === 'rx'}>
                  View
                </button>
              </>
            )}
          </div>
        </div>

        <div className="med-record-grid">
          <section className="med-record-section">
            <h2 className="med-record-section-title">Doctor</h2>
            <div className="med-record-doctor-row">
              <img
                src={getImageUrl(doctor.image) || 'https://via.placeholder.com/56?text=D'}
                alt={doctor.name}
                className="med-record-doctor-avatar"
              />
              <div>
                <div className="med-record-doctor-name-lg">Dr. {doctor.name || 'Unknown Doctor'}</div>
                <div className="med-record-doctor-spec-lg">{doctor.specialization || ''}</div>
                {appointment.date && (
                  <div className="med-record-appt-line">
                    Appointment: {formatDate(appointment.date)}
                    {appointment.timeSlot ? ` • ${appointment.timeSlot}` : ''}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="med-record-section">
            <h2 className="med-record-section-title">Diagnosis</h2>
            <p className="med-record-diagnosis">{record.diagnosis || '—'}</p>
          </section>

          <section className="med-record-section">
            <h2 className="med-record-section-title">Treatment Plan</h2>
            <p className="med-record-treatment">{record.treatmentPlan || '—'}</p>
          </section>

          <section className="med-record-section">
            <h2 className="med-record-section-title">Prescription</h2>
            {(record.prescriptions || []).length === 0 ? (
              <p className="med-record-empty-text">No medications prescribed.</p>
            ) : (
              <div className="med-record-table-wrap">
                <table className="med-record-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.prescriptions.map((p, idx) => (
                      <tr key={p._id || idx}>
                        <td className="strong">{p.medicine}</td>
                        <td>{p.dosage || '—'}</td>
                        <td>{p.frequency || '—'}</td>
                        <td>{p.duration || '—'}</td>
                        <td>{p.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {record.prescriptionPdf && (
              <p className="med-record-pdf-note">
                Prescription PDF available ({record.prescriptionPdf.originalName}, {formatFileSize(record.prescriptionPdf.size)}).
              </p>
            )}
          </section>

          <section className="med-record-section">
            <h2 className="med-record-section-title">Uploaded Reports ({record.reports.length})</h2>
            {record.reports.length === 0 ? (
              <p className="med-record-empty-text">No reports uploaded.</p>
            ) : (
              <ul className="med-record-reports">
                {record.reports.map((report) => (
                  <li key={report._id} className="med-record-report-item">
                    <div className="med-record-report-info">
                      <span className="med-record-report-icon">📎</span>
                      <div className="med-record-report-meta">
                        <span className="med-record-report-name">{report.originalName}</span>
                        <span className="med-record-report-sub">
                          {formatDateTime(report.uploadedAt)}{formatFileSize(report.size) ? ` • ${formatFileSize(report.size)}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="med-record-report-actions">
                      {isViewable(report.fileType, report.originalName) && (
                        <button className="detail-btn outline sm" onClick={() => handleViewReport(report)} disabled={!!busy}>
                          {busy === `v-${report._id}` ? 'Opening...' : 'View'}
                        </button>
                      )}
                      <button className="detail-btn outline sm" onClick={() => handleDownloadReport(report)} disabled={!!busy}>
                        {busy === `d-${report._id}` ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="med-record-section">
            <h2 className="med-record-section-title">Follow-up Notes ({record.followUpNotes.length})</h2>
            {record.followUpNotes.length === 0 ? (
              <p className="med-record-empty-text">No follow-up notes yet.</p>
            ) : (
              <ul className="med-record-notes">
                {record.followUpNotes.map((note) => (
                  <li key={note._id} className="med-record-note-item">
                    <p className="med-record-note-text">{note.text}</p>
                    <span className="med-record-note-date">{formatDateTime(note.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default MedicalRecordDetails
