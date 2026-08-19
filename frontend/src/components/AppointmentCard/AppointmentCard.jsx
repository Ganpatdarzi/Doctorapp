import { useState } from 'react'
import getImageUrl from '../../utils/imageUrl'
import { APPOINTMENT_STATUS_MAP } from '../../constants'
import './AppointmentCard.css'

const STATUS_CLASSES = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  rejected: 'status-rejected',
}

const PAYMENT_LABELS = {
  paid: 'Paid',
  pending: 'Payment Pending',
  refunded: 'Refunded',
  free: 'Free',
  failed: 'Payment Failed',
}

const PAYMENT_CLASSES = {
  paid: 'payment-paid',
  pending: 'payment-pending',
  refunded: 'payment-refunded',
  free: 'payment-free',
  failed: 'payment-failed',
}

const isCancellable = (status) => ['pending', 'confirmed'].includes(status)

const canPayNow = (appointment) =>
  appointment.paymentMethod === 'online' &&
  ['pending', 'failed'].includes(appointment.paymentStatus) &&
  isCancellable(appointment.status)

const AppointmentCard = ({ appointment, onCancel, onReschedule, onPay, onJoin }) => {
  const [cancelling, setCancelling] = useState(false)
  const doctor = appointment.doctorId || {}
  const status = appointment.status || 'pending'
  const statusClass = STATUS_CLASSES[status] || 'status-pending'
  const paymentStatus = appointment.paymentStatus || 'pending'
  const paymentClass = PAYMENT_CLASSES[paymentStatus] || 'payment-pending'
  const paymentLabel = PAYMENT_LABELS[paymentStatus] || paymentStatus

  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return
    setCancelling(true)
    try {
      await onCancel(appointment._id)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className={`appointment-card ${status}`}>
      <div className="appointment-card-left">
        <img
          src={getImageUrl(doctor.image) || 'https://via.placeholder.com/56?text=D'}
          alt={doctor.name || 'Doctor'}
          className="appointment-doctor-img"
        />
        <div className="appointment-doctor-info">
          <h4 className="appointment-doctor-name">{doctor.name || 'Unknown Doctor'}</h4>
          <p className="appointment-doctor-spec">{doctor.specialization || ''}</p>
          {doctor.location && <p className="appointment-doctor-location">📍 {doctor.location}</p>}
        </div>
      </div>
      <div className="appointment-card-center">
        <div className="appointment-detail">
          <span className="detail-label">Date</span>
          <span className="detail-value">{formattedDate}</span>
        </div>
        <div className="appointment-detail">
          <span className="detail-label">Time</span>
          <span className="detail-value">{appointment.timeSlot || 'N/A'}</span>
        </div>
        <div className="appointment-detail">
          <span className="detail-label">Fee</span>
          <span className="detail-value fee">Rs. {appointment.consultationFee || 0}</span>
        </div>
        <div className="appointment-detail">
          <span className="detail-label">Payment</span>
          <span className={`payment-status-badge ${paymentClass}`}>{paymentLabel}</span>
        </div>
        <div className="appointment-detail">
          <span className="detail-label">Consultation</span>
          <span className="detail-value">
            {appointment.meetingType === 'video' ? '📹 Video' : '🏥 In Clinic'}
          </span>
        </div>
      </div>
      <div className="appointment-card-right">
        <span className={`appointment-status ${statusClass}`}>
          {APPOINTMENT_STATUS_MAP[status] || status}
        </span>
        {appointment.meetingType === 'video' && appointment.status === 'confirmed' && onJoin && (
          <button className="join-meeting-btn" onClick={() => onJoin(appointment)}>
            📹 Join Video Call
          </button>
        )}
        {canPayNow(appointment) && onPay && (
          <button className="pay-now-btn" onClick={() => onPay(appointment)}>
            Pay Now
          </button>
        )}
        {isCancellable(status) && onCancel && (
          <button className="cancel-btn" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
        {isCancellable(status) && onReschedule && (
          <button className="reschedule-btn" onClick={() => onReschedule(appointment)}>
            Reschedule
          </button>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard
