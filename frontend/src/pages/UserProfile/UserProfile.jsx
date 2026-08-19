import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { updateProfile, changePassword } from '../../api/auth'
import { getErrorMessage } from '../../utils/errorHandler'
import './UserProfile.css'

const UserProfile = () => {
  const { user, updateUser } = useAuth()
  const { notify, toastEl } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    address: user?.address || '',
  })

  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwdErrors, setPwdErrors] = useState({})
  const [pwdServerError, setPwdServerError] = useState('')
  const [pwdSubmitting, setPwdSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfile(formData)
      updateUser({
        name: res.name,
        phone: res.phone || '',
        dob: res.dob || '',
        gender: res.gender || '',
        address: res.address || '',
      })
      notify('Profile updated successfully')
      setIsEditing(false)
    } catch (err) {
      notify(getErrorMessage(err, 'Failed to update profile.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdData({ ...pwdData, [name]: value })
    if (pwdErrors[name]) setPwdErrors({ ...pwdErrors, [name]: '' })
    if (pwdServerError) setPwdServerError('')
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!pwdData.currentPassword) newErrors.currentPassword = 'Current password is required'
    if (!pwdData.newPassword) newErrors.newPassword = 'New password is required'
    else if (pwdData.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters'
    if (pwdData.newPassword !== pwdData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setPwdErrors(newErrors)
      return
    }

    setPwdSubmitting(true)
    setPwdServerError('')
    try {
      await changePassword({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      })
      notify('Password changed successfully')
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwdServerError(getErrorMessage(err, 'Failed to change password.'))
    } finally {
      setPwdSubmitting(false)
    }
  }

  return (
    <div className="profile-page">
      {toastEl}
      <div className="profile-page-container">
        <div className="profile-page-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-card-top">
            <div className="profile-avatar-section">
              <div className="profile-avatar">{user?.name?.[0] || 'U'}</div>
            </div>
            <div className="profile-name-section">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </div>
            <button
              className={`edit-btn ${isEditing ? 'editing' : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. +1 555 123 4567"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-form-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="profile-card password-card">
          <h2 className="password-card-title">Change Password</h2>
          {pwdServerError && <div className="auth-alert">{pwdServerError}</div>}
          <form className="profile-form" onSubmit={handlePwdSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={pwdData.currentPassword}
                onChange={handlePwdChange}
                placeholder="Enter current password"
              />
              {pwdErrors.currentPassword && <span className="error-text">{pwdErrors.currentPassword}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={pwdData.newPassword}
                  onChange={handlePwdChange}
                  placeholder="Min 6 characters"
                />
                {pwdErrors.newPassword && <span className="error-text">{pwdErrors.newPassword}</span>}
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={pwdData.confirmPassword}
                  onChange={handlePwdChange}
                  placeholder="Re-enter new password"
                />
                {pwdErrors.confirmPassword && (
                  <span className="error-text">{pwdErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={pwdSubmitting}>
                {pwdSubmitting ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
