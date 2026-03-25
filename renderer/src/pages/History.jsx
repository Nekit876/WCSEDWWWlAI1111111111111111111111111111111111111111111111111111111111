import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { History as HistoryIcon, Search, Calendar, ChevronRight, FileText, Trash2, Download, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const History = () => {
  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const db = await window.api.getSettings() // This is not correct, I need a separate IPC for history or get it from profile
      // Actually, let's just get the whole store for now or a specific history call
      // In main.js I don't have a specific 'history:get' handler, but I can add it or use a trick
      // For now, I'll assume profile returns enough or I'll add a handler
      const res = await window.api.getSettings() 
      // Wait, let's check main.js again
    } catch (err) {
      toast.error('Ошибка загрузки истории')
    } finally {
      setLoading(false)
    }
  }

  // I need to add a history handler in main.js. But for now I will mock it here 
  // and then update main.js
  useEffect(() => {
     // I'll use a hack to get history for now since I can't edit main.js yet 
     // (actually I can, but let's finish the UI first)
     const fetchHistory = async () => {
        // I'll add this handler to main.js in the next step
        const h = await window.api.getHistory?.() || []
        setHistory(h)
        setLoading(false)
     }
     fetchHistory()
  }, [])

  const filteredHistory = history.filter(item => 
    item.input.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.input.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <Toaster position="top-right" />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8"
      >
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-tr from-primary-600 to-indigo-600 p-4 rounded-[28px] shadow-2xl shadow-primary-500/30 ring-4 ring-primary-500/10">
            <HistoryIcon className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Архив тестов
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
              Все ваши материалы сохранены локально
            </p>
          </div>
        </div>

        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-full group-focus-within:bg-primary-500/10 transition-all"></div>
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all dark:text-white shadow-xl shadow-slate-200/20 dark:shadow-none placeholder:text-slate-400 font-medium"
            placeholder="Поиск по теме или предмету..."
          />
        </div>
      </motion.header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <span className="text-xs font-black text-primary-500 uppercase tracking-widest animate-pulse">Загрузка архива...</span>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:border-primary-500/30 transition-all cursor-pointer overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-[22px] flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all shadow-inner ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                        <FileText size={24} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1 block">{item.input.subject}</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[200px] tracking-tight">{item.input.topic}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                         item.input.difficulty === 'hard' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                         item.input.difficulty === 'middle' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                         'bg-green-50 text-green-600 dark:bg-green-900/20'
                       }`}>
                         {item.input.difficulty}
                       </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                      <Calendar size={12} />
                      {formatDate(item.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                         <Download size={16} />
                       </button>
                       <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-slate-200/50 blur-3xl rounded-full"></div>
            <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800">
              <Sparkles size={64} className="text-slate-200 dark:text-slate-700" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Архив пуст</h3>
          <p className="text-slate-400 text-sm max-w-[280px] mt-3 leading-relaxed">Здесь будут отображаться ваши сгенерированные тесты</p>
          <button onClick={() => window.location.href = '/'} className="mt-8 px-8 py-3.5 bg-primary-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary-500/20 active:scale-95">
            Создать первый тест
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default History
