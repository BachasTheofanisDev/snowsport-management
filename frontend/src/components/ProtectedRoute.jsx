import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) return <p>Φόρτωση...</p>

  if (!user) return <Navigate to="/" />

  if (!allowedRoles.includes(role)) return <Navigate to="/" />

  return children
}

export default ProtectedRoute