import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const saved = localStorage.getItem('adminUser')
    if (token && saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.data.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access only')
    }
    localStorage.setItem('adminToken', data.data.token)
    localStorage.setItem('adminUser', JSON.stringify(data.data.user))
    setUser(data.data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
