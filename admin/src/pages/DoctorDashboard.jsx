import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { StatCard, Section, StatusBadge, LoadingState, EmptyState, ErrorBanner, formatTime, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './DoctorDashboard.css'

const DoctorDashboard = () => {
  const { notify, toastEl } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await axiosClient.get('/doctor/dashboard')
      setData(res.data || res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleQuickAction = async (id, action) => {
    try {
      await axiosClient.patch(`/doctor/appointments/${id}`, { action })
      notify(`Appointment ${action === 'accept' ? 'accepted' : action} successfully`)
      fetchDashboard()
    } catch (err) {
      notify(err.response?.data?.message || `Failed to ${action} appointment`, 'error')
    }
  }

  if (loading) return <LoadingState text="Loading dashboard..." />
  if (error) return <ErrorBanner message={error} />

  const stats = data?.stats || {}
  const schedule = data?.todaysSchedule || []

  return (
    <div className="d-doctor-dashboard">
      {toastEl}

      <div className="d-page-header">
        <div>
          <h1 className="d-page-title">Dashboard</h1>
          <p className="d-page-subtitle">Welcome back! Here's your practice overview.</p>
        </div>
        <Link to="/doctor/appointments" className="d-btn d-btn-primary">View All Appointments</Link>
      </div>

      <div className="d-stat-grid">
        <StatCard icon="📋" label="Total Appointments" value={stats.totalAppointments || 0} color="blue" />
        <StatCard icon="📅" label="Today's Appointments" value={stats.todayAppointments || 0} color="teal" />
        <StatCard icon="⏰" label="Upcoming" value={stats.upcomingAppointments || 0} color="green" />
        <StatCard icon="✅" label="Completed" value={stats.completedAppointments || 0} color="purple" />
        <StatCard icon="❌" label="Cancelled" value={stats.cancelledAppointments || 0} color="red" />
        <StatCard icon="⏳" label="Pending Requests" value={stats.pendingRequests || 0} color="orange" />
        <StatCard icon="👥" label="Total Patients" value={stats.totalPatients || 0} color="gold" />
        <StatCard icon="💰" label="Total Earnings" value={formatCurrency(stats.totalEarnings)} color="green" />
      </div>

      <div className="d-quick-actions">
        <Link to="/doctor/appointments?status=pending" className="d-quick-action">
          <span className="d-qa-icon">⏳</span> Review Requests
        </Link>
        <Link to="/doctor/appointments" className="d-quick-action">
          <span className="d-qa-icon">📅</span> All Appointments
        </Link>
        <Link to="/doctor/schedule" className="d-quick-action">
          <span className="d-qa-icon">🗓️</span> Manage Schedule
        </Link>
        <Link to="/doctor/availability" className="d-quick-action">
          <span className="d-qa-icon">🕒</span> Availability
        </Link>
      </div>

      <Section
        title="Today's Schedule"
        subtitle={data?.today ? `Appointments booked for ${new Date(data.today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'Schedule for today'}
        action={schedule.length > 0 ? <span className="d-tag">{schedule.length} appointment{schedule.length > 1 ? 's' : ''}</span> : null}
      >
        {schedule.length === 0 ? (
          <EmptyState text="No appointments scheduled for today." />
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((appt) => {
                  const patient = appt.userId || {}
                  return (
                    <tr key={appt._id}>
                      <td className="d-money">{formatTime(appt.timeSlot)}</td>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'} alt={patient.name} className="d-avatar" />
                          <span className="d-user-name">{patient.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-user-sub">{patient.phone || 'N/A'}</div>
                        <div className="d-user-sub">{patient.email || ''}</div>
                      </td>
                      <td><StatusBadge status={appt.status} /></td>
                      <td className="d-money">${appt.consultationFee || 0}</td>
                      <td>
                        <div className="d-actions">
                          <Link to={`/doctor/appointments/${appt._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                          {appt.status === 'pending' && (
                            <button className="d-btn d-btn-success d-btn-sm" onClick={() => handleQuickAction(appt._id, 'accept')}>Accept</button>
                          )}
                          {appt.status === 'pending' && (
                            <button className="d-btn d-btn-danger d-btn-sm" onClick={() => handleQuickAction(appt._id, 'reject')}>Reject</button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button className="d-btn d-btn-success d-btn-sm" onClick={() => handleQuickAction(appt._id, 'complete')}>Complete</button>
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
    </div>
  )
}

export default DoctorDashboard
