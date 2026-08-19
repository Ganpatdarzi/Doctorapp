import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import getImageUrl from '../utils/imageUrl'
import './DoctorProfile.css'

const DoctorProfile = () => {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/doctor/profile')
        setDoctor(data.data || data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        if (err.response?.status === 401) {
          localStorage.removeItem('doctorToken')
          navigate('/doctor-login')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('doctorToken')
    navigate('/doctor-login')
  }

  if (loading) return <div className="loading-state">Loading profile...</div>
  if (!doctor) return <div className="empty-state">Failed to load profile</div>

  return (
    <div className="doctor-profile-page">
      <div className="profile-page-toolbar">
        <Link to="/doctor/dashboard" className="profile-back-link">← Back to Dashboard</Link>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="profile-card">
        <div className="profile-header-section">
          <img
            src={getImageUrl(doctor.image) || 'https://via.placeholder.com/150?text=D'}
            alt={doctor.name}
            className="profile-avatar"
          />
          <div className="profile-header-info">
            <h1>{doctor.name}</h1>
            <p className="specialization">{doctor.specialization || 'N/A'}</p>
            <div className="profile-badges">
              <span className={`status-badge ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              {doctor.isOnline && <span className="online-badge">● Online</span>}
              <span className="rating-badge">⭐ {doctor.rating || '0.0'} ({doctor.reviews || 0})</span>
            </div>
          </div>
          <div className="profile-actions">
            <Link to="/doctor/profile/edit" className="btn-edit-profile">Edit Profile</Link>
            <Link to="/doctor/change-password" className="btn-logout">Change Password</Link>
          </div>
        </div>
      </div>

      <div className="profile-details-grid">
        <div className="profile-detail-card">
          <h3>Personal Information</h3>
          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{doctor.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{doctor.phone || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Gender</span>
              <span className="detail-value">{doctor.gender || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date of Birth</span>
              <span className="detail-value">{doctor.dob ? new Date(doctor.dob).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="profile-detail-card">
          <h3>Professional Information</h3>
          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">Education</span>
              <span className="detail-value">{doctor.education || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Experience</span>
              <span className="detail-value">{doctor.experience || 0} years</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fees</span>
              <span className="detail-value">Rs. {doctor.fees || 0}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Hospital</span>
              <span className="detail-value">{doctor.hospital || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location</span>
              <span className="detail-value">{doctor.location || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address</span>
              <span className="detail-value">{doctor.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="profile-detail-card full-width">
          <h3>About</h3>
          <p className="about-text">{doctor.about || 'No description provided.'}</p>
        </div>

        <div className="profile-detail-card">
          <h3>Languages</h3>
          <div className="tags-container">
            {Array.isArray(doctor.languages) && doctor.languages.length > 0
              ? doctor.languages.map((lang, i) => (
                  <span key={i} className="tag">{lang}</span>
                ))
              : <span className="detail-value">N/A</span>
            }
          </div>
        </div>

        <div className="profile-detail-card">
          <h3>Available Days</h3>
          <div className="tags-container">
            {Array.isArray(doctor.availableDays) && doctor.availableDays.length > 0
              ? doctor.availableDays.map((day, i) => (
                  <span key={i} className="tag">{day}</span>
                ))
              : <span className="detail-value">N/A</span>
            }
          </div>
        </div>

        <div className="profile-detail-card full-width">
          <h3>Available Slots</h3>
          <div className="tags-container">
            {Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0
              ? doctor.availableSlots.map((slot, i) => (
                  <span key={i} className="tag">{slot}</span>
                ))
              : <span className="detail-value">N/A</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile
