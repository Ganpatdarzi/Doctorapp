import { useState, useEffect } from 'react'
import getImageUrl from '../../utils/imageUrl'
import './PaymentConfirmation.css'

const PaymentConfirmation = ({ open, appointment, busy = false, onConfirm, onClose }) => {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) setConfirmed(false)
  }, [open])

  if (!open) return null

  const doctor = appointment?.doctorId || {}
  const amount = appointment?.consultationFee || doctor?.fees || 0

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="pay-confirm-overlay" onClick={busy ? undefined : onClose}>
      <div className="pay-confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="pay-confirm-header">
          <span className="pay-confirm-shield">🛡️</span>
          <div>
            <h3 className="pay-confirm-title">Confirm Payment</h3>
            <p className="pay-confirm-subtitle">Please verify the details before you pay</p>
          </div>
        </div>

        <div className="pay-confirm-doctor">
          <img
            src={getImageUrl(doctor.image) || 'https://via.placeholder.com/56?text=D'}
            alt={doctor.name || 'Doctor'}
            className="pay-confirm-doctor-img"
          />
          <div className="pay-confirm-doctor-info">
            <span className="pay-confirm-doctor-name">{doctor.name || 'Unknown Doctor'}</span>
            <span className="pay-confirm-doctor-spec">{doctor.specialization || ''}</span>
          </div>
        </div>

        <div className="pay-confirm-details">
          <div className="pay-confirm-row">
            <span className="pay-confirm-label">Date</span>
            <span className="pay-confirm-value">{formatDate(appointment?.date)}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="pay-confirm-label">Time</span>
            <span className="pay-confirm-value">{appointment?.timeSlot || 'N/A'}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="pay-confirm-label">Paying to</span>
            <span className="pay-confirm-value">{doctor.name || 'Unknown Doctor'}</span>
          </div>
          <div className="pay-confirm-row pay-confirm-amount-row">
            <span className="pay-confirm-label">Amount to pay</span>
            <span className="pay-confirm-amount">Rs. {amount}</span>
          </div>
        </div>

        <div className="pay-confirm-warning">
          You are about to pay <strong>Rs. {amount}</strong> to <strong>{doctor.name || 'this doctor'}</strong>.
          Please make sure the recipient name and amount are correct before proceeding.
        </div>

        <label className="pay-confirm-checkbox">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          <span>
            I confirm that I am paying <strong>Rs. {amount}</strong> to <strong>{doctor.name || 'this doctor'}</strong>
            {' '}and the details are correct.
          </span>
        </label>

        <div className="pay-confirm-actions">
          <button className="pay-confirm-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="pay-confirm-submit" onClick={onConfirm} disabled={!confirmed || busy}>
            {busy ? 'Processing...' : `Pay Rs. ${amount} Now`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentConfirmation
