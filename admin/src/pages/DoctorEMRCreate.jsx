import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, LoadingState } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './DoctorCommon.css'

const emptyRx = () => ({ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' })

const DoctorEMRCreate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { notify, toastEl } = useToast()

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '')
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') || '')
  const [visitDate, setVisitDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [rxRows, setRxRows] = useState([emptyRx()])
  const [reportFiles, setReportFiles] = useState([])
  const [pdfFile, setPdfFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchOptions = async () => {
    try {
      const [patientsRes, apptsRes] = await Promise.all([
        axiosClient.get('/doctor/emr/patients', { params: { limit: 100 } }),
        axiosClient.get('/doctor/appointments', { params: { limit: 200 } }),
      ])
      const pData = patientsRes.data?.data || patientsRes.data
      const aData = apptsRes.data?.data || apptsRes.data
      setPatients(pData.patients || [])
      const appts = (aData.appointments || []).filter((a) => ['pending', 'confirmed', 'completed'].includes(a.status))
      setAppointments(appts)

      if (searchParams.get('appointmentId')) {
        const match = appts.find((a) => a._id === searchParams.get('appointmentId'))
        if (match) {
          setPatientId(match.userId?._id || '')
          setVisitDate(match.date || new Date().toLocaleDateString('en-CA'))
        }
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load options', 'error')
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const handleAppointmentChange = (id) => {
    setAppointmentId(id)
    if (id) {
      const match = appointments.find((a) => a._id === id)
      if (match) {
        setPatientId(match.userId?._id || '')
        setVisitDate(match.date || new Date().toLocaleDateString('en-CA'))
      }
    }
  }

  const updateRxRow = (idx, field, value) => {
    setRxRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!patientId) {
      notify('Please select a patient', 'error')
      return
    }

    setSaving(true)
    try {
      const body = {
        userId: patientId,
        appointmentId: appointmentId || null,
        visitDate,
        diagnosis,
        treatmentPlan,
        prescriptions: rxRows.filter((r) => r.medicine.trim()),
      }

      const { data } = await axiosClient.post('/doctor/emr/records', body)
      const recordId = (data.data || data)?._id
      if (!recordId) throw new Error('Could not create record')

      if (reportFiles.length > 0) {
        const fd = new FormData()
        reportFiles.forEach((file) => fd.append('files', file))
        await axiosClient.post(`/doctor/emr/records/${recordId}/reports`, fd)
      }

      if (pdfFile) {
        const fd = new FormData()
        fd.append('file', pdfFile)
        await axiosClient.post(`/doctor/emr/records/${recordId}/prescription-pdf`, fd)
      }

      notify('Medical record created successfully')
      navigate(`/doctor/emr/${recordId}`)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create medical record', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadingOptions) return <LoadingState text="Loading patients..." />

  return (
    <div>
      {toastEl}
      <PageHeader title="Create Medical Record" subtitle="Add a new consultation record for a patient.">
        <Link to="/doctor/emr" className="d-btn d-btn-outline">← Back to Records</Link>
      </PageHeader>

      <form className="d-form" onSubmit={handleSubmit}>
        <Section title="Patient & Visit" subtitle="Select the patient and consultation details.">
          <div className="d-form-grid">
            <div className="d-form-group full">
              <label>Patient</label>
              <select
                className="d-select"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value)
                  setAppointmentId('')
                }}
                style={{ width: '100%' }}
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email || p.phone || 'no contact'})
                  </option>
                ))}
              </select>
            </div>
            <div className="d-form-group full">
              <label>Appointment (optional)</label>
              <select
                className="d-select"
                value={appointmentId}
                onChange={(e) => handleAppointmentChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">No appointment linked</option>
                {appointments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.date} • {a.timeSlot} — {a.userId?.name || 'Unknown'} ({a.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="d-form-group">
              <label>Visit Date</label>
              <input type="date" className="d-input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Clinical Details">
          <div className="d-form-group full" style={{ marginBottom: 16 }}>
            <label>Diagnosis</label>
            <textarea
              className="d-textarea"
              rows="3"
              placeholder="e.g. Hypertension, stage 1"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>
          <div className="d-form-group full">
            <label>Treatment Plan</label>
            <textarea
              className="d-textarea"
              rows="3"
              placeholder="e.g. Lifestyle changes, medication, review in 4 weeks"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
            />
          </div>
        </Section>

        <Section
          title="Prescription"
          subtitle="Add medication items. A printable PDF prescription is generated automatically."
          action={
            <button type="button" className="d-btn d-btn-primary d-btn-sm" onClick={() => setRxRows((r) => [...r, emptyRx()])}>
              + Add Medication
            </button>
          }
        >
          {rxRows.map((row, idx) => (
            <div key={idx} className="d-form-grid" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              <div className="d-form-group">
                <label>Medicine *</label>
                <input
                  type="text"
                  className="d-input"
                  value={row.medicine}
                  onChange={(e) => updateRxRow(idx, 'medicine', e.target.value)}
                  placeholder="e.g. Amlodipine"
                />
              </div>
              <div className="d-form-group">
                <label>Dosage</label>
                <input
                  type="text"
                  className="d-input"
                  value={row.dosage}
                  onChange={(e) => updateRxRow(idx, 'dosage', e.target.value)}
                  placeholder="e.g. 5 mg"
                />
              </div>
              <div className="d-form-group">
                <label>Frequency</label>
                <input
                  type="text"
                  className="d-input"
                  value={row.frequency}
                  onChange={(e) => updateRxRow(idx, 'frequency', e.target.value)}
                  placeholder="e.g. Once daily"
                />
              </div>
              <div className="d-form-group">
                <label>Duration</label>
                <input
                  type="text"
                  className="d-input"
                  value={row.duration}
                  onChange={(e) => updateRxRow(idx, 'duration', e.target.value)}
                  placeholder="e.g. 4 weeks"
                />
              </div>
              <div className="d-form-group">
                <label>Instructions</label>
                <input
                  type="text"
                  className="d-input"
                  value={row.instructions}
                  onChange={(e) => updateRxRow(idx, 'instructions', e.target.value)}
                  placeholder="e.g. Take in the morning"
                />
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
        </Section>

        <Section title="Uploads">
          <div className="d-form-group full" style={{ marginBottom: 16 }}>
            <label>Reports (images, PDFs, documents)</label>
            <input
              type="file"
              className="d-input"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt,.xls,.xlsx"
              onChange={(e) => setReportFiles(Array.from(e.target.files || []))}
            />
            {reportFiles.length > 0 && (
              <p className="d-form-help">{reportFiles.length} file(s) selected: {reportFiles.map((f) => f.name).join(', ')}</p>
            )}
          </div>
          <div className="d-form-group full">
            <label>Prescription PDF (optional — replaces auto-generated PDF)</label>
            <input type="file" className="d-input" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            {pdfFile && <p className="d-form-help">Selected: {pdfFile.name}</p>}
          </div>
        </Section>

        <div className="d-form-actions">
          <Link to="/doctor/emr" className="d-btn d-btn-outline">Cancel</Link>
          <button type="submit" className="d-btn d-btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Medical Record'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorEMRCreate
