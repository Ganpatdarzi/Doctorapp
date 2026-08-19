import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getPaymentForAppointment } from '../../api/payments'
import { getErrorMessage } from '../../utils/errorHandler'
import './PaymentStatus.css'

const PAYMENT_LABELS = {
  paid: { label: 'Paid', cls: 'paid' },
  pending: { label: 'Pending', cls: 'pending' },
  failed: { label: 'Failed', cls: 'failed' },
  refunded: { label: 'Refunded', cls: 'refunded' },
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment') || ''

  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!appointmentId) {
      setError('Missing appointment information. Please open this page from your appointment.')
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const res = await getPaymentForAppointment(appointmentId)
        if (cancelled) return
        setPayment(res)

        if (res.status === 'pending' && attempt < 12) {
          setTimeout(() => {
            if (!cancelled) setAttempt((a) => a + 1)
          }, 2500)
          return
        }

        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(getErrorMessage(err, 'Could not verify your payment.'))
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [appointmentId, attempt])

  if (loading) {
    return (
      <div className="payment-status-page">
        <div className="payment-status-card">
          <div className="payment-status-loading">
            <div className="loading-spinner"></div>
            <h2>Verifying your payment...</h2>
            <p>Please wait a moment while we confirm your transaction.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="payment-status-page">
        <div className="payment-status-card">
          <div className="status-icon failed">✕</div>
          <h2>Payment could not be verified</h2>
          <p className="status-message">{error || 'No payment record was found for this appointment.'}</p>
          <div className="status-actions">
            <Link to="/my-appointments" className="status-btn-primary">View My Appointments</Link>
            <Link to="/payment-history" className="status-btn-secondary">Payment History</Link>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = payment.status === 'paid'
  const status = PAYMENT_LABELS[payment.status] || PAYMENT_LABELS.pending
  const doctor = payment.doctorId || {}
  const appointment = payment.appointmentId || {}

  return (
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className={`status-icon ${isPaid ? 'success' : 'failed'}`}>{isPaid ? '✓' : '✕'}</div>
        <h2>{isPaid ? 'Payment Successful!' : payment.status === 'pending' ? 'Payment Processing' : 'Payment Not Completed'}</h2>
        <p className="status-message">
          {isPaid
            ? `Your payment for the appointment with ${doctor.name || 'the doctor'} has been received.`
            : payment.status === 'pending'
              ? 'Your payment is still processing. Refresh this page in a moment.'
              : 'Your payment was not completed. You can try again or pay at the clinic.'}
        </p>

        {payment.provider === 'demo' && (
          <div className="demo-banner">Demo mode: no real charge was made.</div>
        )}

        <div className="status-details">
          <div className="status-detail">
            <span className="detail-label">Receipt No</span>
            <span className="detail-value">{payment.receiptNumber}</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Doctor</span>
            <span className="detail-value">{doctor.name}</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Date</span>
            <span className="detail-value">{appointment.date || 'N/A'}</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Time</span>
            <span className="detail-value">{appointment.timeSlot || 'N/A'}</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Amount</span>
            <span className="detail-value amount">Rs. {payment.amount}</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Status</span>
            <span className={`payment-badge ${status.cls}`}>{status.label}</span>
          </div>
        </div>

        <div className="status-actions">
          {isPaid && (
            <Link to={`/receipt/${payment._id}`} className="status-btn-primary">View Receipt</Link>
          )}
          <Link to="/my-appointments" className="status-btn-secondary">My Appointments</Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
