import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './ui/LoadingScreen'

/**
 * Gate for /dashboard, /students, /classes and /profile.
 *
 * Three states, in order:
 *   loading  -> Firebase hasn't reported yet; show the loading screen so a
 *               protected page never renders for an unknown user.
 *   no user  -> bounce to /login, remembering where they were headed.
 *   signed in -> render the app.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
