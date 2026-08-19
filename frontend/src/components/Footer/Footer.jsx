import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-icon">+</span>
              <span className="footer-logo-text">DocBook</span>
            </Link>
            <p className="footer-desc">
              Your trusted platform for booking doctor appointments. Quality healthcare, just a click away.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/doctors">All Doctors</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/my-appointments">My Appointments</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Specializations</h4>
              <ul>
                <li><Link to="/doctors">General Physician</Link></li>
                <li><Link to="/doctors">Cardiologist</Link></li>
                <li><Link to="/doctors">Dermatologist</Link></li>
                <li><Link to="/doctors">Pediatrician</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <ul className="contact-list">
                <li>
                  <span className="contact-icon">📍</span>
                  123 Health Street, Medical City
                </li>
                <li>
                  <span className="contact-icon">📞</span>
                  +1 (555) 123-4567
                </li>
                <li>
                  <span className="contact-icon">✉️</span>
                  support@docbook.com
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 DocBook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
