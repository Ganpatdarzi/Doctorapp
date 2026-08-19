import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import getImageUrl from '../utils/imageUrl'
import './EditDoctor.css'

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

const EditDoctor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', gender: '', dob: '',
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
    const fetchDoctor = async () => {
      try {
        const { data } = await axiosClient.get(`/admin/doctors/${id}`)
        const doc = data.data || data
        setForm({
          name: doc.name || '',
          email: doc.email || '',
          password: '',
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
        setError('Failed to load doctor data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

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
        email: form.email,
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

      if (form.password) payload.password = form.password

      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== null) {
          if (Array.isArray(payload[key])) {
            payload[key].forEach((v) => formData.append(key, v))
          } else {
            formData.append(key, payload[key])
          }
        }
      })

      form.availableDays.forEach((d) => formData.append('availableDays', d))
      form.availableSlots.forEach((s) => formData.append('availableSlots', s))

      if (imageFile) formData.append('image', imageFile)

      await axiosClient.put(`/admin/doctors/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/doctors')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading-state">Loading doctor data...</div>

  return (
    <div className="edit-doctor-page">
      <div className="page-header">
        <h1>Edit Doctor</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="doctor-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password (leave blank to keep)</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current" />
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
              <label>Education</label>
              <input type="text" name="education" value={form.education} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hospital</label>
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
              <label>About</label>
              <textarea name="about" value={form.about} onChange={handleChange} rows="3" />
            </div>
            <div className="form-group full-width">
              <label>Languages (comma separated)</label>
              <input type="text" name="languages" value={form.languages} onChange={handleChange} placeholder="English, Spanish" />
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
            {submitting ? 'Updating...' : 'Update Doctor'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditDoctor
