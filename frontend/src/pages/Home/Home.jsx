import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDoctors, getSpecializations, getStats } from '../../api/doctors'
import DoctorCard from '../../components/DoctorCard/DoctorCard'
import Loading from '../../components/Loading/Loading'
import Error from '../../components/Error/Error'
import { SPECIALIZATION_ICONS } from '../../constants'
import './Home.css'

const Home = () => {
  const [featuredDoctors, setFeaturedDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadHome = async () => {
      setLoading(true)
      setError('')
      try {
        const [doctorsRes, specsRes, statsRes] = await Promise.all([
          getDoctors({ limit: 6, sort: 'rating' }),
          getSpecializations(),
          getStats(),
        ])
        setFeaturedDoctors(doctorsRes.doctors || [])
        setSpecializations(specsRes || [])
        setStats(statsRes || null)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadHome()
  }, [])

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-tag">Trusted by {stats?.totalPatients ? `${stats.totalPatients.toLocaleString()}+` : 'thousands of'} patients</div>
            <h1 className="hero-title">
              Book Appointment With <span className="highlight">Trusted Doctors</span>
            </h1>
            <p className="hero-subtitle">
              Browse through our extensive list of trusted doctors. Schedule your
              appointment hassle-free and receive the best healthcare from top professionals.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="hero-btn-primary">
                Browse Doctors
              </Link>
              <Link to="/about" className="hero-btn-secondary">
                Learn More →
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">{stats ? `${stats.totalDoctors}+` : '...'}</span>
                <span className="stat-label">Doctors</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">{stats ? `${stats.totalPatients}+` : '...'}</span>
                <span className="stat-label">Patients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">{stats ? `${stats.totalSpecializations}+` : '...'}</span>
                <span className="stat-label">Specialities</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=600&fit=crop&crop=face"
                alt="Doctor"
                className="hero-image"
              />
              <div className="hero-float-card card-1">
                <span className="float-icon">✓</span>
                <span>Verified Doctors</span>
              </div>
              <div className="hero-float-card card-2">
                <span className="float-icon">⏰</span>
                <span>24/7 Support</span>
              </div>
              <div className="hero-float-card card-3">
                <span className="float-icon">⭐</span>
                <span>4.9 Rating</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-trust">
          <div className="hero-trust-item">
            <span className="trust-icon">🔒</span>
            <span>Secure online payments</span>
          </div>
          <div className="hero-trust-item">
            <span className="trust-icon">✅</span>
            <span>Verified doctors only</span>
          </div>
          <div className="hero-trust-item">
            <span className="trust-icon">🔄</span>
            <span>Free rescheduling &amp; cancellation</span>
          </div>
          <div className="hero-trust-item">
            <span className="trust-icon">⏰</span>
            <span>Instant confirmations</span>
          </div>
        </div>
      </section>

      <section className="specializations-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Find by Specialization</h2>
            <p>Browse doctors by their area of expertise</p>
          </div>
          <div className="specializations-grid">
            {specializations.length > 0 ? (
              specializations.slice(0, 8).map((spec) => (
                <Link
                  to={`/doctors?specialization=${encodeURIComponent(spec)}`}
                  key={spec}
                  className="specialization-card"
                >
                  <span className="spec-icon">{SPECIALIZATION_ICONS[spec] || '🏥'}</span>
                  <span className="spec-name">{spec}</span>
                </Link>
              ))
            ) : (
              <p className="section-muted">Specializations will appear here.</p>
            )}
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Featured Doctors</h2>
            <p>Meet our top-rated healthcare professionals</p>
          </div>
          {loading ? (
            <Loading message="Loading featured doctors..." />
          ) : error ? (
            <Error message={error} />
          ) : featuredDoctors.length > 0 ? (
            <>
              <div className="doctors-grid">
                {featuredDoctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>
              <div className="section-action">
                <Link to="/doctors" className="view-all-btn">
                  View All Doctors →
                </Link>
              </div>
            </>
          ) : (
            <p className="section-muted">No featured doctors available right now.</p>
          )}
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Book your appointment in 3 simple steps</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3>Find a Doctor</h3>
              <p>Search our directory of verified doctors by name, specialty, or location.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📅</div>
              <h3>Book Appointment</h3>
              <p>Select a convenient date and time slot that fits your schedule.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🏥</div>
              <h3>Visit Doctor</h3>
              <p>Visit the doctor at the scheduled time for your consultation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to Book Your Appointment?</h2>
            <p>Join thousands of patients who trust DocBook for their healthcare needs.</p>
            <Link to="/register" className="cta-btn">Get Started Free</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
