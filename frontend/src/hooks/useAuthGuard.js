import { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

/**
 * Returns a guard function.
 * Call `guard()` before any auth-required action.
 * If user is not logged in → shows toast + redirects to /login → returns false.
 * If user is logged in → returns true.
 *
 * Usage:
 *   const guard = useAuthGuard()
 *   const handleCart = () => { if (!guard()) return; add(product) }
 */
const useAuthGuard = (message = 'Please log in to continue') => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const guard = () => {
    if (!user) {
      toast.error(message, { icon: '🔒', id: 'auth-guard' })
      navigate('/login', { state: { from: location.pathname } })
      return false
    }
    return true
  }

  return guard
}

export default useAuthGuard
