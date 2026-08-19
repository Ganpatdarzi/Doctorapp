import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { StatusBadge, Pagination, TableSkeleton, ErrorBanner, formatDate, formatCurrency } from '../components/DoctorUI'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const STATUS_OPTIONS = ['all', 'paid', 'pending', 'failed', 'refunded']
const METHOD_LABELS = { online: 'Online', clinic: 'Clinic' }

const PaymentsList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''
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

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      if (search) params.search = search

      const { data } = await axiosClient.get('/admin/payments', { params })
      const res = data.data || data
      setPayments(res.payments || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  return (
    <div className="all-payments">
      <div className="d-page-header">
        <div>
          <h1 className="d-page-title">Payments</h1>
          <p className="d-page-subtitle">{pagination.total} payment{pagination.total !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by receipt no, patient, doctor..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
        <div className="d-filter-group">
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="d-select"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="appointments-table-container">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : payments.length === 0 ? (
          <div className="d-empty">No payments found</div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Appointment</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const patient = payment.userId || {}
                const doctor = payment.doctorId || {}
                const appointment = payment.appointmentId || {}
                return (
                  <tr key={payment._id}>
                    <td className="d-money">{payment.receiptNumber}</td>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'}
                          alt={patient.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{patient.name || 'Unknown'}</div>
                          <div className="d-user-sub">{patient.email || ''}</div>
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
                    <td>
                      {appointment.date ? `${formatDate(appointment.date)}` : 'N/A'}
                      {appointment.timeSlot ? ` • ${appointment.timeSlot}` : ''}
                    </td>
                    <td className="d-money">{formatCurrency(payment.amount)}</td>
                    <td>{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</td>
                    <td><StatusBadge status={payment.status} /></td>
                    <td>
                      <div className="d-actions">
                        <Link to={`/payments/${payment._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
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
    </div>
  )
}

export default PaymentsList
