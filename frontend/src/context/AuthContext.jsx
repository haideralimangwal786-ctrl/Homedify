import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        localStorage.setItem('token', token)
        try {
          const res = await axios.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          setUser(res.data.data)
        } catch (err) {
          setUser(null)
          setToken('')
          localStorage.removeItem('token')
        }
      } else {
        setUser(null)
        localStorage.removeItem('token')
      }
      setLoading(false)
    }

    initAuth()
  }, [token])

  const login = (tok) => {
    setLoading(true)
    setToken(tok)
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
  }

  const updateProfile = async (userData) => {
    try {
      const isFormData = userData instanceof FormData;
      const res = await axios.put('/api/v1/users/profile', userData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      })
      setUser(res.data.data)
      return { success: true, data: res.data.data }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.response?.data?.message || 'Failed to update profile'
      }
    }
  }

  const refreshUser = async () => {
    if (!token) return
    try {
      const res = await axios.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      setUser(res.data.data)
    } catch (err) {
      console.error('Failed to refresh user', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
