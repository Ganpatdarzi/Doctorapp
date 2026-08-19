import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, ConfirmDialog, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './PaymentDetails.css'

const METHOD_LABELS = { online: 'Online (Stripe)', clinic: 'Pay at Clinic' }

const formatDateTime = (str) => {
  if (!str) return 'N/A'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const PaymentDetails = () => {
  const { id } = useParams()
  const { notify, toastEl } = useToast()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRefund, setShowRefund] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [showEditAmount, setShowEditAmount] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editReason, setEditReason] = useState('')
  const [savingAmount, setSavingAmount] = useState(false)

  const fetchPayment = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get(`/admin/payments/${id}`)
      setPayment(data.data || data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayment()
  }, [id])

  const handleRefund = async () => {
    setRefunding(true)
    try {
      const { data } = await axiosClient.post(`/admin/payments/${id}/refund`, {})
      setPayment(data.data || data)
      notify('Payment refunded successfully')
      setShowRefund(false)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to refund payment', 'error')
      setShowRefund(false)
    } finally {
      setRefunding(false)
    }
  }

  const openEditAmount = () => {
    setEditAmount(payment?.amount != null ? String(payment.amount) : '')
    setEditReason('')
    setShowEditAmount(true)
  }

  const handleSaveAmount = async () => {
    const value = Number(editAmount)
    if (!editAmount || isNaN(value) || value <= 0) {
      notify('Enter a valid amount greater than 0', 'error')
      return
    }
    setSavingAmount(true)
    try {
      const { data } = await axiosClient.patch(`/admin/payments/${id}`, {
        amount: value,
        reason: editReason.trim() || undefined,
      })
      setPayment(data.data || data)
      notify('Payment amount updated')
      setShowEditAmount(false)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update payment amount', 'error')
    } finally {
      setSavingAmount(false)
    }
  }

  if (loading) return <LoadingState text="Loading payment..." />
  if (error) return (
    <div>
      <div className="d-error-banner">{error}</div>
      <Link to="/payments" className="d-btn d-btn-outline">← Back to Payments</Link>
    </div>
  )
  if (!payment) return <EmptyState text="Payment not found" />

  const patient = payment.userId || {}
  const doctor = payment.doctorId || {}
  const appointment = payment.appointmentId || {}

  return (
    <div className="d-payment-detail">
      {toastEl}

      <PageHeader title="Payment Details" subtitle={`Receipt: ${payment.receiptNumber}`}>
        <Link to="/payments" className="d-btn d-btn-outline">← Back to Payments</Link>
      </PageHeader>

      <div className="d-detail-grid">
        <Section title="Payment Information">
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Receipt No</span>
              <span className="d-detail-value">{payment.receiptNumber}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Amount</span>
              <span className="d-detail-value d-money">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Status</span>
              <span className="d-detail-value"><StatusBadge status={payment.status} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Method</span>
              <span className="d-detail-value">{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Provider</span>
              <span className="d-detail-value">
                {payment.provider === 'demo' ? 'Demo mode (no real charge)' : payment.provider === 'stripe' ? 'Stripe' : payment.provider}
              </span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Transaction ID</span>
              <span className="d-detail-value">{payment.providerPaymentId || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Paid On</span>
              <span className="d-detail-value">{formatDateTime(payment.paidAt)}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Receipt URL</span>
              <span className="d-detail-value">
                {payment.receiptUrl ? (
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="d-btn d-btn-ghost d-btn-sm">Open Stripe Receipt</a>
                ) : 'N/A'}
              </span>
            </div>
            {payment.amountEdited?.editedAt && (
              <>
                <div className="d-detail-row">
                  <span className="d-detail-label">Original Amount</span>
                  <span className="d-detail-value d-money">{formatCurrency(payment.amountEdited.previousAmount)}</span>
                </div>
                <div className="d-detail-row">
                  <span className="d-detail-label">Amount Changed On</span>
                  <span className="d-detail-value">{formatDateTime(payment.amountEdited.editedAt)}</span>
                </div>
                <div className="d-detail-row">
                  <span className="d-detail-label">Change Reason</span>
                  <span className="d-detail-value">{payment.amountEdited.reason || 'No reason provided'}</span>
                </div>
              </>
            )}
            {payment.refund?.refundId && (
              <>
                <div className="d-detail-row">
                  <span className="d-detail-label">Refund ID</span>
                  <span className="d-detail-value">{payment.refund.refundId}</span>
                </div>
                <div className="d-detail-row">
                  <span className="d-detail-label">Refund Reason</span>
                  <span className="d-detail-value">{payment.refund.reason || 'N/A'}</span>
                </div>
                <div className="d-detail-row">
                  <span className="d-detail-label">Refunded On</span>
                  <span className="d-detail-value">{formatDateTime(payment.refund.refundedAt)}</span>
                </div>
              </>
            )}
          </div>

          {payment.status !== 'refunded' && (
            <div className="d-form-actions" style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className="d-btn d-btn-outline" onClick={openEditAmount}>✏ Edit Amount</button>
              {payment.status === 'paid' && (
                <button className="d-btn d-btn-danger" onClick={() => setShowRefund(true)}>↩ Refund Payment</button>
              )}
            </div>
          )}
        </Section>

        <Section title="Patient Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/60?text=P'} alt={patient.name} className="d-avatar" style={{ width: 56, height: 56 }} />
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
              <span className="d-detail-label">Address</span>
              <span className="d-detail-value">{patient.address || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Profile</span>
              <span className="d-detail-value">
                <Link to={`/patients/${patient._id}`} className="d-btn d-btn-ghost d-btn-sm">View</Link>
              </span>
            </div>
          </div>
        </Section>

        <Section title="Doctor Information">
          <div className="d-user-cell" style={{ marginBottom: 16 }}>
            <img src={getImageUrl(doctor.image) || 'https://via.placeholder.com/60?text=D'} alt={doctor.name} className="d-avatar" style={{ width: 56, height: 56 }} />
            <div>
              <div className="d-user-name" style={{ fontSize: '1.05rem' }}>{doctor.name || 'N/A'}</div>
              <div className="d-user-sub">{doctor.specialization || ''}</div>
            </div>
          </div>
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Hospital</span>
              <span className="d-detail-value">{doctor.hospital || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Location</span>
              <span className="d-detail-value">{doctor.location || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Profile</span>
              <span className="d-detail-value">
                <Link to={`/doctors/${doctor._id}`} className="d-btn d-btn-ghost d-btn-sm">View</Link>
              </span>
            </div>
          </div>
        </Section>

        <Section title="Appointment Information">
          <div className="d-detail-list">
            <div className="d-detail-row">
              <span className="d-detail-label">Date</span>
              <span className="d-detail-value">{appointment.date ? formatDate(appointment.date) : 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Time</span>
              <span className="d-detail-value">{appointment.timeSlot || 'N/A'}</span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Status</span>
              <span className="d-detail-value"><StatusBadge status={appointment.status} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Payment</span>
              <span className="d-detail-value"><StatusBadge status={appointment.paymentStatus} /></span>
            </div>
            <div className="d-detail-row">
              <span className="d-detail-label">Appointment</span>
              <span className="d-detail-value">
                <Link to={`/appointments/${appointment._id}`} className="d-btn d-btn-ghost d-btn-sm">View</Link>
              </span>
            </div>
          </div>
        </Section>
      </div>

      <div className="d-receipt-actions">
        <button className="d-btn d-btn-primary" onClick={() => window.print()}>🖨 Print Receipt</button>
      </div>

      <div className="admin-receipt" id="admin-receipt">
        <div className="admin-receipt-header">
          <div>
            <strong>DocBook</strong>
            <p>Doctor Appointment Booking System</p>
          </div>
          <div className="admin-receipt-title">
            <strong>Payment Receipt</strong>
            <p>{payment.receiptNumber}</p>
          </div>
        </div>
        <div className="admin-receipt-body">
          <div className="admin-receipt-row">
            <span>Patient</span>
            <span>{patient.name || 'Unknown'}</span>
          </div>
          <div className="admin-receipt-row">
            <span>Doctor</span>
            <span>Dr. {doctor.name || 'N/A'} ({doctor.specialization || ''})</span>
          </div>
          <div className="admin-receipt-row">
            <span>Appointment</span>
            <span>{appointment.date || 'N/A'} at {appointment.timeSlot || 'N/A'}</span>
          </div>
          <div className="admin-receipt-row">
            <span>Payment Method</span>
            <span>{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</span>
          </div>
          <div className="admin-receipt-row">
            <span>Status</span>
            <span className="d-money">{payment.status}</span>
          </div>
          <div className="admin-receipt-row">
            <span>Paid On</span>
            <span>{formatDateTime(payment.paidAt)}</span>
          </div>
          <div className="admin-receipt-row admin-receipt-total">
            <span>Total</span>
            <span className="d-money">{formatCurrency(payment.amount)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showRefund}
        title="Refund Payment"
        message="Are you sure you want to refund this payment? The money will be returned to the patient and the appointment will be cancelled if it is still pending/confirmed."
        confirmText="Refund"
        busy={refunding}
        onCancel={() => { if (!refunding) setShowRefund(false) }}
        onConfirm={handleRefund}
      />

      {showEditAmount && (
        <div className="d-modal-overlay" onClick={() => !savingAmount && setShowEditAmount(false)}>
          <div className="d-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="d-modal-header">Edit Payment Amount</div>
            <div className="d-modal-body">
              <div className="d-form-group">
                <label className="d-form-label">Receipt</label>
                <div className="d-detail-value">{payment.receiptNumber}</div>
              </div>
              <div className="d-form-group">
                <label className="d-form-label">Amount (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="d-input"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="Enter new amount"
                />
              </div>
              <div className="d-form-group">
                <label className="d-form-label">Reason (optional)</label>
                <textarea
                  className="d-input"
                  rows="2"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Why is the amount being changed?"
                />
              </div>
              {payment.provider === 'stripe' && (
                <div className="d-form-help">
                  This is a Stripe payment. Updating the amount corrects the recorded amount only; it does not re-charge or
                  refund money through Stripe. Use the Stripe receipt link to verify the actual charge.
                </div>
              )}
            </div>
            <div className="d-modal-actions">
              <button className="d-btn d-btn-outline" onClick={() => setShowEditAmount(false)} disabled={savingAmount}>
                Cancel
              </button>
              <button className="d-btn d-btn-primary" onClick={handleSaveAmount} disabled={savingAmount}>
                {savingAmount ? 'Saving...' : 'Save Amount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentDetails
