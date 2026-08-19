import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, LoadingState } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './DoctorCommon.css'
import './DoctorAvailability.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DURATIONS = [15, 20, 30, 45, 60]

const DoctorAvailability = () => {
  const { notify, toastEl } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    isAvailable: true,
    availableDays: [],
    workingHours: { start: '09:00', end: '17:00' },
    breakTimings: [],
    appointmentDuration: 30,
    availableSlots: [],
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/doctor/profile')
        const doc = data.data || data
        setForm({
          isAvailable: doc.isAvailable !== false,
          availableDays: Array.isArray(doc.availableDays) ? doc.availableDays : [],
          workingHours: {
            start: doc.workingHours?.start || '09:00',
            end: doc.workingHours?.end || '17:00',
          },
          breakTimings: Array.isArray(doc.breakTimings) && doc.breakTimings.length ? doc.breakTimings : [{ start: '', end: '' }],
          appointmentDuration: doc.appointmentDuration || 30,
          availableSlots: Array.isArray(doc.availableSlots) ? doc.availableSlots : [],
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load availability')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const handleTimeChange = (field, value) => {
    setForm((prev) => ({ ...prev, workingHours: { ...prev.workingHours, [field]: value } }))
  }

  const handleBreakChange = (index, field, value) => {
    setForm((prev) => {
      const next = prev.breakTimings.map((b, i) => (i === index ? { ...b, [field]: value } : b))
      return { ...prev, breakTimings: next }
    })
  }

  const addBreak = () => {
    setForm((prev) => ({ ...prev, breakTimings: [...prev.breakTimings, { start: '', end: '' }] }))
  }

  const removeBreak = (index) => {
    setForm((prev) => ({ ...prev, breakTimings: prev.breakTimings.filter((_, i) => i !== index) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const breaks = form.breakTimings.filter((b) => b.start && b.end)

    if (form.availableDays.length === 0) {
      setError('Please select at least one working day.')
      setSaving(false)
      return
    }

    try {
      await axiosClient.patch('/doctor/availability', {
        isAvailable: form.isAvailable,
        availableDays: form.availableDays,
        workingHours: form.workingHours,
        breakTimings: breaks,
        appointmentDuration: Number(form.appointmentDuration),
      })
      notify('Availability updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState text="Loading availability..." />

  return (
    <div className="d-availability-page">
      {toastEl}

      <PageHeader
        title="Availability Settings"
        subtitle="Control when patients can book appointments with you."
      >
        <Link to="/doctor/schedule" className="d-btn d-btn-primary">Manage Schedule & Slots</Link>
      </PageHeader>

      {error && <div className="d-error-banner">{error}</div>}

      <form className="d-form" onSubmit={handleSave}>
        <div className="d-form-section">
          <h3>Status</h3>
          <div className="d-availability-status">
            <label className="d-toggle">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              />
              <span className={`d-toggle-track ${form.isAvailable ? 'on' : ''}`} />
              <span className="d-toggle-label">
                {form.isAvailable ? 'Accepting new appointments' : 'Not accepting new appointments'}
              </span>
            </label>
          </div>
        </div>

        <div className="d-form-section">
          <h3>Working Days</h3>
          <div className="d-checkbox-group">
            {DAYS.map((day) => (
              <label key={day} className={`d-checkbox-label ${form.availableDays.includes(day) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={form.availableDays.includes(day)}
                  onChange={() => handleDayToggle(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="d-form-section">
          <h3>Working Hours</h3>
          <div className="d-form-grid">
            <div className="d-form-group">
              <label>Clinic Opening Time</label>
              <input type="time" className="d-input" value={form.workingHours.start} onChange={(e) => handleTimeChange('start', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Clinic Closing Time</label>
              <input type="time" className="d-input" value={form.workingHours.end} onChange={(e) => handleTimeChange('end', e.target.value)} />
            </div>
            <div className="d-form-group">
              <label>Appointment Duration</label>
              <select className="d-select" value={form.appointmentDuration} onChange={(e) => setForm((prev) => ({ ...prev, appointmentDuration: Number(e.target.value) }))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="d-form-section">
          <div className="d-section-header">
            <div>
              <h3 className="d-section-title">Break Timings</h3>
              <p className="d-section-subtitle">Appointment slots overlapping these breaks will not be generated.</p>
            </div>
            <button type="button" className="d-btn d-btn-outline d-btn-sm" onClick={addBreak}>+ Add Break</button>
          </div>
          {form.breakTimings.length === 0 && <p className="d-user-sub">No breaks configured.</p>}
          <div className="d-break-list">
            {form.breakTimings.map((b, i) => (
              <div key={i} className="d-break-row">
                <div className="d-form-group">
                  <label>Start</label>
                  <input type="time" className="d-input" value={b.start} onChange={(e) => handleBreakChange(i, 'start', e.target.value)} />
                </div>
                <div className="d-form-group">
                  <label>End</label>
                  <input type="time" className="d-input" value={b.end} onChange={(e) => handleBreakChange(i, 'end', e.target.value)} />
                </div>
                <button type="button" className="d-btn d-btn-danger d-btn-sm" onClick={() => removeBreak(i)}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="d-form-section">
          <h3>Current Available Slots</h3>
          {form.availableSlots.length === 0 ? (
            <p className="d-user-sub">No slots configured yet. Generate slots from your schedule on the Schedule page.</p>
          ) : (
            <div className="d-chip-group">
              {form.availableSlots.map((slot) => (
                <span key={slot} className="d-chip on">{slot}</span>
              ))}
            </div>
          )}
          <p className="d-user-sub" style={{ marginTop: 12 }}>
            Slot changes are managed on the <Link to="/doctor/schedule">Schedule Management</Link> page.
          </p>
        </div>

        <div className="d-form-actions">
          <button type="submit" className="d-btn d-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorAvailability
