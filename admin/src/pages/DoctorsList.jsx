import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { Pagination, TableSkeleton, ConfirmDialog, ErrorBanner } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './DoctorsList.css'

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic Surgeon',
  'Gynecologist',
  'Neurologist',
  'Urologist',
  'ENT Specialist',
  'Psychiatrist',
  'Oncologist',
  'Ophthalmologist',
  'Pulmonologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Rheumatologist',
  'Nephrologist',
  'Anesthesiologist',
  'Radiologist',
  'General Surgeon',
]

const SORT_OPTIONS = [
  { value: '', label: 'Sort By' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'fees-asc', label: 'Fees (Low to High)' },
  { value: 'fees', label: 'Fees (High to Low)' },
  { value: 'experience-asc', label: 'Experience (Low to High)' },
  { value: 'experience', label: 'Experience (High to Low)' },
]

const DoctorsList = () => {
  const { notify, toastEl } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [doctors, setDoctors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const search = searchParams.get('search') || ''
  const specialization = searchParams.get('specialization') || ''
  const isAvailable = searchParams.get('isAvailable') || ''
  const sort = searchParams.get('sort') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const updateParams = (updates) => {
    const params = Object.fromEntries(searchParams)
    const merged = { ...params, ...updates }
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k]
    })
    setSearchParams(merged)
  }

  const fetchDoctors = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (search) params.search = search
      if (specialization) params.specialization = specialization
      if (isAvailable) params.isAvailable = isAvailable
      if (sort) params.sort = sort

      const { data } = await axiosClient.get('/admin/doctors', { params })
      const res = data.data || data
      setDoctors(res.doctors || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors')
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [searchParams])

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/doctors/${deleteId}`)
      notify('Doctor deleted successfully')
      setDeleteId(null)
      fetchDoctors()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete doctor', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { data } = await axiosClient.patch(`/admin/doctors/${id}/status`, {
        isAvailable: !currentStatus,
      })
      notify(`Doctor ${data.data?.isAvailable ? 'activated' : 'deactivated'} successfully`)
      fetchDoctors()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  return (
    <div className="doctors-list-page">
      {toastEl}

      <div className="page-header">
        <div>
          <h1>Doctors Management</h1>
          <p className="page-subtitle">{pagination.total} doctors found</p>
        </div>
        <Link to="/doctors/add" className="btn-primary">
          + Add Doctor
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search doctors by name or email..."
            defaultValue={search}
            className="search-input"
          />
          <button type="submit" className="btn-search">Search</button>
        </form>
        <div className="filter-group">
          <select
            value={specialization}
            onChange={(e) => updateParams({ specialization: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={isAvailable}
            onChange={(e) => updateParams({ isAvailable: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
            className="filter-select"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="doctors-table-container">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : doctors.length === 0 ? (
          <div className="empty-state">No doctors found</div>
        ) : (
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Fees</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div className="doctor-cell">
                      <img
                        src={getImageUrl(doc.image) || 'https://via.placeholder.com/40?text=D'}
                        alt={doc.name}
                        className="doctor-avatar"
                      />
                      <div>
                        <div className="doctor-name">{doc.name}</div>
                        <div className="doctor-email">{doc.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="specialization-tag">{doc.specialization || 'N/A'}</span></td>
                  <td className="fees-cell">Rs. {doc.fees || 0}</td>
                  <td>{doc.experience || 0} yrs</td>
                  <td>
                    <button
                      className={`status-badge ${doc.isAvailable ? 'available' : 'unavailable'}`}
                      onClick={() => handleToggleStatus(doc._id, doc.isAvailable)}
                    >
                      {doc.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/doctors/${doc._id}`} className="btn-action btn-view" title="View">
                        👁
                      </Link>
                      <Link to={`/doctors/edit/${doc._id}`} className="btn-action btn-edit" title="Edit">
                        ✏️
                      </Link>
                      <button
                        className="btn-action btn-delete"
                        title="Delete"
                        onClick={() => setDeleteId(doc._id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={(p) => updateParams({ page: p })} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setDeleteId(null) }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default DoctorsList
