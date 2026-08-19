import { useState, useEffect, useMemo } from 'react'
import { getDoctorById } from '../../api/doctors'
import { rescheduleAppointment } from '../../api/appointments'
import { getErrorMessage } from '../../utils/errorHandler'
import { DAY_NAMES } from '../../constants'
import './RescheduleModal.css'

const toLocalDateKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const RescheduleModal = ({ open, appointment, onClose, onSuccess }) => {
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !appointment) return
    setSelectedDate('')
    setSelectedSlot('')
    setError('')
    setLoading(true)
    getDoctorById(appointment.doctorId?._id || appointment.doctorId)
      .then((res) => setDoctor(res))
      .catch((err) => setError(getErrorMessage(err, 'Could not load doctor availability.')))
      .finally(() => setLoading(false))
  }, [open, appointment])

  const nextDays = useMemo(() => {
    if (!doctor) return []
    const days = []
    const blocked = new Set(doctor.blockedDates || [])
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateKey = toLocalDateKey(date)
      const dayName = DAY_NAMES[date.getDay()]
      days.push({
        date: dateKey,
        day: dayName,
        dayShort: dayName.slice(0, 3),
        dayNum: date.getDate(),
        month: date.toLocaleString('en-US', { month: 'short' }),
        isAvailable: (doctor.availableDays || []).includes(dayName) && !blocked.has(dateKey),
      })
    }
    return days
  }, [doctor])

  if (!open) return null

  const selectedDayInfo = nextDays.find((d) => d.date === selectedDate)

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select both a new date and time slot.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await rescheduleAppointment(appointment._id, {
        date: selectedDate,
        timeSlot: selectedSlot,
      })
      onSuccess?.(selectedDate, selectedSlot)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reschedule appointment.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="resched-overlay" onClick={submitting ? undefined : onClose}>
      <div className="resched-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="resched-header">
          <span className="resched-icon">🔄</span>
          <div>
            <h3 className="resched-title">Reschedule Appointment</h3>
            <p className="resched-subtitle">Pick a new date and time with {doctor?.name || 'the doctor'}</p>
          </div>
        </div>

        {loading ? (
          <div className="resched-loading">
            <div className="loading-spinner"></div>
            <p>Loading doctor availability...</p>
          </div>
        ) : (
          <>
            <div className="resched-section">
              <h4 className="resched-section-title">Select New Date</h4>
              <div className="resched-date-grid">
                {nextDays.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={`resched-date-card ${selectedDate === day.date ? 'selected' : ''} ${!day.isAvailable ? 'disabled' : ''}`}
                    onClick={() => {
                      setSelectedDate(day.date)
                      setSelectedSlot('')
                    }}
                    disabled={!day.isAvailable}
                  >
                    <span className="resched-date-day">{day.dayShort}</span>
                    <span className="resched-date-num">{day.dayNum}</span>
                    <span className="resched-date-month">{day.month}</span>
                    {!day.isAvailable && <span className="resched-date-na">N/A</span>}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && selectedDayInfo && (
              <div className="resched-section">
                <h4 className="resched-section-title">Select Time Slot</h4>
                <p className="resched-section-desc">
                  Slots for {selectedDayInfo.day}, {selectedDayInfo.month} {selectedDayInfo.dayNum}
                </p>
                <div className="resched-slot-grid">
                  {(doctor.availableSlots || []).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`resched-slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="resched-current">
              <span className="resched-current-label">Current appointment</span>
              <span className="resched-current-value">
                {appointment?.date ? new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}{' '}
                at {appointment?.timeSlot || 'N/A'}
              </span>
            </div>

            {error && <div className="resched-error">{error}</div>}

            <div className="resched-actions">
              <button className="resched-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button className="resched-submit" onClick={handleSubmit} disabled={submitting || !selectedDate || !selectedSlot}>
                {submitting ? 'Rescheduling...' : 'Confirm New Time'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RescheduleModal
