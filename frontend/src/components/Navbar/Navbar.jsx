import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import getImageUrl from '../../utils/imageUrl'
import './Navbar.css'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const closeMenu = () => setMobileMenuOpen(false)

  const isActive = (path) => location.pathname === path

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    closeMenu()
    navigate('/')
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    closeMenu()
    setUserMenuOpen(false)
  }, [location.pathname])

  const mainLinks = [
    { to: '/', label: 'Home' },
    { to: '/doctors', label: 'All Doctors' },
    { to: '/about', label: 'About' },
    { to: '/assistant', label: 'AI Assistant' },
  ]

  const userLinks = [
    { to: '/my-appointments', label: 'My Appointments' },
    { to: '/payment-history', label: 'Payments' },
    { to: '/medical-records', label: 'Medical Records' },
  ]

  const profileLink = { to: '/profile', label: 'Profile' }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu} aria-label="DocBook home">
          <span className="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="logo-text">DocBook</span>
        </Link>

        <button
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {mainLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isAuthenticated && (
            <li className="nav-link-desktop-only">
              <Link
                to="/my-appointments"
                className={`nav-link ${isActive('/my-appointments') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                My Appointments
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <>
              <li className="nav-mobile-divider" />
              {userLinks.map((link) => (
                <li key={link.to} className="nav-link-mobile-only">
                  <Link
                    to={link.to}
                    className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="nav-link-mobile-only">
                <Link
                  to={profileLink.to}
                  className={`nav-link ${isActive(profileLink.to) ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  {profileLink.label}
                </Link>
              </li>
              <li className="nav-link-mobile-only">
                <button className="nav-link nav-logout-mobile" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user" ref={userMenuRef}>
              <button
                className={`nav-user-btn ${userMenuOpen ? 'open' : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label={`Account menu for ${user?.name || 'user'}`}
                aria-expanded={userMenuOpen}
              >
                <span className="nav-avatar">
                  {user?.image ? (
                    <img src={getImageUrl(user.image)} alt={user.name} />
                  ) : (
                    <span className="nav-avatar-initials">{getInitials(user?.name)}</span>
                  )}
                </span>
                <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
                <svg
                  className="nav-caret"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div className={`nav-dropdown ${userMenuOpen ? 'open' : ''}`}>
                <div className="nav-dropdown-header">
                  <span className="nav-dropdown-avatar">
                    {user?.image ? (
                      <img src={getImageUrl(user.image)} alt={user.name} />
                    ) : (
                      <span className="nav-avatar-initials">{getInitials(user?.name)}</span>
                    )}
                  </span>
                  <div className="nav-dropdown-id">
                    <span className="nav-dropdown-name">{user?.name}</span>
                    <span className="nav-dropdown-email">{user?.email}</span>
                  </div>
                </div>
                <div className="nav-dropdown-body">
                  <Link to="/my-appointments" className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    My Appointments
                  </Link>
                  <Link to="/payment-history" className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    Payments
                  </Link>
                  <Link to="/medical-records" className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    Medical Records
                  </Link>
                  <Link to="/profile" className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    Profile
                  </Link>
                </div>
                <div className="nav-dropdown-footer">
                  <button className="nav-dropdown-logout" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-guest">
              <Link to="/login" className="nav-login-link" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="nav-btn" onClick={closeMenu}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
