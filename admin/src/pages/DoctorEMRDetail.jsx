import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, ErrorBanner, ConfirmDialog, formatDate, formatTime } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './EmrDetail.css'

const emptyRx = () => ({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' })

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

const DoctorEMRDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify, toastEl } = useToast()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [rxRows, setRxRows] = useState([])
  const [followUpText, setFollowUpText] = useState('')

  const [savingClinical, setSavingClinical] = useState(false)
  const [savingRx, setSavingRx] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [uploading, setUploading] = useState('')
  const [busy, setBusy] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchRecord = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/doctor/emr/records/${id}`)
      const res = data.data || data
      setRecord(res)
      setDiagnosis(res.diagnosis || '')
      setTreatmentPlan(res.treatmentPlan || '')
      setRxRows((res.prescriptions || []).map((p) => ({ ...emptyRx(), ...p })))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecord()
  }, [id])

  const updateRxRow = (idx, field, value) => {
    setRxRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  const handleSaveClinical = async () => {
    setSavingClinical(true)
    try {
      await axiosClient.put(`/doctor/emr/records/${id}`, { diagnosis, treatmentPlan })
      notify('Clinical details saved')
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save', 'error')
    } finally {
      setSavingClinical(false)
    }
  }

  const handleSaveRx = async () => {
    setSavingRx(true)
    try {
      await axiosClient.put(`/doctor/emr/records/${id}`, { prescriptions: rxRows.filter((r) => r.medicine.trim()) })
      notify('Prescription saved')
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save prescription', 'error')
    } finally {
      setSavingRx(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!followUpText.trim()) return
    setSavingNote(true)
    try {
      await axiosClient.post(`/doctor/emr/records/${id}/followup`, { text: followUpText })
      setFollowUpText('')
      notify('Follow-up note added')
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add note', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  const handleUploadReports = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading('reports')
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      await axiosClient.post(`/doctor/emr/records/${id}/reports`, fd)
      notify(`${files.length} report(s) uploaded`)
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to upload reports', 'error')
    } finally {
      setUploading('')
      e.target.value = ''
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report permanently?')) return
    setBusy(`del-${reportId}`)
    try {
      await axiosClient.delete(`/doctor/emr/records/${id}/reports/${reportId}`)
      notify('Report deleted')
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete report', 'error')
    } finally {
      setBusy('')
    }
  }

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('pdf')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await axiosClient.post(`/doctor/emr/records/${id}/prescription-pdf`, fd)
      notify('Prescription PDF uploaded')
      fetchRecord()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to upload PDF', 'error')
    } finally {
      setUploading('')
      e.target.value = ''
    }
  }

  const handleDownloadPdf = async () => {
    setBusy('rx')
    try {
      const res = await axiosClient.get(`/doctor/emr/records/${id}/prescription?download=1`, { responseType: 'blob' })
      const headerName = res.headers['content-disposition']
      let filename = 'prescription.pdf'
      if (headerName) {
        const m = headerName.match(/filename="?([^";]+)"?/i)
        if (m) filename = m[1]
      }
      downloadBlob(res.data, filename)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to download prescription', 'error')
    } finally {
      setBusy('')
    }
  }

  const handleDownloadReport = async (report) => {
    setBusy(`d-${report._id}`)
    try {
      const res = await axiosClient.get(`/doctor/emr/records/${id}/reports/${report._id}`, { responseType: 'blob' })
      downloadBlob(res.data, report.originalName || 'report')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to download report', 'error')
    } finally {
      setBusy('')
    }
  }

  const handleDeleteRecord = async () => {
    setDeleting(true)
    try {
      await axiosClient.delete(`/doctor/emr/records/${id}`)
      notify('Medical record deleted')
      navigate('/doctor/emr')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete record', 'error')
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState text="Loading medical record..." />
  if (error) return (
    <div>
      <ErrorBanner message={error} />
      <Link to="/doctor/emr" className="d-btn d-btn-outline">← Back to Records</Link>
    </div>
  )
  if (!record) return <EmptyState text="Medical record not found" />

  const patient = record.userId || {}
  const appointment = record.appointmentId || {}

  return (
    <div className="d-emr-detail">
      {toastEl}

      <PageHeader
        title="Medical Record"
        subtitle={`Patient: ${patient.name || 'Unknown'} • Visit: ${formatDate(record.visitDate)}`}
      >
        <div className="d-actions">
          <Link to="/doctor/emr" className="d-btn d-btn-outline">← Back to Records</Link>
          <button className="d-btn d-btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </PageHeader>

      <div className="d-detail-grid">
        <Section title="Patient Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img
              src={getImageUrl(patient.image) || 'https://via.placeholder.com/56?text=P'}
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

        <Section title="Visit Information">
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

      <Section
        title="Diagnosis & Treatment Plan"
        action={
          <button className="d-btn d-btn-primary d-btn-sm" disabled={savingClinical} onClick={handleSaveClinical}>
            {savingClinical ? 'Saving...' : 'Save'}
          </button>
        }
      >
        <div className="d-form-group full" style={{ marginBottom: 16 }}>
          <label>Diagnosis</label>
          <textarea className="d-textarea" rows="3" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>
        <div className="d-form-group full">
          <label>Treatment Plan</label>
          <textarea className="d-textarea" rows="3" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} />
        </div>
      </Section>

      <Section
        title="Prescription"
        subtitle="Save to regenerate the downloadable PDF (only if no custom PDF is uploaded)."
        action={
          <div className="d-actions">
            <button className="d-btn d-btn-primary d-btn-sm" disabled={savingRx} onClick={handleSaveRx}>
              {savingRx ? 'Saving...' : 'Save Prescription'}
            </button>
            <button type="button" className="d-btn d-btn-outline d-btn-sm" onClick={() => setRxRows((r) => [...r, emptyRx()])}>
              + Add
            </button>
          </div>
        }
      >
        {rxRows.length === 0 && <p className="d-user-sub" style={{ marginBottom: 12 }}>No medications yet.</p>}
        {rxRows.map((row, idx) => (
          <div key={idx} className="d-form-grid" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            <div className="d-form-group">
              <label>Medicine</label>
              <input type="text" className="d-input" value={row.medicine} onChange={(e) => updateRxRow(idx, 'medicine', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Dosage</label>
              <input type="text" className="d-input" value={row.dosage} onChange={(e) => updateRxRow(idx, 'dosage', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Frequency</label>
              <input type="text" className="d-input" value={row.frequency} onChange={(e) => updateRxRow(idx, 'frequency', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Duration</label>
              <input type="text" className="d-input" value={row.duration} onChange={(e) => updateRxRow(idx, 'duration', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Instructions</label>
              <input type="text" className="d-input" value={row.instructions} onChange={(e) => updateRxRow(idx, 'instructions', e.target.value)} />
            </div>
            <div className="d-form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end' }}>
              {rxRows.length > 1 && (
                <button type="button" className="d-btn d-btn-danger d-btn-sm" onClick={() => setRxRows((rows) => rows.filter((_, i) => i !== idx))}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="d-emr-pdf-block">
          <div>
            <strong>Prescription PDF</strong>
            {record.prescriptionPdf ? (
              <p className="d-user-sub">
                {record.prescriptionPdf.originalName} • {formatFileSize(record.prescriptionPdf.size)}
              </p>
            ) : (
              <p className="d-user-sub">No PDF yet. Save the prescription to generate one.</p>
            )}
          </div>
          <div className="d-actions">
            {record.prescriptionPdf && (
              <button className="d-btn d-btn-outline d-btn-sm" disabled={busy === 'rx'} onClick={handleDownloadPdf}>
                {busy === 'rx' ? 'Working...' : 'Download PDF'}
              </button>
            )}
            <label className="d-btn d-btn-primary d-btn-sm" style={{ cursor: 'pointer' }}>
              {uploading === 'pdf' ? 'Uploading...' : 'Upload PDF'}
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUploadPdf} />
            </label>
          </div>
        </div>
      </Section>

      <Section
        title={`Reports (${record.reports.length})`}
        action={
          <label className="d-btn d-btn-primary d-btn-sm" style={{ cursor: 'pointer' }}>
            {uploading === 'reports' ? 'Uploading...' : '+ Upload Reports'}
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt,.xls,.xlsx"
              style={{ display: 'none' }}
              onChange={handleUploadReports}
            />
          </label>
        }
      >
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
                  <button className="d-btn d-btn-danger d-btn-sm" disabled={!!busy} onClick={() => handleDeleteReport(report._id)}>
                    {busy === `del-${report._id}` ? '...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Follow-up Notes" subtitle="Add progress or follow-up notes for this patient.">
        <ul className="d-emr-notes">
          {record.followUpNotes.length === 0 ? (
            <li className="d-user-sub" style={{ listStyle: 'none', marginBottom: 12 }}>No follow-up notes yet.</li>
          ) : (
            record.followUpNotes.map((note) => (
              <li key={note._id} className="d-emr-note">
                <p>{note.text}</p>
                <span>{formatDateTime(note.createdAt)}</span>
              </li>
            ))
          )}
        </ul>
        <form className="d-emr-note-form" onSubmit={handleAddNote}>
          <input
            type="text"
            className="d-input"
            placeholder="Add a follow-up note..."
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
          />
          <button type="submit" className="d-btn d-btn-primary d-btn-sm" disabled={savingNote || !followUpText.trim()}>
            {savingNote ? 'Adding...' : 'Add Note'}
          </button>
        </form>
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Medical Record"
        message="This will permanently delete the record and all uploaded files. This action cannot be undone."
        confirmText="Delete Record"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeleteRecord}
      />
    </div>
  )
}

export default DoctorEMRDetail
