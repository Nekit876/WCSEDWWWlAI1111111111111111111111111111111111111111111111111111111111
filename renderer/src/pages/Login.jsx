import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast, Toaster } from 'react-hot-toast'
import { LogIn, Mail, Lock, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(state => state.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!window.api) {
        throw new Error('API Electron не инициализировано. Попробуйте перезапустить приложение.')
      }
      console.log('Attempting login with:', email)
      const res = await window.api.login(email, password)
      console.log('Login response:', res)
      if (res.ok) {
        const profileRes = await window.api.profile(res.token)
        console.log('Profile response:', profileRes)
        if (profileRes.ok) {
          setAuth(res.token, profileRes.profile)
          toast.success('Добро пожаловать!')
          navigate('/')
        } else {
          toast.error(profileRes.error || 'Ошибка загрузки профиля')
        }
      } else {
        if (res.error?.includes('Email not confirmed')) {
          toast.error('Email не подтвержден! Пожалуйста, обратитесь к администратору.', { duration: 6000 })
        } else {
          toast.error(res.error || 'Ошибка входа')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Произошла ошибка: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <Toaster position="top-right" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] shadow-2xl p-10 border border-white/10 dark:border-slate-800/50">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-gradient-to-tr from-primary-500 to-primary-400 p-5 rounded-[24px] shadow-2xl shadow-primary-500/40 mb-6"
            >
              <GraduationCap className="text-white w-10 h-10" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight">SchoolAI</h1>
            <p className="text-primary-200/60 text-sm mt-2 font-medium">Ваш интеллектуальный помощник</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-primary-300/80 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300/40 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[20px] focus:ring-2 focus:ring-primary-500/50 focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                  placeholder="name@school.ru"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-primary-300/80 uppercase tracking-widest ml-1">Пароль</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300/40 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[20px] focus:ring-2 focus:ring-primary-500/50 focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-black py-4 rounded-[20px] shadow-xl shadow-primary-900/40 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center space-x-3 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span className="uppercase tracking-widest text-sm">Войти</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary-400 font-black hover:text-primary-300 transition-colors">
                Создать
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
