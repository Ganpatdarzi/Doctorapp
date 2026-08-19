import { Link } from 'react-router-dom'
import './About.css'

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-container">
          <h1>About <span className="highlight">DocBook</span></h1>
          <p>Making quality healthcare accessible to everyone, everywhere.</p>
        </div>
      </section>

      <section className="about-story">
        <div className="about-container">
          <div className="about-story-grid">
            <div className="about-story-content">
              <h2>Our Story</h2>
              <p>
                DocBook was founded with a simple vision: to bridge the gap between patients
                and healthcare providers through technology. We understand that finding the right
                doctor and booking an appointment can be a stressful experience.
              </p>
              <p>
                Our platform simplifies this process by connecting you with verified, experienced
                doctors across various specializations. With just a few clicks, you can browse
                doctors, check their availability, and book an appointment that fits your schedule.
              </p>
              <p>
                Today, we serve over 10,000 patients and work with 500+ verified doctors,
                making healthcare more accessible and convenient than ever before.
              </p>
            </div>
            <div className="about-story-image">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=400&fit=crop"
                alt="Medical team"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="about-mission">
        <div className="about-container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To simplify healthcare access by providing a seamless platform that
                connects patients with the right doctors at the right time.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🔭</div>
              <h3>Our Vision</h3>
              <p>
                To become the most trusted healthcare booking platform worldwide,
                making quality healthcare accessible to every individual.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">💎</div>
              <h3>Our Values</h3>
              <p>
                Patient-first approach, transparency, quality care, and continuous
                innovation to improve healthcare experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="about-container">
          <div className="stats-row">
            <div className="about-stat-item">
              <span className="about-stat-num">500+</span>
              <span className="about-stat-label">Verified Doctors</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-num">10,000+</span>
              <span className="about-stat-label">Happy Patients</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-num">50+</span>
              <span className="about-stat-label">Specializations</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-num">98%</span>
              <span className="about-stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="about-container">
          <div className="section-header">
            <h2>Why Choose DocBook?</h2>
            <p>We make healthcare simple, accessible, and reliable</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <span className="why-icon">✓</span>
              <h4>Verified Doctors</h4>
              <p>All doctors on our platform are thoroughly verified and credential-checked.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">⚡</span>
              <h4>Instant Booking</h4>
              <p>Book appointments in seconds with our streamlined booking process.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">🔒</span>
              <h4>Secure & Private</h4>
              <p>Your personal and medical data is protected with industry-standard encryption.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">💰</span>
              <h4>Affordable Fees</h4>
              <p>Transparent pricing with no hidden charges. Know the fee before you book.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container">
          <div className="about-cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of patients who trust DocBook for their healthcare needs.</p>
            <Link to="/doctors" className="about-cta-btn">Find a Doctor</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
