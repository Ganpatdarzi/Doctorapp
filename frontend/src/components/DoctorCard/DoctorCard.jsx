import { Link } from 'react-router-dom'
import getImageUrl from '../../utils/imageUrl'
import './DoctorCard.css'

const DoctorCard = ({ doctor }) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const fee = doctor.consultationFee ?? doctor.fees

  const availabilityBadge = () => {
    if (doctor.isAvailable === false) {
      return { label: 'Unavailable', className: 'doctor-card-unavailable-badge' }
    }
    if (doctor.isOnline) {
      return { label: 'Online', className: 'doctor-card-online-badge' }
    }
    if ((doctor.availableDays || []).includes(todayName)) {
      return { label: 'Available Today', className: 'doctor-card-today-badge' }
    }
    return null
  }

  const badge = availabilityBadge()

  return (
    <Link to={`/doctor/${doctor._id}`} className="doctor-card">
      <div className="doctor-card-image">
        {doctor.image ? (
          <img src={getImageUrl(doctor.image)} alt={doctor.name} />
        ) : (
          <div className="doctor-card-initials">{getInitials(doctor.name)}</div>
        )}
        <span className="doctor-card-badge">{doctor.specialization}</span>
        {badge && (
          <span className={`doctor-card-status-badge ${badge.className}`}>
            {badge.label === 'Online' && <span className="status-dot"></span>}
            {badge.label}
          </span>
        )}
      </div>
      <div className="doctor-card-content">
        <h3 className="doctor-card-name">{doctor.name}</h3>
        <p className="doctor-card-speciality">{doctor.specialization}</p>
        <div className="doctor-card-info">
          <div className="doctor-card-rating">
            <span className="star">★</span>
            <span>{doctor.rating}</span>
            <span className="review-count">({doctor.reviews} reviews)</span>
          </div>
          <span className="doctor-card-experience">{doctor.experience} yrs exp</span>
        </div>
        <div className="doctor-card-footer">
          <div className="doctor-card-location">
            <span className="location-pin">📍</span>
            <span>{doctor.location?.split(',')[0] || doctor.location}</span>
          </div>
          <span className="doctor-card-fee">Rs. {fee}</span>
        </div>
        <span className="doctor-card-cta">Book Appointment →</span>
      </div>
    </Link>
  )
}

export default DoctorCard
