import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import getImageUrl from '../utils/imageUrl'
import './DoctorLayout.css'

const DoctorLayout = () => {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/doctor/profile')
        setDoctor(data.data || data)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('doctorToken')
          navigate('/doctor-login')
        }
      }
    }
    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('doctorToken')
    navigate('/doctor-login')
  }

  return (
    <div className="doctor-app">
      <div className={`doctor-sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`doctor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="doctor-sidebar-header">
          <span className="doctor-sidebar-logo">🩺</span>
          <div className="doctor-sidebar-title-group">
            <span className="doctor-sidebar-title">DocBook</span>
            <span className="doctor-sidebar-subtitle">Doctor Dashboard</span>
          </div>
        </div>

        <nav className="doctor-sidebar-nav">
          <span className="doctor-sidebar-label">Overview</span>
          <NavLink to="/doctor/dashboard" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/doctor/appointments" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">📅</span>
            Appointments
          </NavLink>
          <NavLink to="/doctor/emr" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">📋</span>
            Medical Records
          </NavLink>
          <NavLink to="/doctor/payments" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">💰</span>
            Payments
          </NavLink>

          <span className="doctor-sidebar-label">Schedule</span>
          <NavLink to="/doctor/availability" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">🕒</span>
            Availability
          </NavLink>
          <NavLink to="/doctor/schedule" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">🗓️</span>
            Schedule
          </NavLink>

          <span className="doctor-sidebar-label">Account</span>
          <NavLink to="/doctor/profile" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">👤</span>
            My Profile
          </NavLink>
          <NavLink to="/doctor/change-password" className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}>
            <span className="doctor-nav-icon">🔒</span>
            Change Password
          </NavLink>
        </nav>

        <div className="doctor-sidebar-footer">
          <NavLink to="/login" className="doctor-admin-link">← Admin Panel</NavLink>
          <span className="doctor-sidebar-copyright">© 2026 DocBook</span>
        </div>
      </aside>

      <div className="doctor-main">
        <header className="doctor-topbar">
          <button className="doctor-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="doctor-topbar-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="doctor-topbar-user">
            {doctor && (
              <>
                <img
                  src={getImageUrl(doctor.image) || 'https://via.placeholder.com/40?text=D'}
                  alt={doctor.name}
                  className="doctor-topbar-avatar"
                />
                <div className="doctor-topbar-user-info">
                  <span className="doctor-topbar-name">{doctor.name}</span>
                  <span className="doctor-topbar-role">{doctor.specialization || 'Doctor'}</span>
                </div>
              </>
            )}
            <button className="doctor-topbar-logout" onClick={handleLogout} title="Logout">⎋</button>
          </div>
        </header>

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DoctorLayout
