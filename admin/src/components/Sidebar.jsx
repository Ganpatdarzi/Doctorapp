import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">+</span>
        <div className="sidebar-title-group">
          <span className="sidebar-title">Admin Panel</span>
          <span className="sidebar-subtitle">Doctor Appointment System</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main</span>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">📊</span>
          Dashboard
        </NavLink>
        <NavLink to="/appointments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">📅</span>
          Appointments
        </NavLink>
        <NavLink to="/patients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">👥</span>
          Patients
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">💳</span>
          Payments
        </NavLink>
        <NavLink to="/emr" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">📋</span>
          Medical Records
        </NavLink>
        <NavLink to="/payments/report" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">📄</span>
          Payment Reports
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">📈</span>
          Analytics
        </NavLink>

        <span className="sidebar-section-label">Doctors</span>
        <NavLink to="/doctors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">👨‍⚕️</span>
          All Doctors
        </NavLink>
        <NavLink to="/doctors/add" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">➕</span>
          Add Doctor
        </NavLink>

        <span className="sidebar-section-label">Account</span>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">⚙️</span>
          Settings
        </NavLink>
        <NavLink to="/doctor/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">🩺</span>
          Doctor Dashboard
        </NavLink>
        <NavLink to="/doctor-login" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">🔑</span>
          Doctor Login
        </NavLink>
        <NavLink to="/login" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="link-icon">🛡️</span>
          Admin Login
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <span>© 2026 MedCare</span>
      </div>
    </aside>
  )
}

export default Sidebar
