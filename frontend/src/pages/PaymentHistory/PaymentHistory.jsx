import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMyPayments } from '../../api/payments'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import Error from '../../components/Error/Error'
import EmptyState from '../../components/EmptyState/EmptyState'
import './PaymentHistory.css'

const STATUS_LABELS = {
  paid: { label: 'Paid', cls: 'paid' },
  pending: { label: 'Pending', cls: 'pending' },
  failed: { label: 'Failed', cls: 'failed' },
  refunded: { label: 'Refunded', cls: 'refunded' },
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: 10 }
      if (status !== 'all') params.status = status
      const res = await getMyPayments(params)
      setPayments(res.payments || res || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load payment history.'))
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return (
    <div className="payment-history-page">
      <div className="payment-history-container">
        <div className="payment-history-header">
          <h1>Payment History</h1>
          <Link to="/my-appointments" className="book-new-btn">My Appointments</Link>
        </div>

        <div className="payment-filter-bar">
          {['all', 'paid', 'pending', 'refunded', 'failed'].map((s) => (
            <button
              key={s}
              className={`payment-filter-btn ${status === s ? 'active' : ''}`}
              onClick={() => {
                setStatus(s)
                setPage(1)
              }}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="payments-loading">
            <div className="loading-spinner"></div>
            <p>Loading payments...</p>
          </div>
        ) : error ? (
          <Error message={error} onRetry={fetchPayments} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No payments found"
            description="Your online payments and receipts will appear here."
          />
        ) : (
          <div className="payments-list">
            {payments.map((payment) => {
              const doctor = payment.doctorId || {}
              const appointment = payment.appointmentId || {}
              const statusInfo = STATUS_LABELS[payment.status] || STATUS_LABELS.pending
              return (
                <div key={payment._id} className="payment-card">
                  <div className="payment-card-left">
                    <img
                      src={getImageUrl(doctor.image) || 'https://via.placeholder.com/48?text=D'}
                      alt={doctor.name || 'Doctor'}
                      className="payment-doctor-img"
                    />
                    <div className="payment-doctor-info">
                      <h4 className="payment-doctor-name">{doctor.name || 'Unknown Doctor'}</h4>
                      <p className="payment-doctor-spec">{doctor.specialization || ''}</p>
                    </div>
                  </div>
                  <div className="payment-card-center">
                    <div className="payment-detail">
                      <span className="detail-label">Receipt</span>
                      <span className="detail-value">{payment.receiptNumber}</span>
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Appointment</span>
                      <span className="detail-value">
                        {appointment.date || 'N/A'} {appointment.timeSlot ? `• ${appointment.timeSlot}` : ''}
                      </span>
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value amount">Rs. {payment.amount}</span>
                    </div>
                  </div>
                  <div className="payment-card-right">
                    <span className={`payment-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    <Link to={`/receipt/${payment._id}`} className="receipt-link">View Receipt</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="page-btn"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentHistory
