import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, formatDate, formatTime } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Sort By' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'time', label: 'Time (Earliest)' },
  { value: 'time-desc', label: 'Time (Latest)' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Consultations' },
  { value: 'clinic', label: 'In Clinic' },
  { value: 'video', label: 'Video Call' },
]

const DoctorAppointments = () => {
  const { notify, toastEl } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const date = searchParams.get('date') || ''
  const sort = searchParams.get('sort') || ''
  const type = searchParams.get('type') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = 10

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
    try {
      const params = { page, limit }
      if (search) params.search = search
      if (status) params.status = status
      if (date) params.date = date
      if (sort) params.sort = sort
      if (type) params.meetingType = type

      const { data } = await axiosClient.get('/doctor/appointments', { params })
      const res = data.data || data
      setAppointments(res.appointments || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load appointments', 'error')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  const handleAction = async (id, action) => {
    try {
      await axiosClient.patch(`/doctor/appointments/${id}`, { action })
      notify(`Appointment ${action === 'accept' ? 'accepted' : action} successfully`)
      fetchAppointments()
    } catch (err) {
      notify(err.response?.data?.message || `Failed to ${action} appointment`, 'error')
    }
  }

  const handleCancel = async (id) => {
    const reason = window.prompt('Please provide a cancellation reason (optional):') ?? null
    if (reason === null) return
    try {
      await axiosClient.patch(`/doctor/appointments/${id}`, { action: 'cancel', doctorNotes: reason })
      notify('Appointment cancelled')
      fetchAppointments()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to cancel appointment', 'error')
    }
  }

  const handleClinicPayment = async (id, action) => {
    try {
      await axiosClient.patch(`/doctor/appointments/${id}/clinic-payment`, { action })
      notify(action === 'paid' ? 'Payment marked as received' : 'Payment marked as unpaid')
      fetchAppointments()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update payment', 'error')
    }
  }

  return (
    <div className="d-appointments-page">
      {toastEl}

      <PageHeader
        title="Appointments"
        subtitle={`${pagination.total} appointment${pagination.total === 1 ? '' : 's'} found`}
      />

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by patient name, email or phone..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
        <div className="d-filter-group">
          <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: 1 })} className="d-select">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => updateParams({ type: e.target.value, page: 1 })} className="d-select">
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value, page: 1 })}
            className="d-input"
            style={{ width: 'auto' }}
          />
          <select value={sort} onChange={(e) => updateParams({ sort: e.target.value, page: 1 })} className="d-select">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Section>
        {loading ? (
          <LoadingState text="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState text="No appointments found. Try adjusting your filters." />
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Payment</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const patient = appt.userId || {}
                  return (
                    <tr key={appt._id}>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'} alt={patient.name} className="d-avatar" />
                          <span className="d-user-name">{patient.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{formatDate(appt.date)}</td>
                      <td className="d-money">{formatTime(appt.timeSlot)}</td>
                      <td>
                        <StatusBadge status={appt.status} />
                        <div className="d-user-sub" style={{ marginTop: 4 }}>
                          {appt.meetingType === 'video' ? '📹 Video Call' : '🏥 In Clinic'}
                        </div>
                      </td>
                      <td className="d-money">Rs. {appt.consultationFee || 0}</td>
                      <td><StatusBadge status={appt.paymentStatus || 'unpaid'} /></td>
                      <td>
                        <div className="d-user-sub">{patient.phone || 'N/A'}</div>
                        <div className="d-user-sub">{patient.email || ''}</div>
                      </td>
                      <td>
                        <div className="d-actions">
                          <Link to={`/doctor/appointments/${appt._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                          {appt.meetingType === 'video' && appt.status === 'confirmed' && (
                            <Link to={`/doctor/consultation/${appt._id}`} className="d-btn d-btn-success d-btn-sm">📹 Join Video Call</Link>
                          )}
                          {appt.status === 'pending' && (
                            <button className="d-btn d-btn-success d-btn-sm" onClick={() => handleAction(appt._id, 'accept')}>Accept</button>
                          )}
                          {appt.status === 'pending' && (
                            <button className="d-btn d-btn-danger d-btn-sm" onClick={() => handleAction(appt._id, 'reject')}>Reject</button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button className="d-btn d-btn-success d-btn-sm" onClick={() => handleAction(appt._id, 'complete')}>Complete</button>
                          )}
                          {(appt.status === 'pending' || appt.status === 'confirmed') && (
                            <button className="d-btn d-btn-danger d-btn-sm" onClick={() => handleCancel(appt._id)}>Cancel</button>
                          )}
                          {appt.paymentMethod === 'clinic' && appt.paymentStatus === 'pending' && (
                            <button className="d-btn d-btn-success d-btn-sm" onClick={() => handleClinicPayment(appt._id, 'paid')}>Mark Paid</button>
                          )}
                          {appt.paymentMethod === 'clinic' && appt.paymentStatus === 'paid' && (
                            <button className="d-btn d-btn-outline d-btn-sm" onClick={() => handleClinicPayment(appt._id, 'pending')}>Mark Unpaid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {pagination.pages > 1 && (
        <div className="d-pagination">
          <button className="d-page-btn" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })}>
            Previous
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`d-page-btn ${p === page ? 'active' : ''}`} onClick={() => updateParams({ page: p })}>
              {p}
            </button>
          ))}
          <button className="d-page-btn" disabled={page >= pagination.pages} onClick={() => updateParams({ page: page + 1 })}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments
