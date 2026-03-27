import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { Settings as SettingsIcon, Key, Globe, Layout, User, ShieldCheck, Zap, HelpCircle, Save, Moon, Sun } from 'lucide-react'
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

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Toaster position="top-right" />
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="text-primary-500" />
          Настройки
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Управление аккаунтом, лицензиями и параметрами AI</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User size={80} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shadow-sm border border-primary-200 dark:border-primary-800">
                <User size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{user?.email}</h3>
              <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-wider mt-1">Преподаватель</p>
              
              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Тариф:</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 uppercase">{user?.plan}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Генераций:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user?.generations || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
            <HelpCircle className="mb-4 opacity-50" size={32} />
            <h3 className="text-xl font-bold mb-2">Нужна помощь?</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Если у вас возникли вопросы или проблемы, напишите в нашу поддержку.</p>
            <button className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              Написать нам
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="md:col-span-2 space-y-8">
          {/* License Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Лицензирование</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ключ активации</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={settings.licenseKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, licenseKey: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    placeholder="ABC-123-XYZ"
                  />
                  <button 
                    onClick={handleValidateLicense}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    Активировать
                  </button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                  <HelpCircle size={12} />
                  Введите ключ, полученный при покупке подписки
                </p>
              </div>
            </div>
          </section>

          {/* Pricing Plans Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                <Zap size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Тарифные планы</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  name: 'FREE', 
                  price: '0₽', 
                  features: ['5 генераций в день', 'Базовые модели', 'Экспорт в TXT'],
                  current: user?.plan === 'free'
                },
                { 
                  name: 'BASIC', 
                  price: '490₽', 
                  features: ['50 генераций в день', 'Улучшенные модели', 'Экспорт PDF/DOCX'],
                  current: user?.plan === 'basic'
                },
                { 
                  name: 'PRO', 
                  price: '990₽', 
                  features: ['Безлимит', 'Самые мощные модели', 'Приоритетная поддержка'],
                  current: user?.plan === 'pro'
                }
              ].map((plan) => (
                <div key={plan.name} className={`p-5 rounded-2xl border ${plan.current ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${plan.current ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {plan.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Interface Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Layout size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Интерфейс</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Тема оформления</h3>
                <p className="text-xs text-slate-500">Выберите светлую или темную тему</p>
              </div>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button 
                  onClick={() => handleSaveSetting('theme', 'light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Sun size={14} />
                  Светлая
                </button>
                <button 
                  onClick={() => handleSaveSetting('theme', 'dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  <Moon size={14} />
                  Темная
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Settings
