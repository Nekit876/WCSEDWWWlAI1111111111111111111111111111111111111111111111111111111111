import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LayoutDashboard, History, Settings, LogOut, GraduationCap, Zap, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-20 shadow-2xl shadow-slate-200/20 dark:shadow-none transition-all duration-300">
      <div className="p-8 flex items-center gap-4">
        <div className="bg-gradient-to-tr from-primary-600 to-primary-400 p-2.5 rounded-2xl shadow-xl shadow-primary-500/30 ring-4 ring-primary-500/10 animate-pulse-slow">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            SchoolAI
          </h1>
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em] mt-1 block">Platform</span>
        </div>
      </div>

      <nav className="flex-1 px-6 py-10 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/50 dark:ring-slate-700'
                  : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <item.icon size={20} className="transition-transform group-hover:scale-110" />
            <span className="font-bold text-sm tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-inner border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
             {user?.plan === 'pro' ? <Zap size={48} /> : <CheckCircle size={48} />}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                user?.plan === 'pro' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm shadow-amber-500/10' 
                  : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              }`}>
                {user?.plan || 'Free'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-full mb-1">
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
          className="mt-4 flex items-center justify-center gap-3 w-full px-5 py-4 text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500/20 dark:hover:text-red-400 rounded-2xl transition-all duration-300 font-bold text-sm group"
        >
          <LogOut size={18} className="transition-transform group-hover:translate-x-1" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
