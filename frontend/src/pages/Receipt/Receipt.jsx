import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPaymentById } from '../../api/payments'
import { getErrorMessage } from '../../utils/errorHandler'
import Error from '../../components/Error/Error'
import './Receipt.css'

const STATUS_LABELS = {
  paid: { label: 'Paid', cls: 'paid' },
  pending: { label: 'Pending', cls: 'pending' },
  failed: { label: 'Failed', cls: 'failed' },
  refunded: { label: 'Refunded', cls: 'refunded' },
}

const formatDateTime = (str) => {
  if (!str) return 'N/A'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const Receipt = () => {
  const { paymentId } = useParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getPaymentById(paymentId)
      .then((res) => {
        if (mounted) setPayment(res)
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err, 'Could not load receipt.'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [paymentId])

  if (loading) {
    return (
      <div className="receipt-page">
        <div className="receipt-loading">
          <div className="loading-spinner"></div>
          <p>Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="receipt-page">
        <Error message={error || 'Receipt not found.'} />
      </div>
    )
  }

  const doctor = payment.doctorId || {}
  const patient = payment.userId || {}
  const appointment = payment.appointmentId || {}
  const statusInfo = STATUS_LABELS[payment.status] || STATUS_LABELS.pending
  const paidAt = payment.paidAt || payment.createdAt

  return (
    <div className="receipt-page">
      <div className="receipt-actions no-print">
        <Link to="/payment-history" className="status-btn-secondary">← Payment History</Link>
        <button className="status-btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div className="receipt">
        <div className="receipt-header">
          <div className="receipt-brand">
            <span className="receipt-logo">+</span>
            <div>
              <h1>DocBook</h1>
              <p>Doctor Appointment Booking System</p>
            </div>
          </div>
          <div className="receipt-title">
            <h2>Payment Receipt</h2>
            <p>{payment.receiptNumber}</p>
          </div>
        </div>

        <div className="receipt-meta">
          <div>
            <span className="receipt-label">Receipt No</span>
            <span className="receipt-value">{payment.receiptNumber}</span>
          </div>
          <div>
            <span className="receipt-label">Issued On</span>
            <span className="receipt-value">{formatDateTime(payment.createdAt)}</span>
          </div>
          <div>
            <span className="receipt-label">Paid On</span>
            <span className="receipt-value">{formatDateTime(paidAt)}</span>
          </div>
          <div>
            <span className="receipt-label">Payment Method</span>
            <span className="receipt-value">
              {payment.paymentMethod === 'online' ? 'Online (Stripe)' : 'Pay at Clinic'}
            </span>
          </div>
        </div>

        <div className="receipt-section">
          <h3>Billed To</h3>
          <p className="receipt-name">{patient.name || 'Patient'}</p>
          <p>{patient.email || ''}</p>
          {patient.phone && <p>{patient.phone}</p>}
          {patient.address && <p>{patient.address}</p>}
        </div>

        <table className="receipt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Detail</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Consultation fee</td>
              <td>
                Dr. {doctor.name || 'N/A'} — {doctor.specialization || ''}
              </td>
              <td className="receipt-amount">Rs. {payment.amount}</td>
            </tr>
            <tr>
              <td>Appointment</td>
              <td>
                {appointment.date || 'N/A'} at {appointment.timeSlot || 'N/A'}
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <div className="receipt-total">
          <div>
            <span>Total Paid</span>
            <span className="receipt-total-amount">Rs. {payment.amount}</span>
          </div>
          <div>
            <span>Status</span>
            <span className={`payment-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
          </div>
          {payment.provider === 'demo' && (
            <div className="demo-note">Demo transaction — no real charge was made.</div>
          )}
        </div>

        <div className="receipt-footer">
          <p>Thank you for using DocBook. This is a computer-generated receipt.</p>
          <p className="receipt-reference">Reference: {payment._id}</p>
        </div>
      </div>
    </div>
  )
}

export default Receipt
