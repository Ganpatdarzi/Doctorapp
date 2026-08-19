import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading/Loading'

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Loading message="Loading..." />

  if (isAuthenticated) {
    return <Navigate to="/my-appointments" replace />
  }

  return children
}

export default PublicOnlyRoute
