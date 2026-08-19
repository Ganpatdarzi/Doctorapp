import { useState } from 'react'
import axiosClient from '../axios/axiosClient'
import { PageHeader } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './DoctorCommon.css'

const DoctorChangePassword = () => {
  const { notify, toastEl } = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      await axiosClient.patch('/doctor/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      notify('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="d-change-password-page">
      {toastEl}

      <PageHeader title="Change Password" subtitle="Update your account password." />

      {error && <div className="d-error-banner">{error}</div>}

      <form className="d-form" onSubmit={handleSubmit}>
        <div className="d-form-section">
          <h3>Password</h3>
          <div className="d-form-grid">
            <div className="d-form-group full">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                className="d-input"
                value={form.currentPassword}
                onChange={handleChange}
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
                value={form.newPassword}
                onChange={handleChange}
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
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>
        </div>

        <div className="d-form-actions">
          <button type="submit" className="d-btn d-btn-primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorChangePassword
