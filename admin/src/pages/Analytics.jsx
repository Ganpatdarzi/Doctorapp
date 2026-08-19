import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import axiosClient from '../axios/axiosClient'
import { Section, LoadingState, ErrorBanner, PageHeader, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './Analytics.css'

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '12m', label: '12 Months' },
  { value: 'all', label: 'All Time' },
]

const STATUS_COLORS = {
  pending: '#f0ad4e',
  confirmed: '#17a2b8',
  completed: '#28a745',
  cancelled: '#dc3545',
  rejected: '#e83e8c',
}

const PALETTE = ['#0077b6', '#00b894', '#6f42c1', '#f0ad4e', '#17a2b8', '#e83e8c', '#fd7e14', '#20c997']

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const Kpi = ({ icon, label, value, sub, color = 'blue' }) => (
  <div className={`ana-kpi ana-kpi-${color}`}>
    <div className="ana-kpi-icon">{icon}</div>
    <div className="ana-kpi-body">
      <span className="ana-kpi-value">{value}</span>
      <span className="ana-kpi-label">{label}</span>
      {sub ? <span className="ana-kpi-sub">{sub}</span> : null}
    </div>
  </div>
)

const Analytics = () => {
  const { notify, toastEl } = useToast()
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState('')

  const fetchAnalytics = async (p = period) => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await axiosClient.get('/admin/analytics', { params: { period: p } })
      setData(res.data || res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const response = await axiosClient.get('/admin/analytics/export', {
        params: { period, format },
        responseType: 'blob',
        timeout: 45000,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics-report-${new Date().toISOString().slice(0, 10)}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify('Report exported successfully')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to export report', 'error')
    } finally {
      setExporting('')
    }
  }

  const stats = useMemo(() => data?.stats || {}, [data])

  const trendData = useMemo(() => {
    const src = ['12m', 'all'].includes(period) ? data?.monthly : data?.daily
    return src || []
  }, [data, period])

  const trendInterval = useMemo(() => {
    if (trendData.length <= 12) return 0
    return Math.ceil(trendData.length / 12)
  }, [trendData])

  const weekly = data?.weekly || []
  const monthly = data?.monthly || []
  const patientGrowth = data?.patientGrowth || []
  const statusDistribution = data?.statusDistribution || []
  const revenueByType = data?.revenueByType || []
  const revenueByMethod = data?.revenueByMethod || []
  const mostBookedDoctors = data?.mostBookedDoctors || []
  const topSpecializations = data?.topSpecializations || []
  const peakHours = data?.peakHours || []
  const dayOfWeek = data?.dayOfWeek || []
  const doctorPerformance = data?.doctorPerformance || []

  if (loading) return <LoadingState text="Loading analytics..." />
  if (error) return <ErrorBanner message={error} />

  const hasData = stats.totalAppointments > 0

  return (
    <div className="analytics-page">
      {toastEl}

      <PageHeader
        title="Analytics"
        subtitle={data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleString()} • ${data.from} to ${data.to}` : 'Business performance overview'}
      />

      <div className="ana-toolbar">
        <div className="ana-period-group">
          <span className="ana-period-label">Period</span>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`ana-chip ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ana-export-group">
          <button
            className="ana-export ana-export-pdf"
            disabled={!!exporting}
            onClick={() => handleExport('pdf')}
          >
            {exporting === 'pdf' ? 'Preparing...' : '⬇ PDF'}
          </button>
          <button
            className="ana-export ana-export-xlsx"
            disabled={!!exporting}
            onClick={() => handleExport('xlsx')}
          >
            {exporting === 'xlsx' ? 'Preparing...' : '⬇ Excel'}
          </button>
          <button
            className="ana-export ana-export-csv"
            disabled={!!exporting}
            onClick={() => handleExport('csv')}
          >
            {exporting === 'csv' ? 'Preparing...' : '⬇ CSV'}
          </button>
        </div>
      </div>

      <div className="ana-kpi-grid">
        <Kpi icon="💰" label="Total Revenue" value={formatCurrency(stats.totalEarnings)} sub={`${formatCurrency(stats.avgDailyRevenue)} / day`} color="green" />
        <Kpi icon="📅" label="Appointments" value={stats.totalAppointments} sub={`${stats.avgDaily || 0} / day`} color="blue" />
        <Kpi icon="👥" label="Patients" value={stats.totalPatients} sub="Registered" color="teal" />
        <Kpi icon="👨‍⚕️" label="Doctors" value={`${stats.activeDoctors} / ${stats.totalDoctors}`} sub="Active" color="purple" />
        <Kpi icon="✅" label="Completion Rate" value={`${stats.completionRate}%`} sub={`${stats.paidAppointments} paid`} color="orange" />
        <Kpi icon="↩️" label="Cancellation Rate" value={`${stats.cancellationRate}%`} sub="Of all bookings" color="red" />
        <Kpi icon="⏱️" label="Peak Hour" value={hasData ? stats.peakHour : '—'} sub={hasData ? `${stats.peakHourCount} bookings` : 'No data'} color="blue" />
        <Kpi icon="🎥" label="Video Share" value={`${stats.videoShare}%`} sub="Video consultations" color="green" />
      </div>

      <div className="ana-grid">
        <div className="ana-span-2">
          <Section
            title="Appointments & Revenue Trend"
            subtitle={['12m', 'all'].includes(period) ? 'Monthly' : 'Daily'}
          >
            {trendData.length === 0 ? (
              <div className="d-empty">No data for this period</div>
            ) : (
              <div className="ana-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={trendInterval} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={64} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,119,182,0.06)' }}
                      formatter={(value, name) => (name === 'Revenue' ? formatCurrency(value) : value)}
                    />
                    <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span>} />
                    <Bar yAxisId="left" dataKey="count" name="Appointments" fill="#0077b6" radius={[5, 5, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#00b894" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        <Section title="Revenue by Month" subtitle="Paid consultation fees">
          {monthly.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={72} />
                  <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#6f42c1" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Appointment Status" subtitle="Distribution by status">
          {statusDistribution.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={({ percent }) => (percent > 0.05 ? `${Math.round(percent * 100)}%` : '')}
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, capitalize(name)]} />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12, color: '#666' }}>{capitalize(value)}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Revenue by Consultation Type" subtitle="Clinic vs video">
          {revenueByType.length === 0 ? (
            <div className="d-empty">No revenue yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ percent }) => (percent > 0.05 ? `${Math.round(percent * 100)}%` : '')}
                  >
                    {revenueByType.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Revenue by Payment Method" subtitle="Online vs at clinic">
          {revenueByMethod.length === 0 ? (
            <div className="d-empty">No revenue yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByMethod}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ percent }) => (percent > 0.05 ? `${Math.round(percent * 100)}%` : '')}
                  >
                    {revenueByMethod.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[(i + 2) % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Patient Growth" subtitle="New and cumulative patients">
          {patientGrowth.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientGrowth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0077b6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0077b6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00b894" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00b894" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span>} />
                  <Area type="monotone" dataKey="total" name="Total Patients" stroke="#0077b6" strokeWidth={2.5} fill="url(#gradPatients)" />
                  <Area type="monotone" dataKey="new" name="New Patients" stroke="#00b894" strokeWidth={2} fill="url(#gradNew)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <div className="ana-span-2">
          <Section title="Most Booked Doctors" subtitle="Top 5 by appointments">
            {mostBookedDoctors.length === 0 ? (
              <div className="d-empty">No data yet</div>
            ) : (
              <div className="ana-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mostBookedDoctors} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f5" />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} formatter={(value, name) => (name === 'Revenue' ? formatCurrency(value) : value)} />
                    <Bar dataKey="total" name="Appointments" fill="#0077b6" radius={[0, 5, 5, 0]} barSize={18} />
                    <Bar dataKey="revenue" name="Revenue" fill="#00b894" radius={[0, 5, 5, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        <Section title="Top Specializations" subtitle="Most booked specialties">
          {topSpecializations.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSpecializations.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f5" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} formatter={(value, name) => (name === 'Revenue' ? formatCurrency(value) : value)} />
                  <Bar dataKey="count" name="Appointments" fill="#6f42c1" radius={[0, 5, 5, 0]} barSize={18} />
                  <Bar dataKey="revenue" name="Revenue" fill="#f0ad4e" radius={[0, 5, 5, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Appointments by Day of Week">
          {dayOfWeek.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="short" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} labelFormatter={(label) => dayOfWeek.find((d) => d.short === label)?.day || label} />
                  <Bar dataKey="count" name="Appointments" fill="#17a2b8" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Weekly Appointments" subtitle="Bookings by week">
          {weekly.length === 0 ? (
            <div className="d-empty">No data yet</div>
          ) : (
            <div className="ana-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.ceil(weekly.length / 8)} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} />
                  <Bar dataKey="count" name="Appointments" fill="#00b894" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <div className="ana-span-2">
          <Section title="Peak Booking Hours" subtitle="Distribution across the day">
            {peakHours.length === 0 || stats.totalAppointments === 0 ? (
              <div className="d-empty">No data yet</div>
            ) : (
              <div className="ana-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} formatter={(value, name) => (name === 'Revenue' ? formatCurrency(value) : value)} />
                    <Bar dataKey="count" name="Bookings" fill="#fd7e14" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        <div className="ana-span-2">
          <Section title="Doctor Performance" subtitle="Ranked by total appointments">
            {doctorPerformance.length === 0 ? (
              <div className="d-empty">No data yet</div>
            ) : (
              <div className="d-table-wrap">
                <table className="d-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Total</th>
                      <th>Completed</th>
                      <th>Confirmed</th>
                      <th>Pending</th>
                      <th>Cancelled</th>
                      <th>Revenue</th>
                      <th>Completion</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorPerformance.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <div className="d-user-cell">
                            <img
                              src={getImageUrl(doc.image) || 'https://via.placeholder.com/40?text=D'}
                              alt={doc.name}
                              className="d-avatar"
                            />
                            <div>
                              <div className="d-user-name">{doc.name}</div>
                              <div className="d-user-sub">{doc.specialization || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="d-money">{doc.total || 0}</td>
                        <td>{doc.completed || 0}</td>
                        <td>{doc.confirmed || 0}</td>
                        <td>{doc.pending || 0}</td>
                        <td>{doc.cancelled || 0}</td>
                        <td className="d-money">{formatCurrency(doc.revenue)}</td>
                        <td>
                          <div className="ana-rate-cell">
                            <span className="ana-rate-track">
                              <span className="ana-rate-fill" style={{ width: `${Math.min(doc.completionRate || 0, 100)}%` }} />
                            </span>
                            <span className="ana-rate-value">{doc.completionRate || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="ana-star">★</span> {doc.rating || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

export default Analytics
