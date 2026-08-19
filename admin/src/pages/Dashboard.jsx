import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import axiosClient from '../axios/axiosClient'
import { StatCard, Section, StatusBadge, LoadingState, EmptyState, ErrorBanner, ConfirmDialog, formatDate, formatCurrency } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './Dashboard.css'

const Dashboard = () => {
  const { notify, toastEl } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: res } = await axiosClient.get('/admin/dashboard')
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

  const handleDeleteAppointment = async (id) => {
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/appointments/${id}`)
      notify('Appointment deleted successfully')
      setDeleteId(null)
      fetchDashboard()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete appointment', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState text="Loading dashboard..." />
  if (error) return <ErrorBanner message={error} />

  const stats = data?.stats || {}
  const monthly = data?.monthlyAppointments || []
  const recent = data?.recentAppointments || []
  const recentDoctors = data?.recentDoctors || []

  return (
    <div className="admin-dashboard">
      {toastEl}

      <div className="d-page-header">
        <div>
          <h1 className="d-page-title">Dashboard</h1>
          <p className="d-page-subtitle">Overview of your appointment system.</p>
        </div>
        <div className="d-actions">
          <Link to="/appointments" className="d-btn d-btn-primary">View Appointments</Link>
          <Link to="/doctors/add" className="d-btn d-btn-outline">+ Add Doctor</Link>
        </div>
      </div>

      <div className="d-stat-grid">
        <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.totalDoctors || 0} color="blue" />
        <StatCard icon="👥" label="Total Patients" value={stats.totalPatients || 0} color="teal" />
        <StatCard icon="📅" label="Total Appointments" value={stats.totalAppointments || 0} color="purple" />
        <StatCard icon="📆" label="Today's Appointments" value={stats.todayAppointments || 0} color="gold" />
        <StatCard icon="⏳" label="Pending" value={stats.pendingAppointments || 0} color="orange" />
        <StatCard icon="✅" label="Completed" value={stats.completedAppointments || 0} color="green" />
        <StatCard icon="❌" label="Cancelled" value={stats.cancelledAppointments || 0} color="red" />
        <StatCard icon="💰" label="Total Earnings" value={formatCurrency(stats.totalEarnings)} color="green" />
      </div>

      <Section
        title="Appointments Overview"
        subtitle="Last 12 months"
      >
        {monthly.length === 0 ? (
          <EmptyState text="No appointment data yet." />
        ) : (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(0,119,182,0.06)' }} />
                <Bar dataKey="count" name="Appointments" fill="#0077b6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section
        title="Recent Appointments"
        subtitle="Latest bookings across all doctors"
        action={<Link to="/appointments" className="d-btn d-btn-ghost d-btn-sm">View All</Link>}
      >
        {recent.length === 0 ? (
          <EmptyState text="No appointments found." />
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((appt) => {
                  const patient = appt.userId || {}
                  const doctor = appt.doctorId || {}
                  return (
                    <tr key={appt._id}>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'} alt={patient.name} className="d-avatar" />
                          <span className="d-user-name">{patient.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-user-cell">
                          <img src={getImageUrl(doctor.image) || 'https://via.placeholder.com/40?text=D'} alt={doctor.name} className="d-avatar" />
                          <span className="d-user-name">{doctor.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{formatDate(appt.date)}</td>
                      <td>{appt.timeSlot || 'N/A'}</td>
                      <td className="d-money">{formatCurrency(appt.consultationFee)}</td>
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
          </div>
        )}
      </Section>

      <Section
        title="Recently Added Doctors"
        subtitle="Newest profiles in the system"
        action={<Link to="/doctors" className="d-btn d-btn-ghost d-btn-sm">View All</Link>}
      >
        {recentDoctors.length === 0 ? (
          <EmptyState text="No doctors yet." />
        ) : (
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Fees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDoctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <div className="d-user-cell">
                        <img src={getImageUrl(doc.image) || 'https://via.placeholder.com/40?text=D'} alt={doc.name} className="d-avatar" />
                        <span className="d-user-name">{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.specialization || 'N/A'}</td>
                    <td>{doc.experience || 0} yrs</td>
                    <td className="d-money">{formatCurrency(doc.fees)}</td>
                    <td><StatusBadge status={doc.isAvailable ? 'confirmed' : 'cancelled'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setDeleteId(null) }}
        onConfirm={() => handleDeleteAppointment(deleteId)}
      />
    </div>
  )
}

export default Dashboard
