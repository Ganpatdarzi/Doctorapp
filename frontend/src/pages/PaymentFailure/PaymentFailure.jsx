import { useSearchParams, Link } from 'react-router-dom'
import '../PaymentSuccess/PaymentStatus.css'

const PaymentFailure = () => {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment') || ''

  return (
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className="status-icon failed">✕</div>
        <h2>Payment Not Completed</h2>
        <p className="status-message">
          Your payment was cancelled or could not be completed. Your appointment is still
          reserved, but it will not be confirmed until the consultation fee is paid.
        </p>

        <div className="status-details">
          <div className="status-detail">
            <span className="detail-label">What happens next?</span>
            <span className="detail-value">You can pay from My Appointments</span>
          </div>
          <div className="status-detail">
            <span className="detail-label">Other options</span>
            <span className="detail-value">Pay at the clinic on your visit</span>
          </div>
        </div>

        <div className="status-actions">
          <Link to="/my-appointments" className="status-btn-primary">Go to My Appointments</Link>
          <Link to="/doctors" className="status-btn-secondary">Browse Doctors</Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailure
