import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getDoctorById } from '../../api/doctors'
import { bookAppointment } from '../../api/appointments'
import { createCheckoutSession } from '../../api/payments'
import { useToast } from '../../context/ToastContext'
import getImageUrl from '../../utils/imageUrl'
import { getErrorMessage } from '../../utils/errorHandler'
import Error from '../../components/Error/Error'
import PaymentConfirmation from '../../components/PaymentConfirmation/PaymentConfirmation'
import { DAY_NAMES } from '../../constants'
import './AppointmentBooking.css'

const AppointmentBooking = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify, toastEl } = useToast()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [patientNotes, setPatientNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [consultationType, setConsultationType] = useState('clinic')
  const [booking, setBooking] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState(null)
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLoadError(null)
    getDoctorById(id)
      .then((res) => {
        if (!mounted) return
        setDoctor(res)
      })
      .catch((err) => {
        if (!mounted) return
        setLoadError(err.response?.data?.message || 'Doctor not found. Please go back and try again.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id])

  const nextDays = useMemo(() => {
    if (!doctor) return []
    const days = []
    const toLocalDateKey = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dayName = DAY_NAMES[date.getDay()]
      days.push({
        date: toLocalDateKey(date),
        day: dayName,
        dayShort: dayName.slice(0, 3),
        dayNum: date.getDate(),
        month: date.toLocaleString('en-US', { month: 'short' }),
        isAvailable: (doctor.availableDays || []).includes(dayName),
      })
    }
    return days
  }, [doctor])

  const selectedDayInfo = nextDays.find((d) => d.date === selectedDate)

  const fee = doctor?.consultationFee ?? doctor?.fees
  const formatFullDate = (dateKey) => {
    if (!dateKey) return '—'
    return new Date(dateKey).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }
  const consultationLabel = consultationType === 'video' ? 'Video Call' : 'In Clinic'
  const paymentLabel = paymentMethod === 'online' ? 'Pay Online' : 'Pay at Clinic'
  const selectionReady = Boolean(selectedDate && selectedSlot)

  const steps = [
    { label: 'Date', done: Boolean(selectedDate) },
    { label: 'Time', done: Boolean(selectedSlot) },
    { label: 'Details', done: selectionReady },
    { label: 'Confirm', done: bookingConfirmed },
  ]
  const currentStep = steps.findIndex((s) => !s.done)

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) {
      setBookingError('Please select both a date and time slot.')
      return
    }
    setBooking(true)
    setBookingError('')
    try {
      const res = await bookAppointment({
        doctorId: doctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientNotes: patientNotes.trim() || undefined,
        paymentMethod,
        meetingType: consultationType,
      })
      const appointment = res.appointment || res
      setBookedAppointment(appointment)
      setBookingConfirmed(true)

      if (paymentMethod === 'online') {
        setConfirmPaymentOpen(true)
        return
      }

      notify('Appointment booked successfully')
    } catch (err) {
      setBookingError(getErrorMessage(err, 'Failed to book appointment. Please try again.'))
    } finally {
      setBooking(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!bookedAppointment) return
    setProcessingPayment(true)
    try {
      const checkout = await createCheckoutSession(bookedAppointment._id)
      if (checkout.demo) {
        setProcessingPayment(false)
        notify('Payment completed (demo mode)')
        navigate(`/payment/success?appointment=${bookedAppointment._id}`)
        return
      }
      if (checkout.url) {
        window.location.href = checkout.url
        return
      }
      setProcessingPayment(false)
      notify('Appointment booked successfully')
    } catch (err) {
      setProcessingPayment(false)
      notify(
        getErrorMessage(err, 'Appointment booked, but payment could not be initiated. You can pay later from My Appointments.'),
        'error'
      )
    }
  }

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-loading">
            <div className="loading-spinner"></div>
            <p>Loading doctor details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !doctor) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <Error message={loadError || 'Doctor not found.'} />
        </div>
      </div>
    )
  }

  if (bookingConfirmed) {
    if (processingPayment) {
      return (
        <div className="booking-page">
          {toastEl}
          <div className="booking-container">
            <div className="booking-success">
              <div className="processing-payment">
                <div className="loading-spinner"></div>
                <h2>Redirecting to secure payment...</h2>
                <p>Your appointment is reserved. Please complete the payment to confirm it.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="booking-page">
        {toastEl}
        <div className="booking-container">
          <div className="booking-success">
            <div className="success-icon">✓</div>
            <h2>Appointment Booked Successfully!</h2>
            <p>Your appointment with {doctor.name} has been scheduled.</p>
            <div className="success-details">
              <div className="success-detail">
                <span className="detail-label">Doctor</span>
                <span className="detail-value">{doctor.name}</span>
              </div>
              <div className="success-detail">
                <span className="detail-label">Date</span>
                <span className="detail-value">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="success-detail">
                <span className="detail-label">Time</span>
                <span className="detail-value">{selectedSlot}</span>
              </div>
              <div className="success-detail">
                <span className="detail-label">Fee</span>
                <span className="detail-value fee">Rs. {doctor.consultationFee ?? doctor.fees}</span>
              </div>
              {bookedAppointment?.bookingId && (
                <div className="success-detail">
                  <span className="detail-label">Booking ID</span>
                  <span className="detail-value">{bookedAppointment.bookingId}</span>
                </div>
              )}
            </div>
            <div className="success-actions">
              <Link to="/my-appointments" className="success-btn-primary">View My Appointments</Link>
              <Link to="/doctors" className="success-btn-secondary">Browse More Doctors</Link>
            </div>
          </div>
        </div>

        <PaymentConfirmation
          open={confirmPaymentOpen && !processingPayment}
          appointment={bookedAppointment}
          busy={processingPayment}
          onConfirm={handleConfirmPayment}
          onClose={() => setConfirmPaymentOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="booking-page">
      {toastEl}
      <div className="booking-container">
        <div className="booking-header">
          <Link to={`/doctor/${doctor._id}`} className="back-link">← Back to Doctor Profile</Link>
          <h1>Book Appointment</h1>
        </div>

        <div className="booking-steps" aria-label="Booking progress">
          {steps.map((step, i) => (
            <Fragment key={step.label}>
              {i > 0 && <span className="booking-step-connector"></span>}
              <div
                className={`booking-step ${step.done ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}
              >
                <span className="booking-step-num">{step.done ? '✓' : i + 1}</span>
                <span className="booking-step-label">{step.label}</span>
              </div>
            </Fragment>
          ))}
        </div>

        <div className="booking-content">
          <div className="booking-doctor-card">
            {doctor.image ? (
              <img src={getImageUrl(doctor.image)} alt={doctor.name} className="booking-doctor-img" />
            ) : (
              <div className="booking-doctor-avatar">{doctor.name?.[0]}</div>
            )}
            <div className="booking-doctor-info">
              <h3>{doctor.name}</h3>
              <p className="booking-doctor-spec">{doctor.specialization}</p>
              <p className="booking-doctor-fee">
                Consultation Fee: <strong>Rs. {fee}</strong>
              </p>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <div className="booking-form-main">
              <div className="booking-section">
                <h2>Select Date</h2>
                <p className="section-desc">Choose an available date for your appointment</p>
                <div className="date-picker-grid">
                  {nextDays.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      className={`date-card ${selectedDate === day.date ? 'selected' : ''} ${!day.isAvailable ? 'disabled' : ''}`}
                      onClick={() => {
                        setSelectedDate(day.date)
                        setSelectedSlot('')
                      }}
                      disabled={!day.isAvailable}
                      aria-pressed={selectedDate === day.date}
                    >
                      <span className="date-day">{day.dayShort}</span>
                      <span className="date-num">{day.dayNum}</span>
                      <span className="date-month">{day.month}</span>
                      {!day.isAvailable && <span className="date-na">N/A</span>}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedDayInfo && (
                <div className="booking-section">
                  <h2>Select Time Slot</h2>
                  <p className="section-desc">
                    Available slots for {selectedDayInfo.day}, {selectedDayInfo.month} {selectedDayInfo.dayNum}
                  </p>
                  <div className="time-slot-grid">
                    {(doctor.availableSlots || []).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                        aria-pressed={selectedSlot === slot}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="booking-section">
                <h2>Visit Details</h2>
                <p className="section-desc">Choose how you'd like to consult and pay</p>

                <div className="payment-method-section">
                  <h3>Consultation Type</h3>
                  <div className="payment-method-group">
                    <button
                      type="button"
                      className={`payment-option ${consultationType === 'clinic' ? 'selected' : ''}`}
                      onClick={() => setConsultationType('clinic')}
                      aria-pressed={consultationType === 'clinic'}
                    >
                      <span className="payment-option-icon">🏥</span>
                      <div className="payment-option-text">
                        <strong>In Clinic</strong>
                        <small>Visit the doctor at their clinic</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`payment-option ${consultationType === 'video' ? 'selected' : ''}`}
                      onClick={() => setConsultationType('video')}
                      aria-pressed={consultationType === 'video'}
                    >
                      <span className="payment-option-icon">📹</span>
                      <div className="payment-option-text">
                        <strong>Video Call</strong>
                        <small>Online consultation over video</small>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="payment-method-section">
                  <h3>Payment Method</h3>
                  <div className="payment-method-group">
                    <button
                      type="button"
                      className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('online')}
                      aria-pressed={paymentMethod === 'online'}
                    >
                      <span className="payment-option-icon">💳</span>
                      <div className="payment-option-text">
                        <strong>Pay Online</strong>
                        <small>Secure payment via Stripe</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`payment-option ${paymentMethod === 'clinic' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('clinic')}
                      aria-pressed={paymentMethod === 'clinic'}
                    >
                      <span className="payment-option-icon">🏥</span>
                      <div className="payment-option-text">
                        <strong>Pay at Clinic</strong>
                        <small>Cash or card on visit</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {selectionReady && (
                <div className="booking-section">
                  <h2>Additional Notes (Optional)</h2>
                  <textarea
                    className="booking-notes"
                    placeholder="Describe your symptoms or any notes for the doctor"
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    rows="3"
                  />
                </div>
              )}
            </div>

            <aside className="booking-summary-card">
              <h2>Booking Summary</h2>
              <p className="booking-summary-note">Your selection updates live as you choose.</p>
              <div className="summary-row">
                <span>Doctor</span>
                <span>{doctor.name}</span>
              </div>
              <div className="summary-row">
                <span>Date</span>
                <span>{formatFullDate(selectedDate)}</span>
              </div>
              <div className="summary-row">
                <span>Time</span>
                <span>{selectedSlot || '—'}</span>
              </div>
              <div className="summary-row">
                <span>Consultation</span>
                <span>{consultationLabel}</span>
              </div>
              <div className="summary-row">
                <span>Payment</span>
                <span>{paymentLabel}</span>
              </div>
              <div className="summary-row">
                <span>Fee</span>
                <span className="summary-fee">Rs. {fee}</span>
              </div>

              {bookingError && <div className="booking-error">{bookingError}</div>}

              <button
                type="submit"
                className="confirm-btn"
                disabled={booking || !selectionReady}
                aria-live="polite"
              >
                {booking ? (
                  <>
                    <span className="btn-spinner"></span>
                    Booking...
                  </>
                ) : (
                  'Confirm Appointment'
                )}
              </button>
              {!selectionReady && (
                <p className="booking-summary-hint">Select a date and time slot to continue.</p>
              )}
              {selectionReady && (
                <p className="booking-summary-hint">Free rescheduling or cancellation up to 24 hours before your appointment.</p>
              )}
            </aside>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AppointmentBooking
