import { useState, useEffect } from 'react'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, LoadingState } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import { generateSlots, sortTimeSlots } from '../utils/slots'
import './DoctorCommon.css'
import './DoctorSchedule.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DoctorSchedule = () => {
  const { notify, toastEl } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [generatedSlots, setGeneratedSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [savingSlots, setSavingSlots] = useState(false)
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [blockedDates, setBlockedDates] = useState([])
  const [savingDates, setSavingDates] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/doctor/profile')
        const doc = data.data || data
        setProfile(doc)
        setSelectedSlots(Array.isArray(doc.availableSlots) ? doc.availableSlots : [])
        setBlockedDates(Array.isArray(doc.blockedDates) ? doc.blockedDates : [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleGenerate = () => {
    const slots = generateSlots(
      profile?.workingHours?.start,
      profile?.workingHours?.end,
      profile?.appointmentDuration,
      profile?.breakTimings || []
    )
    setGeneratedSlots(sortTimeSlots(slots))
    setSelectedSlots(slots)
    notify(`Generated ${slots.length} time slots`)
  }

  const handleSlotToggle = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : sortTimeSlots([...prev, slot])
    )
  }

  const handleSaveSlots = async () => {
    setSavingSlots(true)
    try {
      await axiosClient.patch('/doctor/availability', { availableSlots: selectedSlots })
      setGeneratedSlots([])
      notify('Available slots saved successfully')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save slots', 'error')
    } finally {
      setSavingSlots(false)
    }
  }

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) return
    if (blockedDates.includes(newBlockedDate)) {
      notify('This date is already blocked', 'error')
      return
    }
    setBlockedDates((prev) => [...prev, newBlockedDate].sort())
    setNewBlockedDate('')
  }

  const handleRemoveBlockedDate = (date) => {
    setBlockedDates((prev) => prev.filter((d) => d !== date))
  }

  const handleSaveDates = async () => {
    setSavingDates(true)
    try {
      await axiosClient.patch('/doctor/availability', { blockedDates })
      notify('Blocked dates saved successfully')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save blocked dates', 'error')
    } finally {
      setSavingDates(false)
    }
  }

  if (loading) return <LoadingState text="Loading schedule..." />

  const workingHours = profile?.workingHours || {}

  return (
    <div className="d-schedule-page">
      {toastEl}

      <PageHeader
        title="Schedule Management"
        subtitle="Configure working hours, breaks and auto-generate appointment slots."
      />

      {error && <div className="d-error-banner">{error}</div>}

      <div className="d-detail-grid">
        <Section title="Weekly Schedule" subtitle="Your current working schedule.">
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Working Days</span>
              <span className="d-detail-value d-tag-list" style={{ justifyContent: 'flex-end' }}>
                {DAYS.map((day) => (
                  <span key={day} className={`d-tag ${profile?.availableDays?.includes(day) ? '' : 'd-tag-off'}`}>
                    {day.slice(0, 3)}
                  </span>
                ))}
              </span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Working Hours</span>
              <span className="d-detail-value">{workingHours.start || '09:00'} – {workingHours.end || '17:00'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Appointment Duration</span>
              <span className="d-detail-value">{profile?.appointmentDuration || 30} minutes</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Break Timings</span>
              <span className="d-detail-value">
                {profile?.breakTimings?.filter((b) => b.start && b.end).length
                  ? profile.breakTimings.filter((b) => b.start && b.end).map((b) => `${b.start} – ${b.end}`).join(', ')
                  : 'None'}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Block Dates" subtitle="Block holidays or custom days off.">
          <div className="d-schedule-block-form">
            <input
              type="date"
              className="d-input"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <button type="button" className="d-btn d-btn-primary" onClick={handleAddBlockedDate}>+ Block Date</button>
          </div>

          {blockedDates.length === 0 ? (
            <p className="d-user-sub">No blocked dates. You are available every working day.</p>
          ) : (
            <div className="d-chip-group" style={{ marginTop: 12 }}>
              {blockedDates.map((date) => (
                <span key={date} className="d-chip on">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="d-chip-x" onClick={() => handleRemoveBlockedDate(date)}>×</span>
                </span>
              ))}
            </div>
          )}

          <div className="d-form-actions">
            <button className="d-btn d-btn-primary" disabled={savingDates} onClick={handleSaveDates}>
              {savingDates ? 'Saving...' : 'Save Blocked Dates'}
            </button>
          </div>
        </Section>
      </div>

      <Section
        title="Slot Generator"
        subtitle={`Automatically create appointment slots for your ${workingHours.start || '09:00'} – ${workingHours.end || '17:00'} schedule.`}
        action={
          <button className="d-btn d-btn-primary" onClick={handleGenerate}>
            ⟳ Generate Slots
          </button>
        }
      >
        {generatedSlots.length > 0 ? (
          <>
            <p className="d-user-sub" style={{ marginBottom: 12 }}>
              {generatedSlots.length} slots generated. Click a slot to include or exclude it, then save.
            </p>
            <div className="d-chip-group">
              {generatedSlots.map((slot) => (
                <span key={slot} className={`d-chip ${selectedSlots.includes(slot) ? 'on' : ''}`} onClick={() => handleSlotToggle(slot)}>
                  {slot}
                </span>
              ))}
            </div>
            <div className="d-form-actions">
              <button className="d-btn d-btn-success" disabled={savingSlots} onClick={handleSaveSlots}>
                {savingSlots ? 'Saving...' : `Save ${selectedSlots.length} Slots`}
              </button>
            </div>
          </>
        ) : (
          <p className="d-user-sub">
            {selectedSlots.length > 0
              ? `You currently have ${selectedSlots.length} saved slots. Click "Generate Slots" to regenerate them from your schedule.`
              : 'No slots generated yet. Click "Generate Slots" to build your daily availability from the schedule above.'}
          </p>
        )}
      </Section>
    </div>
  )
}

export default DoctorSchedule
