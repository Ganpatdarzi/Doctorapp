import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, ErrorBanner, formatDate, formatTime } from '../components/DoctorUI'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './EmrDetail.css'

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const AdminEMRDetail = () => {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const fetchRecord = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/emr/records/${id}`)
      setRecord(data.data || data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecord()
  }, [id])

  const handleDownloadPdf = async () => {
    setBusy('rx')
    try {
      const res = await axiosClient.get(`/emr/records/${id}/prescription?download=1`, { responseType: 'blob' })
      const headerName = res.headers['content-disposition']
      let filename = 'prescription.pdf'
      if (headerName) {
        const m = headerName.match(/filename="?([^";]+)"?/i)
        if (m) filename = m[1]
      }
      downloadBlob(res.data, filename)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download prescription')
    } finally {
      setBusy('')
    }
  }

  const handleDownloadReport = async (report) => {
    setBusy(`d-${report._id}`)
    try {
      const res = await axiosClient.get(`/emr/records/${id}/reports/${report._id}`, { responseType: 'blob' })
      downloadBlob(res.data, report.originalName || 'report')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download report')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <LoadingState text="Loading medical record..." />
  if (error) return (
    <div>
      <ErrorBanner message={error} />
      <Link to="/emr" className="d-btn d-btn-outline">← Back to Medical Records</Link>
    </div>
  )
  if (!record) return <EmptyState text="Medical record not found" />

  const patient = record.userId || {}
  const doctor = record.doctorId || {}
  const appointment = record.appointmentId || {}

  return (
    <div className="d-emr-detail">
      <PageHeader
        title="Medical Record"
        subtitle={`${patient.name || 'Unknown'} • ${doctor.name || 'Unknown Doctor'} • ${formatDate(record.visitDate)}`}
      >
        <Link to="/emr" className="d-btn d-btn-outline">← Back to Medical Records</Link>
      </PageHeader>

      <div className="d-detail-grid">
        <Section title="Patient Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img
              src={getImageUrl(patient.image) || 'https://via.placeholder.com/52?text=P'}
              alt={patient.name}
              className="d-avatar"
              style={{ width: 52, height: 52 }}
            />
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
          </div>
        </Section>

        <Section title="Doctor Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img
              src={getImageUrl(doctor.image) || 'https://via.placeholder.com/52?text=D'}
              alt={doctor.name}
              className="d-avatar"
              style={{ width: 52, height: 52 }}
            />
            <div>
              <div className="d-user-name" style={{ fontSize: '1.05rem' }}>Dr. {doctor.name || 'Unknown'}</div>
              <div className="d-user-sub">{doctor.specialization || ''}</div>
            </div>
          </div>
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Visit Date</span>
              <span className="d-detail-value">{formatDate(record.visitDate)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Linked Appointment</span>
              <span className="d-detail-value">
                {appointment._id ? `${formatDate(appointment.date)} • ${formatTime(appointment.timeSlot)}` : 'None'}
              </span>
            </div>
            {appointment._id && (
              <div className="d-detail-row">
                <span className="d-detail-label">Appointment Status</span>
                <span className="d-detail-value"><StatusBadge status={appointment.status} /></span>
              </div>
            )}
            <div className="d-detail-row">
              <span className="d-detail-label">Record Created</span>
              <span className="d-detail-value">{formatDateTime(record.createdAt)}</span>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Diagnosis">
        <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
          {record.diagnosis || '—'}
        </p>
      </Section>

      <Section title="Treatment Plan">
        <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
          {record.treatmentPlan || '—'}
        </p>
      </Section>

      <Section title={`Prescription (${(record.prescriptions || []).length})`}>
        {record.prescriptions.length === 0 ? (
          <p className="d-user-sub">No medications prescribed.</p>
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
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
                    <td className="d-user-name">{p.medicine}</td>
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
          <div className="d-emr-pdf-block" style={{ marginTop: 16 }}>
            <div>
              <strong>Prescription PDF</strong>
              <p className="d-user-sub">{record.prescriptionPdf.originalName} • {formatFileSize(record.prescriptionPdf.size)}</p>
            </div>
            <button className="d-btn d-btn-outline d-btn-sm" disabled={busy === 'rx'} onClick={handleDownloadPdf}>
              {busy === 'rx' ? 'Working...' : 'Download PDF'}
            </button>
          </div>
        )}
      </Section>

      <Section title={`Reports (${record.reports.length})`}>
        {record.reports.length === 0 ? (
          <p className="d-user-sub">No reports uploaded.</p>
        ) : (
          <ul className="d-emr-files">
            {record.reports.map((report) => (
              <li key={report._id} className="d-emr-file-row">
                <div className="d-user-cell">
                  <span style={{ fontSize: '1.2rem' }}>📎</span>
                  <div>
                    <div className="d-user-name">{report.originalName}</div>
                    <div className="d-user-sub">{formatDateTime(report.uploadedAt)}{formatFileSize(report.size) ? ` • ${formatFileSize(report.size)}` : ''}</div>
                  </div>
                </div>
                <div className="d-actions">
                  <button className="d-btn d-btn-outline d-btn-sm" disabled={!!busy} onClick={() => handleDownloadReport(report)}>
                    {busy === `d-${report._id}` ? 'Working...' : 'Download'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Follow-up Notes (${record.followUpNotes.length})`}>
        <ul className="d-emr-notes">
          {record.followUpNotes.length === 0 ? (
            <li className="d-user-sub" style={{ listStyle: 'none' }}>No follow-up notes yet.</li>
          ) : (
            record.followUpNotes.map((note) => (
              <li key={note._id} className="d-emr-note">
                <p>{note.text}</p>
                <span>{formatDateTime(note.createdAt)}</span>
              </li>
            ))
          )}
        </ul>
      </Section>
    </div>
  )
}

export default AdminEMRDetail
