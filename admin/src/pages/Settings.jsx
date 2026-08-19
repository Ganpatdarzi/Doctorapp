import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, ErrorBanner } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './DoctorCommon.css'

const Settings = () => {
  const navigate = useNavigate()
  const { notify, toastEl } = useToast()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/admin/profile')
        const prof = data.data || data
        setProfile(prof)
        setForm({ name: prof.name || '', email: prof.email || '', phone: prof.phone || '' })
      } catch (err) {
        setProfileError(err.response?.data?.message || 'Failed to load profile')
      }
    }
    fetchProfile()
  }, [])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await axiosClient.put('/admin/profile', form)
      setProfile(data.data || data)
      notify('Profile updated successfully')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePwChange = (e) => {
    const { name, value } = e.target
    setPwForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')

    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirmation do not match.')
      return
    }

    setSavingPw(true)
    try {
      await axiosClient.patch('/admin/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      notify('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('adminToken')
    notify('Signed out')
    window.setTimeout(() => navigate('/login'), 400)
  }

  return (
    <div className="d-settings-page">
      {toastEl}

      <PageHeader title="Settings" subtitle="Manage your admin account." />

      {profileError && <ErrorBanner message={profileError} />}

      <form className="d-form" onSubmit={handleSaveProfile}>
        <div className="d-form-section">
          <h3>Admin Profile</h3>
          <div className="d-form-grid">
            <div className="d-form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                className="d-input"
                value={form.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="d-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="d-input"
                value={form.email}
                onChange={handleProfileChange}
                disabled
              />
              <span className="d-user-sub">Email cannot be changed.</span>
            </div>
            <div className="d-form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                className="d-input"
                value={form.phone}
                onChange={handleProfileChange}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div className="d-form-actions">
          <button type="submit" className="d-btn d-btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <form className="d-form" onSubmit={handleChangePassword}>
        <div className="d-form-section">
          <h3>Change Password</h3>
          {pwError && <div className="d-error-banner" style={{ marginBottom: 14 }}>{pwError}</div>}
          <div className="d-form-grid">
            <div className="d-form-group full">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                className="d-input"
                value={pwForm.currentPassword}
                onChange={handlePwChange}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="d-form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                className="d-input"
                value={pwForm.newPassword}
                onChange={handlePwChange}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div className="d-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="d-input"
                value={pwForm.confirmPassword}
                onChange={handlePwChange}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>
        </div>

        <div className="d-form-actions">
          <button type="submit" className="d-btn d-btn-primary" disabled={savingPw}>
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      <div className="d-form-section">
        <h3>System Information</h3>
        <div className="d-detail-list">
          <div className="d-detail-row">
            <span className="d-detail-label">Application</span>
            <span className="d-detail-value">Doctor Appointment System — Admin</span>
          </div>
          <div className="d-detail-row">
            <span className="d-detail-label">Version</span>
            <span className="d-detail-value">1.0.0</span>
          </div>
          <div className="d-detail-row">
            <span className="d-detail-label">Environment</span>
            <span className="d-detail-value">{import.meta.env.MODE || 'development'}</span>
          </div>
          <div className="d-detail-row">
            <span className="d-detail-label">API Endpoint</span>
            <span className="d-detail-value">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</span>
          </div>
          <div className="d-detail-row">
            <span className="d-detail-label">Server Status</span>
            <span className="d-detail-value">
              <span className={`d-status-badge ${profile ? 'd-status-paid' : 'd-status-cancelled'}`}>
                {profile ? 'Connected' : 'Offline'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="d-form-section">
        <h3>Account</h3>
        <div className="d-detail-list">
          <div className="d-detail-row">
            <span className="d-detail-label">Signed in as</span>
            <span className="d-detail-value">{profile?.email || '—'}</span>
          </div>
          <div className="d-detail-row">
            <span className="d-detail-label">Role</span>
            <span className="d-detail-value">Administrator</span>
          </div>
        </div>
        <div className="d-form-actions" style={{ marginTop: 16, justifyContent: 'flex-start' }}>
          <button type="button" className="d-btn d-btn-danger" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
