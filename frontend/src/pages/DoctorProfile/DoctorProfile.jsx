import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDoctorById } from '../../api/doctors'
import getImageUrl from '../../utils/imageUrl'
import Error from '../../components/Error/Error'
import ReviewsSection from '../../components/ReviewsSection/ReviewsSection'
import { DAY_SHORT_MAP } from '../../constants'
import './DoctorProfile.css'

const DoctorProfile = () => {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getDoctorById(id)
        setDoctor(res)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="doctor-profile-page">
        <Error message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!doctor) {
    return <Error message="Doctor not found. Please go back and try again." />
  }

  const dayMap = DAY_SHORT_MAP

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="doctor-profile-page">
      {doctor.isAvailable === false && (
        <div className="unavailable-banner">
          <span className="unavailable-icon">⚠</span>
          <span>This doctor is currently unavailable for appointments.</span>
        </div>
      )}

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-image-section">
            {doctor.image ? (
              <img src={getImageUrl(doctor.image)} alt={doctor.name} className="profile-image" />
            ) : (
              <div className="profile-image-fallback">
                {getInitials(doctor.name)}
              </div>
            )}
          </div>
          <div className="profile-info-section">
            <div className="profile-name-row">
              <span className="profile-badge">{doctor.specialization}</span>
              {doctor.isAvailable === false && (
                <span className="profile-unavailable-badge">Unavailable</span>
              )}
              {doctor.isOnline && (
                <span className="profile-online-badge">Online</span>
              )}
            </div>
            <h1 className="profile-name">{doctor.name}</h1>
            {doctor.education && <p className="profile-education">{doctor.education}</p>}
            <div className="profile-meta">
              <div className="profile-rating">
                <span className="star">★</span>
                <span className="rating-value">{doctor.rating}</span>
                <span className="review-count">({doctor.reviews} reviews)</span>
              </div>
              <span className="meta-separator">•</span>
              <span className="profile-experience">{doctor.experience} years experience</span>
            </div>
            {doctor.location && (
              <div className="profile-location">
                <span>📍</span>
                <span>{doctor.location}</span>
              </div>
            )}
            {doctor.hospital && (
              <div className="profile-hospital">
                <span>🏥</span>
                <span>{doctor.hospital}</span>
              </div>
            )}
            {doctor.phone && (
              <div className="profile-phone">
                <span>📞</span>
                <span>{doctor.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-main">
            {doctor.about && (
              <div className="profile-section">
                <h2>About</h2>
                <p className="profile-about">{doctor.about}</p>
              </div>
            )}

            {doctor.address && (
              <div className="profile-section">
                <h2>Address</h2>
                <p className="profile-address">{doctor.address}</p>
              </div>
            )}

            {doctor.languages && doctor.languages.length > 0 && (
              <div className="profile-section">
                <h2>Languages</h2>
                <div className="languages-list">
                  {doctor.languages.map((lang) => (
                    <span key={lang} className="language-chip">{lang}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-section">
              <h2>Available Days</h2>
              <div className="available-days">
                {Object.entries(dayMap).map(([day, short]) => (
                  <span
                    key={day}
                    className={`day-chip ${doctor.availableDays?.includes(day) ? 'available' : 'unavailable'}`}
                  >
                    {short}
                  </span>
                ))}
              </div>
            </div>

            {doctor.availableSlots && doctor.availableSlots.length > 0 && (
              <div className="profile-section">
                <h2>Available Time Slots</h2>
                <div className="time-slots-grid">
                  {doctor.availableSlots.map((slot) => (
                    <span key={slot} className="time-slot-chip">{slot}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-section">
              <ReviewsSection doctorId={doctor._id} />
            </div>
          </div>

          <div className="profile-sidebar">
            <div className="booking-card">
              <div className="booking-fee">
                <span className="fee-label">Consultation Fee</span>
                <span className="fee-amount">Rs. {doctor.fees}</span>
              </div>
              {doctor.isAvailable === false ? (
                <button className="book-btn book-btn-disabled" disabled>
                  Currently Unavailable
                </button>
              ) : (
                <Link to={`/book-appointment/${doctor._id}`} className="book-btn">
                  Book Appointment
                </Link>
              )}
              <div className="booking-info">
                <div className="booking-info-item">
                  <span>📞</span>
                  <span>Free consultation call</span>
                </div>
                <div className="booking-info-item">
                  <span>🔒</span>
                  <span>Secure payment</span>
                </div>
                <div className="booking-info-item">
                  <span>📋</span>
                  <span>Instant confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile
