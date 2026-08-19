import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, Section, StatusBadge, LoadingState, EmptyState, StatCard, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const STATUS_OPTIONS = ['all', 'paid', 'pending', 'failed', 'refunded']
const METHOD_LABELS = { online: 'Online', clinic: 'Clinic' }

const DoctorPayments = () => {
  const { notify, toastEl } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [exporting, setExporting] = useState(false)

  const status = searchParams.get('status') || 'all'
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

  const fetchSummary = async () => {
    try {
      const { data } = await axiosClient.get('/doctor/payments/report')
      const res = data.data || data
      setSummary(res.summary || null)
    } catch {
      setSummary(null)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status

      const { data } = await axiosClient.get('/doctor/payments', { params })
      const res = data.data || data
      setPayments(res.payments || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
    fetchSummary()
  }, [searchParams])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { format: 'csv' }
      if (status !== 'all') params.status = status
      const response = await axiosClient.get('/doctor/payments/report', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `my-payments-${status}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify('Report exported successfully')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to export report', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="d-appointments-page">
      {toastEl}

      <PageHeader
        title="Payments"
        subtitle={`${pagination.total} payment${pagination.total === 1 ? '' : 's'} found`}
      >
        <button className="d-btn d-btn-primary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'Exporting...' : '⬇ Export CSV'}
        </button>
      </PageHeader>

      {summary && (
        <div className="d-stat-grid">
          <StatCard icon="💰" label="Total Earned" value={formatCurrency(summary.totalAmount)} color="green" />
          <StatCard icon="💳" label="Online" value={formatCurrency(summary.onlineAmount)} color="blue" />
          <StatCard icon="🏥" label="Clinic" value={formatCurrency(summary.clinicAmount)} color="purple" />
          <StatCard icon="✅" label="Paid" value={summary.paidCount} color="teal" />
        </div>
      )}
      <div className="d-filters-bar">
        <div className="d-filter-group">
          <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: 1 })} className="d-select">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <Section>
        {loading ? (
          <LoadingState text="Loading payments..." />
        ) : payments.length === 0 ? (
          <EmptyState text="No payments found for your appointments." />
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Patient</th>
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
                  const appointment = payment.appointmentId || {}
                  return (
                    <tr key={payment._id}>
                      <td className="d-money">{payment.receiptNumber}</td>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'} alt={patient.name} className="d-avatar" />
                          <div>
                            <div className="d-user-name">{patient.name || 'Unknown'}</div>
                            <div className="d-user-sub">{patient.phone || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {appointment.date ? formatDate(appointment.date) : 'N/A'}
                        {appointment.timeSlot ? ` • ${appointment.timeSlot}` : ''}
                      </td>
                      <td className="d-money">{formatCurrency(payment.amount)}</td>
                      <td>{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</td>
                      <td><StatusBadge status={payment.status} /></td>
                      <td>
                        <div className="d-actions">
                          {appointment._id && (
                            <Link to={`/doctor/appointments/${appointment._id}`} className="d-btn d-btn-outline d-btn-sm">Appointment</Link>
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

export default DoctorPayments
