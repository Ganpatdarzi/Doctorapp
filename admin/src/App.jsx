import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DoctorLayout from './components/DoctorLayout'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingState } from './components/DoctorUI'
import './App.css'

const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DoctorsList = lazy(() => import('./pages/DoctorsList'))
const AddDoctor = lazy(() => import('./pages/AddDoctor'))
const EditDoctor = lazy(() => import('./pages/EditDoctor'))
const AdminDoctorDetails = lazy(() => import('./pages/AdminDoctorDetails'))
const AllAppointments = lazy(() => import('./pages/AllAppointments'))
const AdminAppointmentDetails = lazy(() => import('./pages/AdminAppointmentDetails'))
const PatientsList = lazy(() => import('./pages/PatientsList'))
const PatientDetails = lazy(() => import('./pages/PatientDetails'))
const PaymentsList = lazy(() => import('./pages/PaymentsList'))
const PaymentDetails = lazy(() => import('./pages/PaymentDetails'))
const PaymentReports = lazy(() => import('./pages/PaymentReports'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const DoctorLogin = lazy(() => import('./pages/DoctorLogin'))
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'))
const DoctorEditProfile = lazy(() => import('./pages/DoctorEditProfile'))
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const DoctorAppointments = lazy(() => import('./pages/DoctorAppointments'))
const DoctorAppointmentDetails = lazy(() => import('./pages/DoctorAppointmentDetails'))
const DoctorPayments = lazy(() => import('./pages/DoctorPayments'))
const DoctorAvailability = lazy(() => import('./pages/DoctorAvailability'))
const DoctorSchedule = lazy(() => import('./pages/DoctorSchedule'))
const DoctorChangePassword = lazy(() => import('./pages/DoctorChangePassword'))
const DoctorEMR = lazy(() => import('./pages/DoctorEMR'))
const DoctorEMRCreate = lazy(() => import('./pages/DoctorEMRCreate'))
const DoctorEMRDetail = lazy(() => import('./pages/DoctorEMRDetail'))
const DoctorVideoConsultation = lazy(() => import('./pages/DoctorVideoConsultation'))
const AdminEMR = lazy(() => import('./pages/AdminEMR'))
const AdminEMRDetail = lazy(() => import('./pages/AdminEMRDetail'))

const pageFallback = (
  <div style={{ padding: '2rem' }}>
    <LoadingState text="Loading page..." />
  </div>
)

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('adminToken')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function ProtectedDoctorRoute({ children }) {
  const token = localStorage.getItem('doctorToken')
  if (!token) return <Navigate to="/doctor-login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={pageFallback}>
        <div className="admin-app">
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />

            <Route path="/doctor" element={
              <ProtectedDoctorRoute>
                <DoctorLayout />
              </ProtectedDoctorRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="profile" element={<DoctorProfile />} />
              <Route path="profile/edit" element={<DoctorEditProfile />} />
              <Route path="availability" element={<DoctorAvailability />} />
              <Route path="schedule" element={<DoctorSchedule />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="appointments/:id" element={<DoctorAppointmentDetails />} />
              <Route path="consultation/:id" element={<DoctorVideoConsultation />} />
              <Route path="emr" element={<DoctorEMR />} />
              <Route path="emr/new" element={<DoctorEMRCreate />} />
              <Route path="emr/:id" element={<DoctorEMRDetail />} />
              <Route path="payments" element={<DoctorPayments />} />
              <Route path="change-password" element={<DoctorChangePassword />} />
            </Route>

            <Route
              path="/*"
              element={
                <ProtectedAdminRoute>
                  <div className="admin-layout">
                    <Sidebar />
                    <main className="admin-main">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/doctors" element={<DoctorsList />} />
                        <Route path="/doctors/add" element={<AddDoctor />} />
                        <Route path="/doctors/edit/:id" element={<EditDoctor />} />
                        <Route path="/doctors/:id" element={<AdminDoctorDetails />} />
                        <Route path="/appointments" element={<AllAppointments />} />
                        <Route path="/appointments/:id" element={<AdminAppointmentDetails />} />
                        <Route path="/patients" element={<PatientsList />} />
                        <Route path="/patients/:id" element={<PatientDetails />} />
                        <Route path="/emr" element={<AdminEMR />} />
                        <Route path="/emr/:id" element={<AdminEMRDetail />} />
                        <Route path="/payments" element={<PaymentsList />} />
                        <Route path="/payments/report" element={<PaymentReports />} />
                        <Route path="/payments/:id" element={<PaymentDetails />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
