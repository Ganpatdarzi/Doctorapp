import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import './AdminLogin.css'

const AdminLogin = () => {
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
      const { data } = await axiosClient.post('/admin/login', { email, password })
      const token = data.data?.token || data.token
      if (token) {
        localStorage.setItem('adminToken', token)
        navigate('/')
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
    <div className="admin-login-page">
      <div className="admin-login-container">
        <h2>Admin Panel</h2>
        <p className="admin-login-subtitle">Sign in to manage your dashboard</p>

        {error && <div className="login-error">{error}</div>}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
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
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/doctor-login" className="login-link-alt">Doctor Login</Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
