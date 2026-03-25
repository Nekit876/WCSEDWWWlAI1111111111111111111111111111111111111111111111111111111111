import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore(state => state.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

const App = () => {
  const { token, setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (token) {
        const res = await window.api.profile(token)
        if (res.ok) {
          setAuth(token, res.profile)
        } else {
          setAuth(null, null)
          navigate('/login')
        }
      }
      setLoading(false)
    }
    init()
  }, [token])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {!isAuthPage && token && <Sidebar />}
      <main className={`flex-1 overflow-auto p-4 md:p-8 ${!isAuthPage && token ? 'ml-72' : ''}`}>
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
