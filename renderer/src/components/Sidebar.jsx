import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LayoutDashboard, History, Settings, LogOut, GraduationCap, Zap, CheckCircle, RefreshCw, LogIn } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [syncing, setSyncing] = React.useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      toast.success('Синхронизация с облаком Supabase выполнена')
    } catch (err) {
      toast.error('Ошибка сети')
    } finally {
      setSyncing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Генератор', path: '/', icon: LayoutDashboard },
    { name: 'История', path: '/history', icon: History },
    { name: 'Настройки', path: '/settings', icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500">
      <div className="p-10 flex items-center gap-5">
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-primary-600 p-3 rounded-2xl shadow-xl shadow-primary-500/20">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            SchoolAI
          </h1>
          <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.3em] mt-1.5 block">Преподаватель</span>
        </div>
      </div>

      <nav className="flex-1 px-6 py-12 space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500 group relative ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-none translate-x-2'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <item.icon size={20} className="transition-transform group-hover:scale-110" />
            <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>
            {/* Active indicator dot */}
            <AnimatePresence>
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute -left-2 w-1.5 h-6 bg-primary-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 300 }}
                  />
                )}
              </NavLink>
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="p-8 space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
             {user?.plan === 'pro' ? <Zap size={80} /> : <CheckCircle size={80} />}
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                user?.plan === 'pro' 
                  ? 'bg-amber-500 text-white shadow-amber-500/20' 
                  : 'bg-primary-500 text-white shadow-primary-500/20'
              }`}>
                {user?.plan || 'Free'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate mb-0.5">
                {user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] font-medium text-slate-400 truncate">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-4 w-full px-6 py-5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-[24px] transition-all duration-500 font-black text-[10px] uppercase tracking-widest group border border-transparent hover:border-red-100 dark:hover:border-red-900/30 active:scale-95"
        >
          <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
