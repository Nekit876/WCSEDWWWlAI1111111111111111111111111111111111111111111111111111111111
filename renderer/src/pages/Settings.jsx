import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { Settings as SettingsIcon, Key, Globe, Layout, User, ShieldCheck, Zap, HelpCircle, Save, Moon, Sun, RefreshCcw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'

const Settings = () => {
  const { user, setAuth, token } = useAuthStore()
  const [settings, setSettings] = useState({
    apiKeyUrl: '',
    licenseUrl: '',
    usersUrl: '',
    userApiKey: '',
    model: 'openrouter/auto',
    theme: 'light',
    licenseKey: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const s = await window.api.getSettings()
      setSettings(s)
      if (s.theme === 'dark') document.documentElement.classList.add('dark')
    }
    load()
  }, [])

  const handleSaveSetting = async (key, value) => {
    setLoading(true)
    try {
      await window.api.setSetting(key, value)
      setSettings(prev => ({ ...prev, [key]: value }))
      if (key === 'theme') {
        if (value === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
      toast.success('Настройки сохранены')
    } catch (err) {
      toast.error('Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateLicense = async () => {
    if (!settings.licenseKey) return toast.error('Введите ключ')
    setLoading(true)
    try {
      const res = await window.api.validateLicense(settings.licenseKey)
      if (res.ok) {
        toast.success(`Лицензия активирована! Тариф: ${res.plan}`)
        const profileRes = await window.api.profile(token)
        setAuth(token, profileRes.profile)
      } else {
        toast.error(res.error || 'Неверный ключ')
      }
    } catch (err) {
      toast.error('Ошибка проверки')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshLicense = async () => {
    setLoading(true)
    try {
      const res = await window.api.refreshLicense()
      toast.success(`Лицензия обновлена! Тариф: ${res.type || 'free'}`)
      const profileRes = await window.api.profile(token)
      setAuth(token, profileRes.profile)
    } catch (err) {
      toast.error('Ошибка обновления')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <Toaster position="top-right" />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 bg-primary-600 rounded-[24px] shadow-lg shadow-primary-500/20">
            <SettingsIcon className="text-white w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Настройки <span className="text-slate-400 font-light">аккаунта</span>
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium ml-1">Управляйте подпиской, ключами и интерфейсом приложения</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Profile & Support */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <User size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-[28px] flex items-center justify-center text-primary-600 dark:text-primary-400 mb-8 border border-primary-100 dark:border-primary-800 shadow-inner">
                <User size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate mb-1">{user?.email}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">Зарегистрированный пользователь</p>
              
              <div className="space-y-4 pt-8 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Тариф</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    user?.plan === 'pro' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  }`}>
                    {user?.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Генераций</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{user?.generations || 0}</span>
                </div>
              </div>

              <button 
                onClick={handleRefreshLicense}
                disabled={loading}
                className="w-full mt-10 flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                Обновить статус
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl shadow-primary-500/30 relative overflow-hidden"
          >
            <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12">
              <HelpCircle size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-3 tracking-tight">Поддержка</h3>
              <p className="text-primary-50/80 text-sm mb-8 leading-relaxed font-medium">Возникли вопросы? Наша команда всегда готова помочь вам с использованием SchoolAI.</p>
              <a 
                href="https://t.me/u124557" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-primary-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary-50 transition-all shadow-xl active:scale-95"
              >
                Написать в Telegram
              </a>
            </div>
          </motion.div>
        </div>

        {/* Right: Settings Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* License Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/10 dark:shadow-none"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Активация</h2>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Лицензионный доступ</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Ключ доступа</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={settings.licenseKey || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, licenseKey: e.target.value }))}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[24px] outline-none focus:ring-4 focus:ring-primary-500/10 transition-all dark:text-white font-bold placeholder:text-slate-300"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                  </div>
                  <button 
                    onClick={handleValidateLicense}
                    disabled={loading}
                    className="px-10 py-5 bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary-500/20"
                  >
                    Активировать
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium ml-1">
                  <HelpCircle size={14} className="text-slate-300" />
                  Введите ключ, полученный после оплаты тарифа
                </div>
              </div>
            </div>
          </motion.section>

          {/* Pricing Plans Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/10 dark:shadow-none"
          >
             <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Тарифы</h2>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Выберите свой уровень</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  name: 'FREE', 
                  price: '0₽', 
                  features: ['5 генераций в день', 'Базовые модели', 'Экспорт в TXT'],
                  current: user?.plan === 'free',
                  color: 'primary'
                },
                { 
                  name: 'BASIC', 
                  price: '490₽', 
                  features: ['50 генераций в день', 'Улучшенные модели', 'Экспорт PDF/DOCX'],
                  current: user?.plan === 'basic',
                  color: 'indigo'
                },
                { 
                  name: 'PRO', 
                  price: '990₽', 
                  features: ['Безлимит', 'Мощные модели', 'Приоритет AI'],
                  current: user?.plan === 'pro',
                  color: 'amber'
                }
              ].map((plan) => (
                <div key={plan.name} className={`relative p-8 rounded-[36px] border transition-all duration-500 flex flex-col ${
                  plan.current 
                    ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-900/10 shadow-2xl shadow-primary-500/5 ring-4 ring-primary-500/5 scale-[1.02]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}>
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary-500/20">
                      Активен
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                      plan.current ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {plan.name}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  </div>
                  <ul className="space-y-4 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${plan.current ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Interface Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/10 dark:shadow-none"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                <Sun size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Интерфейс</h2>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Визуальные настройки</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => handleSaveSetting('theme', 'light')}
                className={`p-8 rounded-[36px] border flex flex-col items-center gap-4 transition-all duration-500 ${
                  settings.theme === 'light' 
                    ? 'border-primary-500 bg-primary-50/20 shadow-xl shadow-primary-500/5' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-4 rounded-2xl ${settings.theme === 'light' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 text-slate-400'}`}>
                  <Sun size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Светлая тема</span>
              </button>

              <button 
                onClick={() => handleSaveSetting('theme', 'dark')}
                className={`p-8 rounded-[36px] border flex flex-col items-center gap-4 transition-all duration-500 ${
                  settings.theme === 'dark' 
                    ? 'border-primary-500 bg-slate-800 shadow-xl shadow-primary-500/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-4 rounded-2xl ${settings.theme === 'dark' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-700 text-slate-500'}`}>
                  <Moon size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white">Темная тема</span>
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

export default Settings
