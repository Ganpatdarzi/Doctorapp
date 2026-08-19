import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getDoctorReviews, getMyReviewForDoctor, submitReview, deleteReview } from '../../api/reviews'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import './ReviewsSection.css'

const StarRating = ({ value, onChange, size = 'medium' }) => {
  return (
    <div className={`star-input ${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? 'filled' : ''}`}
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const ReviewsSection = ({ doctorId }) => {
  const { isAuthenticated, user } = useAuth()
  const { notify, toastEl } = useToast()

  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [myStatus, setMyStatus] = useState({ review: null, canReview: false })
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getDoctorReviews(doctorId)
      setReviews(res.reviews || [])
      setSummary(res.summary || { average: 0, count: 0 })
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Failed to load reviews.'))
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  const fetchMyStatus = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await getMyReviewForDoctor(doctorId)
      setMyStatus({ review: res.review || null, canReview: !!res.canReview })
    } catch {
      // ignore - form stays hidden
    }
  }, [doctorId, isAuthenticated])

  useEffect(() => {
    fetchReviews()
    fetchMyStatus()
  }, [fetchReviews, fetchMyStatus])

  const startEdit = () => {
    setEditing(true)
    setRating(myStatus.review?.rating || 0)
    setComment(myStatus.review?.comment || '')
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!rating) {
      setFormError('Please select a rating.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await submitReview({
        doctorId,
        rating,
        comment,
        appointmentId: myStatus.review?.appointmentId || undefined,
      })
      notify('Review submitted successfully')
      setEditing(false)
      setMyStatus((prev) => ({ ...prev, review: { ...prev.review, rating, comment } }))
      fetchReviews()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not submit your review.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      await deleteReview(myStatus.review._id)
      notify('Review deleted')
      setMyStatus({ review: null, canReview: true })
      fetchReviews()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete your review.'), 'error')
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="reviews-section">
      {toastEl}
      <h2>Patient Reviews</h2>

      <div className="reviews-summary">
        <div className="reviews-summary-score">
          <span className="summary-average">{summary.average}</span>
          <StarRating value={Math.round(summary.average)} />
          <span className="summary-count">{summary.count} review{summary.count === 1 ? '' : 's'}</span>
        </div>
      </div>

      {!isAuthenticated && (
        <p className="reviews-login-hint">
          <Link to="/login">Log in</Link> to share your experience with this doctor.
        </p>
      )}

      {isAuthenticated && !myStatus.review && myStatus.canReview && !editing && (
        <div className="review-form">
          <h3>Share your experience</h3>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="review-comment-input"
            placeholder="Tell others about your visit..."
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength="1000"
          />
          {formError && <div className="review-form-error">{formError}</div>}
          <button className="review-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {isAuthenticated && !myStatus.review && !myStatus.canReview && !editing && (
        <p className="reviews-eligibility-hint">
          You can review this doctor after completing an appointment with them.
        </p>
      )}

      {isAuthenticated && myStatus.review && !editing && (
        <div className="review-form my-review">
          <div className="my-review-head">
            <StarRating value={myStatus.review.rating} />
            <span className="my-review-label">Your review</span>
          </div>
          {myStatus.review.comment && <p className="my-review-comment">{myStatus.review.comment}</p>}
          <div className="my-review-actions">
            <button className="review-edit-btn" onClick={startEdit}>Edit</button>
            <button className="review-delete-btn" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      )}

      {isAuthenticated && editing && (
        <div className="review-form">
          <h3>{myStatus.review ? 'Edit your review' : 'Share your experience'}</h3>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="review-comment-input"
            placeholder="Tell others about your visit..."
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength="1000"
          />
          {formError && <div className="review-form-error">{formError}</div>}
          <div className="review-form-actions">
            <button className="review-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Review'}
            </button>
            <button className="review-cancel-btn" onClick={() => setEditing(false)} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {loading ? (
          <div className="reviews-loading">
            <div className="loading-spinner"></div>
            <p>Loading reviews...</p>
          </div>
        ) : loadError ? (
          <p className="reviews-error">{loadError}</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">No reviews yet. Be the first to share your experience!</p>
        ) : (
          reviews.map((review) => {
            const reviewer = review.userId || {}
            const isOwn = isAuthenticated && user && reviewer._id === user._id
            return (
              <div className={`review-card ${isOwn ? 'own' : ''}`} key={review._id}>
                <img
                  src={getImageUrl(reviewer.image) || `https://via.placeholder.com/40?text=${(reviewer.name || 'U')[0]}`}
                  alt={reviewer.name || 'User'}
                  className="review-avatar"
                />
                <div className="review-content">
                  <div className="review-head">
                    <span className="review-author">{reviewer.name || 'Anonymous'}</span>
                    <StarRating value={review.rating} size="small" />
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ReviewsSection
