import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import Loading from './components/Loading/Loading'
import './App.css'

const Home = lazy(() => import('./pages/Home/Home'))
const About = lazy(() => import('./pages/About/About'))
const Doctors = lazy(() => import('./pages/Doctors/Doctors'))
const DoctorProfile = lazy(() => import('./pages/DoctorProfile/DoctorProfile'))
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Register/Register'))
const AppointmentBooking = lazy(() => import('./pages/AppointmentBooking/AppointmentBooking'))
const MyAppointments = lazy(() => import('./pages/MyAppointments/MyAppointments'))
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess/PaymentSuccess'))
const PaymentFailure = lazy(() => import('./pages/PaymentFailure/PaymentFailure'))
const PaymentHistory = lazy(() => import('./pages/PaymentHistory/PaymentHistory'))
const Receipt = lazy(() => import('./pages/Receipt/Receipt'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords/MedicalRecords'))
const MedicalRecordDetails = lazy(() => import('./pages/MedicalRecordDetails/MedicalRecordDetails'))
const VideoConsultation = lazy(() => import('./pages/VideoConsultation/VideoConsultation'))
const Assistant = lazy(() => import('./pages/Assistant/Assistant'))

const pageFallback = (
  <div className="page-loading">
    <Loading message="Loading page..." />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={pageFallback}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctor/:id" element={<DoctorProfile />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/book-appointment/:id"
              element={
                <ProtectedRoute>
                  <AppointmentBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/failure"
              element={
                <ProtectedRoute>
                  <PaymentFailure />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipt/:paymentId"
              element={
                <ProtectedRoute>
                  <Receipt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-records"
              element={
                <ProtectedRoute>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-records/:id"
              element={
                <ProtectedRoute>
                  <MedicalRecordDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={<Assistant />}
            />
          </Route>

          <Route
            path="/consultation/:appointmentId"
            element={
              <ProtectedRoute>
                <VideoConsultation />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
