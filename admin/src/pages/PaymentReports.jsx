import { useState, useEffect } from 'react'
import axiosClient from '../axios/axiosClient'
import {
  PageHeader,
  Section,
  StatCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  formatDate,
  formatTime,
  formatCurrency,
} from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import './PaymentReports.css'
import './DoctorCommon.css'

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
]

const defaultFrom = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().split('T')[0]
}

const defaultTo = () => new Date().toISOString().split('T')[0]

const PaymentReports = () => {
  const { notify, toastEl } = useToast()
  const [from, setFrom] = useState(defaultFrom())
  const [to, setTo] = useState(defaultTo())
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [exporting, setExporting] = useState(false)

  const fetchReport = async (f = from, t = to, s = status) => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (f) params.from = f
      if (t) params.to = t
      if (s) params.status = s
      const { data } = await axiosClient.get('/admin/payments/report', { params })
      const res = data.data || data
      setReport(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (status) params.status = status
      params.format = 'csv'
      const response = await axiosClient.get('/admin/payments/report', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payments-report-${from || 'all'}-${to || 'all'}.csv`)
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

  const summary = report?.summary || {}
  const monthly = report?.monthly || []
  const payments = report?.payments || []

  return (
    <div className="d-reports-page">
      {toastEl}

      <PageHeader
        title="Payment Reports"
        subtitle="Revenue summaries and payment exports"
      >
        <button className="d-btn d-btn-primary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'Exporting...' : '⬇ Export CSV'}
        </button>
      </PageHeader>

      <Section>
        <div className="d-reports-filters">
          <div className="d-filter-item">
            <label className="d-filter-label">From</label>
            <input type="date" className="d-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="d-filter-item">
            <label className="d-filter-label">To</label>
            <input type="date" className="d-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="d-filter-item">
            <label className="d-filter-label">Status</label>
            <select className="d-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {PAYMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="d-filter-item d-filter-actions">
            <button className="d-btn d-btn-primary" onClick={() => fetchReport()}>Apply</button>
            <button
              className="d-btn d-btn-outline"
              onClick={() => {
                setFrom(defaultFrom())
                setTo(defaultTo())
                setStatus('')
                fetchReport(defaultFrom(), defaultTo(), '')
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      {error && <div className="d-error-banner">{error}</div>}

      {loading ? (
        <LoadingState text="Loading payment report..." />
      ) : report ? (
        <>
          <div className="d-stat-grid">
            <StatCard icon="💰" label="Total Revenue (Paid)" value={formatCurrency(summary.totalAmount)} color="green" />
            <StatCard icon="💳" label="Online Payments" value={formatCurrency(summary.onlineAmount)} color="blue" />
            <StatCard icon="🏥" label="Clinic Payments" value={formatCurrency(summary.clinicAmount)} color="purple" />
            <StatCard icon="↩️" label="Refunded" value={formatCurrency(summary.refundedAmount)} color="orange" />
            <StatCard icon="✅" label="Paid Transactions" value={summary.paidCount} color="teal" />
            <StatCard icon="🧾" label="Total Records" value={summary.totalRecords} color="gold" />
          </div>

          {monthly.length > 0 && (
            <Section title="Monthly Revenue" subtitle="Paid revenue over the last 6 months">
              <div className="d-table-wrap">
                <table className="d-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Paid Transactions</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.key}>
                        <td className="d-money">{m.label}</td>
                        <td className="d-money">{m.count}</td>
                        <td className="d-money">{formatCurrency(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section
            title="Matching Payments"
            subtitle={`${payments.length} payment${payments.length === 1 ? '' : 's'} in the selected range`}
          >
            {payments.length === 0 ? (
              <EmptyState text="No payments found in the selected range." />
            ) : (
              <div className="d-table-wrap">
                <table className="d-table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Date</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const patient = p.userId || {}
                      const doctor = p.doctorId || {}
                      const appt = p.appointmentId || {}
                      return (
                        <tr key={p._id}>
                          <td className="d-money">{p.receiptNumber}</td>
                          <td>{formatDate(p.paidAt || p.createdAt)}</td>
                          <td>
                            <div className="d-user-sub">{patient.name || 'Unknown'}</div>
                            <div className="d-user-sub">{patient.email || ''}</div>
                          </td>
                          <td className="d-user-name">{doctor.name || 'Unknown'}</td>
                          <td className="d-money">{formatCurrency(p.amount)}</td>
                          <td className="d-money">{p.paymentMethod === 'online' ? 'Online' : 'Clinic'}</td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      ) : null}
    </div>
  )
}

export default PaymentReports
