import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import './DoctorLogin.css'

const DoctorLogin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await axiosClient.post('/doctor/login', { email, password })
      const token = data.data?.token || data.token
      if (token) {
        localStorage.setItem('doctorToken', token)
        navigate('/doctor/dashboard')
      } else {
        setError('No token received')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="doctor-login-page">
      <div className="doctor-login-container">
        <div className="login-icon">🩺</div>
        <h2>Doctor Login</h2>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        {error && <div className="login-error">{error}</div>}

        <form className="doctor-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
          <button type="submit" className="doctor-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login" className="login-link">Admin Login</Link>
        </div>
      </div>
    </div>
  )
}

export default DoctorLogin
