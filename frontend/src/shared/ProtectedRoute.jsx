import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowed = [] }) => {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowed.length > 0 && !allowed.includes(user.role)) return <Navigate to="/" replace />

  return children
}

export default ProtectedRoute
