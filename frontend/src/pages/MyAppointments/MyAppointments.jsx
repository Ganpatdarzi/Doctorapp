import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyAppointments, cancelAppointment } from '../../api/appointments'
import { createCheckoutSession } from '../../api/payments'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errorHandler'
import AppointmentCard from '../../components/AppointmentCard/AppointmentCard'
import PaymentConfirmation from '../../components/PaymentConfirmation/PaymentConfirmation'
import RescheduleModal from '../../components/RescheduleModal/RescheduleModal'
import EmptyState from '../../components/EmptyState/EmptyState'
import Error from '../../components/Error/Error'
import { MY_APPOINTMENT_TABS } from '../../constants'
import './MyAppointments.css'

const statusInTab = (status, tab) => {
  if (tab === 'upcoming') return ['pending', 'confirmed'].includes(status)
  return status === tab
}

const MyAppointments = () => {
  const { notify, toastEl } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [typeFilter, setTypeFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payingAppointment, setPayingAppointment] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyAppointments()
      setAppointments(res.appointments || res)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load appointments.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const filteredAppointments = appointments.filter(
    (a) =>
      statusInTab(a.status, activeTab) &&
      (typeFilter === 'all' || (a.meetingType || 'clinic') === typeFilter)
  )

  const handleJoin = (appointment) => {
    navigate(`/consultation/${appointment._id}`)
  }

  const handleCancel = async (id) => {
    const reason = window.prompt('Please provide a reason for cancellation (optional):')
    if (reason === null) return
    try {
      await cancelAppointment(id, reason)
      notify('Appointment cancelled')
      fetchAppointments()
    } catch (err) {
      notify(getErrorMessage(err, 'Failed to cancel appointment.'), 'error')
    }
  }

  const handlePay = (appointment) => {
    setPayingAppointment(appointment)
  }

  const handleRescheduleSuccess = (date, timeSlot) => {
    setReschedulingAppointment(null)
    notify('Appointment rescheduled successfully')
    fetchAppointments()
  }

  const handleConfirmPay = async () => {
    if (!payingAppointment) return
    setProcessingPayment(true)
    try {
      const checkout = await createCheckoutSession(payingAppointment._id)
      setPayingAppointment(null)
      setProcessingPayment(false)
      if (checkout.demo) {
        notify('Payment completed (demo mode)')
        fetchAppointments()
        return
      }
      if (checkout.url) {
        window.location.href = checkout.url
        return
      }
      notify('Payment could not be started. Please try again.')
    } catch (err) {
      setProcessingPayment(false)
      notify(getErrorMessage(err, 'Could not start payment.'), 'error')
    }
  }

  const emptyMessages = {
    upcoming: {
      icon: '📅',
      title: 'No upcoming appointments',
      description: "You don't have any upcoming appointments. Browse our doctors to book one.",
    },
    completed: {
      icon: '✅',
      title: 'No completed appointments',
      description: 'Your completed appointments will appear here.',
    },
    cancelled: {
      icon: '❌',
      title: 'No cancelled appointments',
      description: 'You have no cancelled appointments. Great!',
    },
    rejected: {
      icon: '🚫',
      title: 'No rejected appointments',
      description: 'You have no rejected appointment requests.',
    },
  }

  return (
    <div className="my-appointments-page">
      {toastEl}
      <div className="my-appointments-container">
        <div className="my-appointments-header">
          <h1>My Appointments</h1>
          <Link to="/doctors" className="book-new-btn">+ Book New</Link>
        </div>

        <div className="tabs-container">
          {MY_APPOINTMENT_TABS.map((tab) => {
            const count = appointments.filter((a) => statusInTab(a.status, tab.key)).length
            return (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="consultation-type-filter">
          {[
            { key: 'all', label: 'All' },
            { key: 'video', label: '📹 Video' },
            { key: 'clinic', label: '🏥 In Clinic' },
          ].map((t) => (
            <button
              key={t.key}
              className={`type-chip ${typeFilter === t.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="appointments-loading">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : error ? (
          <Error message={error} onRetry={fetchAppointments} />
        ) : filteredAppointments.length > 0 ? (
          <div className="appointments-list">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onCancel={['pending', 'confirmed'].includes(appointment.status) ? handleCancel : undefined}
                onReschedule={['pending', 'confirmed'].includes(appointment.status) ? setReschedulingAppointment : undefined}
                onPay={handlePay}
                onJoin={handleJoin}
              />
            ))}
          </div>
        ) : (
          <EmptyState {...emptyMessages[activeTab]} />
        )}
      </div>

      <PaymentConfirmation
        open={!!payingAppointment}
        appointment={payingAppointment}
        busy={processingPayment}
        onConfirm={handleConfirmPay}
        onClose={() => !processingPayment && setPayingAppointment(null)}
      />

      <RescheduleModal
        open={!!reschedulingAppointment}
        appointment={reschedulingAppointment}
        onClose={() => setReschedulingAppointment(null)}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  )
}

export default MyAppointments
