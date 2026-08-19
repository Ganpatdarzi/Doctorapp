import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import getImageUrl from '../utils/imageUrl'
import './DoctorEditProfile.css'

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
  'Orthopedic Surgeon', 'Gynecologist', 'Neurologist', 'Urologist',
  'ENT Specialist', 'Psychiatrist', 'Oncologist', 'Ophthalmologist',
  'Pulmonologist', 'Gastroenterologist', 'Endocrinologist', 'Rheumatologist',
  'Nephrologist', 'Anesthesiologist', 'Radiologist', 'General Surgeon',
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
]

const DoctorEditProfile = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', gender: '', dob: '',
    specialization: '', education: '', experience: '', fees: '',
    hospital: '', location: '', address: '', about: '',
    languages: '', availableDays: [], availableSlots: [],
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/doctor/profile')
        const doc = data.data || data
        setForm({
          name: doc.name || '',
          email: doc.email || '',
          phone: doc.phone || '',
          gender: doc.gender || '',
          dob: doc.dob ? doc.dob.split('T')[0] : '',
          specialization: doc.specialization || '',
          education: doc.education || '',
          experience: doc.experience?.toString() || '',
          fees: doc.fees?.toString() || '',
          hospital: doc.hospital || '',
          location: doc.location || '',
          address: doc.address || '',
          about: doc.about || '',
          languages: Array.isArray(doc.languages) ? doc.languages.join(', ') : (doc.languages || ''),
          availableDays: Array.isArray(doc.availableDays) ? doc.availableDays : [],
          availableSlots: Array.isArray(doc.availableSlots) ? doc.availableSlots : [],
        })
        if (doc.image) setImagePreview(getImageUrl(doc.image))
      } catch (err) {
        console.error('Failed to load profile:', err)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const handleSlotToggle = (slot) => {
    setForm((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.includes(slot)
        ? prev.availableSlots.filter((s) => s !== slot)
        : [...prev.availableSlots, slot],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      const payload = {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        specialization: form.specialization,
        education: form.education,
        experience: Number(form.experience) || 0,
        fees: Number(form.fees) || 0,
        hospital: form.hospital,
        location: form.location,
        address: form.address,
        about: form.about,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key])
        }
      })

      form.availableDays.forEach((d) => formData.append('availableDays', d))
      form.availableSlots.forEach((s) => formData.append('availableSlots', s))

      if (imageFile) formData.append('image', imageFile)

      await axiosClient.put('/doctor/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/doctor/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading-state">Loading profile...</div>

  return (
    <div className="doctor-edit-profile-page">
      <div className="page-header">
        <div>
          <Link to="/doctor/profile" className="profile-back-link">← Back to Profile</Link>
          <h1>Edit Profile</h1>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="doctor-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Profile Image</h3>
          <div className="image-upload-area">
            <label className="image-upload-label">
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">
                  <span>📷</span>
                  <p>Click to upload image</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} disabled className="disabled-field" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Professional Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Specialization *</label>
              <select name="specialization" value={form.specialization} onChange={handleChange} required>
                <option value="">Select Specialization</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Experience (years)</label>
              <input type="number" name="experience" value={form.experience} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Fees (Rs)</label>
              <input type="number" name="fees" value={form.fees} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Education / Qualification</label>
              <input type="text" name="education" value={form.education} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hospital / Clinic</label>
              <input type="text" name="hospital" value={form.hospital} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Biography</label>
              <textarea name="about" value={form.about} onChange={handleChange} rows="3" />
            </div>
            <div className="form-group full-width">
              <label>Languages (comma separated)</label>
              <input type="text" name="languages" value={form.languages} onChange={handleChange} placeholder="English, Spanish" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Availability</h3>
          <div className="form-group">
            <label>Available Days</label>
            <div className="checkbox-group">
              {DAYS.map((day) => (
                <label key={day} className={`checkbox-label ${form.availableDays.includes(day) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.availableDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Available Slots</label>
            <div className="checkbox-group">
              {TIME_SLOTS.map((slot) => (
                <label key={slot} className={`checkbox-label ${form.availableSlots.includes(slot) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.availableSlots.includes(slot)}
                    onChange={() => handleSlotToggle(slot)}
                  />
                  {slot}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/doctor/profile')}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorEditProfile
