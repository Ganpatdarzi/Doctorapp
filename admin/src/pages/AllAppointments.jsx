import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { StatusBadge, Pagination, TableSkeleton, ConfirmDialog, ErrorBanner, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './AllAppointments.css'

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected']
const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'date', label: 'Date (Earliest)' },
  { value: 'date-desc', label: 'Date (Latest)' },
]

const AllAppointments = () => {
  const { notify, toastEl } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''
  const date = searchParams.get('date') || ''
  const doctorId = searchParams.get('doctorId') || ''
  const patientId = searchParams.get('patientId') || ''
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

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      if (search) params.search = search
      if (date) params.date = date
      if (doctorId) params.doctorId = doctorId
      if (patientId) params.patientId = patientId
      if (sort) params.sort = sort

      const { data } = await axiosClient.get('/admin/appointments', { params })
      const res = data.data || data
      setAppointments(res.appointments || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [searchParams])

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [docRes, patRes] = await Promise.all([
          axiosClient.get('/admin/doctors', { params: { limit: 1000 } }),
          axiosClient.get('/admin/patients', { params: { limit: 1000 } }),
        ])
        setDoctors((docRes.data.data || docRes.data).doctors || [])
        setPatients((patRes.data.data || patRes.data).patients || [])
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    loadFilters()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/appointments/${deleteId}`)
      notify('Appointment deleted successfully')
      setDeleteId(null)
      fetchAppointments()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete appointment', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="all-appointments">
      {toastEl}

      <div className="d-page-header">
        <div>
          <h1 className="d-page-title">Appointments</h1>
          <p className="d-page-subtitle">{pagination.total} appointment{pagination.total !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by patient, doctor, email, phone..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
        <div className="d-filter-group">
          <select
            value={doctorId}
            onChange={(e) => updateParams({ doctorId: e.target.value, page: 1 })}
            className="d-select"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <select
            value={patientId}
            onChange={(e) => updateParams({ patientId: e.target.value, page: 1 })}
            className="d-select"
          >
            <option value="">All Patients</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value, page: 1 })}
            className="d-input"
          />
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="d-select"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
            className="d-select"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="appointments-table-container">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : appointments.length === 0 ? (
          <div className="d-empty">No appointments found</div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fee</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const patient = appt.userId || {}
                const doctor = appt.doctorId || {}
                return (
                  <tr key={appt._id}>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'}
                          alt={patient.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{patient.name || 'Unknown'}</div>
                          <div className="d-user-sub">{patient.phone || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(doctor.image) || 'https://via.placeholder.com/40?text=D'}
                          alt={doctor.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{doctor.name || 'N/A'}</div>
                          <div className="d-user-sub">{doctor.specialization || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(appt.date)}</td>
                    <td>{appt.timeSlot || 'N/A'}</td>
                    <td className="d-money">{formatCurrency(appt.consultationFee)}</td>
                    <td><StatusBadge status={appt.paymentStatus} /></td>
                    <td><StatusBadge status={appt.status} /></td>
                    <td>
                      <div className="d-actions">
                        <Link to={`/appointments/${appt._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                        <button
                          className="d-btn d-btn-danger d-btn-sm"
                          title="Delete"
                          onClick={() => setDeleteId(appt._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={(p) => updateParams({ page: p })} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setDeleteId(null) }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default AllAppointments
