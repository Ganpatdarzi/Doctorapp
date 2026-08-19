import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import './AddDoctor.css'

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

const initialForm = {
  name: '', email: '', password: '', phone: '', gender: '', dob: '',
  specialization: '', education: '', experience: '', fees: '',
  hospital: '', location: '', address: '', about: '',
  languages: '', availableDays: [], availableSlots: [],
  isAvailable: true,
}

const AddDoctor = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
        ...form,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        experience: Number(form.experience) || 0,
        fees: Number(form.fees) || 0,
      }
      delete payload.availableDays
      delete payload.availableSlots

      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key])
        }
      })

      form.availableDays.forEach((d) => formData.append('availableDays', d))
      form.availableSlots.forEach((s) => formData.append('availableSlots', s))

      if (imageFile) formData.append('image', imageFile)

      await axiosClient.post('/admin/doctors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/doctors')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add doctor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="add-doctor-page">
      <div className="page-header">
        <h1>Add New Doctor</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="doctor-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Dr. John Smith" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="doctor@example.com" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
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
              <input type="number" name="experience" value={form.experience} onChange={handleChange} min="0" placeholder="5" />
            </div>
            <div className="form-group">
              <label>Fees (Rs)</label>
              <input type="number" name="fees" value={form.fees} onChange={handleChange} min="0" placeholder="1500" />
            </div>
            <div className="form-group">
              <label>Education</label>
              <input type="text" name="education" value={form.education} onChange={handleChange} placeholder="MBBS, MD" />
            </div>
            <div className="form-group">
              <label>Hospital</label>
              <input type="text" name="hospital" value={form.hospital} onChange={handleChange} placeholder="City Hospital" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="New York, NY" />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="123 Medical Center Drive" />
            </div>
            <div className="form-group full-width">
              <label>About</label>
              <textarea name="about" value={form.about} onChange={handleChange} rows="3" placeholder="Brief description about the doctor..." />
            </div>
            <div className="form-group full-width">
              <label>Languages (comma separated)</label>
              <input type="text" name="languages" value={form.languages} onChange={handleChange} placeholder="English, Spanish, French" />
            </div>
          </div>
        </div>

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
          <button type="button" className="btn-cancel" onClick={() => navigate('/doctors')}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Doctor'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddDoctor
