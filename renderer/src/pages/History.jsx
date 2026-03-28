import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { History as HistoryIcon, Search, Calendar, ChevronRight, FileText, Trash2, Download, Sparkles, ChevronDown, CheckCircle, RefreshCcw, Star, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const History = () => {
  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [showAnswersId, setShowAnswersId] = useState(null)
  const [filterFavorite, setFilterFavorite] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const h = await window.api.getHistory() || []
      setHistory(h)
    } catch (err) {
      toast.error('Ошибка загрузки истории')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const h = await window.api.syncHistory()
      setHistory(h || [])
      toast.success('Синхронизация завершена')
    } catch (err) {
      toast.error('Ошибка синхронизации')
    } finally {
      setSyncing(false)
    }
  }

  const handleToggleFavorite = async (id, currentStatus, e) => {
    e.stopPropagation()
    try {
      await window.api.favoriteHistory(id, !currentStatus)
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: !currentStatus } : item
      ))
      toast.success(!currentStatus ? 'Добавлено в избранное' : 'Удалено из избранного')
    } catch (err) {
      toast.error('Ошибка')
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await window.api.deleteHistory(id)
      setHistory(prev => prev.filter(item => item.id !== id))
      toast.success('Удалено')
    } catch (err) {
      toast.error('Ошибка удаления')
    }
  }

  const formatContentForExport = (data, isTeacherVersion = true) => {
    // В версии учителя всегда показываем ответы, независимо от настроек генерации
    const showAnswers = isTeacherVersion;
    
    let text = `Тест по теме: ${data.input.topic}\n\n`
    data.output.questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, j) => {
          text += `   ${String.fromCharCode(97 + j)}) ${opt}\n`
        })
      }
      if (showAnswers) {
        text += `   Ответ: ${q.answer}\n`
        if (q.explanation) text += `   Пояснение: ${q.explanation}\n`
      }
      text += '\n'
    })
    return text
  }

  const handleExport = async (item, format, mode, e) => {
    e.stopPropagation()
    const content = formatContentForExport(item, mode !== 'student')
    const fileName = `test_${item.input.topic.replace(/\s+/g, '_')}_${mode}`
    
    try {
      let res
      if (format === 'txt') res = await window.api.exportTxt(content, fileName + '.txt')
      if (format === 'pdf') res = await window.api.exportPdf(content, fileName + '.pdf')
      if (format === 'docx') res = await window.api.exportDocx(content, fileName + '.docx')
      
      if (res?.ok) toast.success('Файл успешно сохранен')
    } catch (err) {
      toast.error('Ошибка при сохранении')
    }
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.input.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.input.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFavorite = filterFavorite ? item.isFavorite : true
    return matchesSearch && matchesFavorite
  })

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10"
      >
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white dark:bg-slate-900 p-5 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800">
              <HistoryIcon className="text-primary-600 w-10 h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Архив <span className="text-slate-400 font-light">тестов</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Синхронизировано</span>
              </div>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${
                  syncing 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 animate-pulse' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-600'
                }`}
              >
                <RefreshCcw size={12} className={syncing ? 'animate-spin' : ''} />
                Обновить
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-widest transition-all border shadow-lg ${
              filterFavorite 
                ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/20' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary-500/50 shadow-slate-200/50 dark:shadow-none'
            }`}
          >
            <Star size={16} fill={filterFavorite ? "currentColor" : "none"} />
            Избранное
          </button>
          
          <div className="relative w-full lg:w-[400px] group">
            <div className="absolute inset-0 bg-primary-500/5 blur-3xl rounded-full group-focus-within:bg-primary-500/10 transition-all"></div>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-[32px] outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all dark:text-white shadow-2xl shadow-slate-200/20 dark:shadow-none placeholder:text-slate-400 font-bold text-sm"
              placeholder="Поиск по теме или предмету..."
            />
          </div>
        </div>
      </motion.header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs font-black text-primary-500 uppercase tracking-[0.4em] animate-pulse">Загрузка архива...</span>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
          <AnimatePresence>
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                className={`group relative bg-white dark:bg-slate-900 p-10 rounded-[48px] border transition-all duration-500 overflow-hidden ${
                  expandedId === item.id 
                    ? 'md:col-span-2 border-primary-500/30 shadow-2xl shadow-primary-500/5' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-primary-500/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none cursor-pointer'
                }`}
                onClick={() => expandedId !== item.id && setExpandedId(item.id)}
              >
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] group-hover:bg-primary-500/10 transition-colors pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-500 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <FileText size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {item.input.subject}
                          </span>
                          {item.input.grade && (
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                              {item.input.grade} класс
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1" title={item.input.topic}>
                          {item.input.topic}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                       <div className="flex items-center gap-3">
                         <button
                           onClick={(e) => handleToggleFavorite(item.id, item.isFavorite, e)}
                           className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                             item.isFavorite 
                               ? 'text-amber-500 bg-amber-50 border-amber-100 shadow-lg shadow-amber-500/10' 
                               : 'text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:text-amber-500 hover:border-amber-200'
                           }`}
                         >
                           <Star size={20} fill={item.isFavorite ? "currentColor" : "none"} />
                         </button>
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                           item.input.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/30' :
                           item.input.difficulty === 'middle' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30' :
                           'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800/30'
                         }`}>
                           {item.input.difficulty}
                         </span>
                       </div>
                       {expandedId === item.id && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setExpandedId(null); setShowAnswersId(null); }}
                           className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                         >
                           Закрыть
                         </button>
                       )}
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen size={20} className="text-primary-500" />
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Задания ({item.output?.questions?.length || 0})</h4>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowAnswersId(showAnswersId === item.id ? null : item.id); }}
                          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl transition-all ${
                            showAnswersId === item.id 
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                              : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 hover:bg-primary-100'
                          }`}
                        >
                          <CheckCircle size={14} />
                          {showAnswersId === item.id ? 'Скрыть ответы' : 'Показать ответы'}
                        </button>
                      </div>
                      
                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {item.output?.questions?.map((q, i) => (
                          <div key={i} className="group/q relative p-8 rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 hover:border-primary-500/20 transition-all">
                            <div className="flex gap-6">
                              <span className="flex-shrink-0 w-8 h-8 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center font-black text-xs text-slate-400 shadow-sm border border-slate-100 dark:border-slate-600">
                                {i + 1}
                              </span>
                              <div className="space-y-4 flex-1">
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-snug whitespace-pre-wrap">
                                  {q.question}
                                </p>
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt, j) => (
                                      <div key={j} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] font-black text-primary-500 uppercase">{String.fromCharCode(97 + j)}</span>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {showAnswersId === item.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-6 bg-primary-500/5 dark:bg-primary-500/10 border-l-4 border-primary-500 rounded-r-2xl"
                                  >
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest mb-2">
                                      <CheckCircle size={14} /> Ответ
                                    </div>
                                    <p className="font-black text-slate-800 dark:text-slate-100">{q.answer}</p>
                                    {q.explanation && (
                                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-primary-500/10 pt-3">
                                        {q.explanation}
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                           <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400">
                             <Calendar size={18} />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Создано</span>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(item.createdAt)}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative group/export flex-1 sm:flex-none">
                            <button className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-3xl hover:scale-105 transition-all shadow-xl active:scale-95">
                              <Download size={16} />
                              Экспорт
                              <ChevronDown size={16} />
                            </button>
                            <div className="absolute right-0 bottom-full mb-4 w-64 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-30 overflow-hidden p-3 translate-y-4 group-hover/export:translate-y-0">
                              {['txt', 'pdf', 'docx'].map(fmt => (
                                <div key={fmt} className="mb-2 last:mb-0">
                                  <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{fmt} формат</div>
                                  <div className="grid grid-cols-1 gap-1">
                                    <button onClick={(e) => handleExport(item, fmt, 'teacher', e)} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between group/item">
                                      Для учителя
                                      <div className="w-2 h-2 rounded-full bg-primary-500 scale-0 group-hover/item:scale-100 transition-transform"></div>
                                    </button>
                                    <button onClick={(e) => handleExport(item, fmt, 'student', e)} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between group/item">
                                      Для ученика
                                      <div className="w-2 h-2 rounded-full bg-indigo-500 scale-0 group-hover/item:scale-100 transition-transform"></div>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-3xl transition-all duration-300 border border-red-100 font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/5 active:scale-95"
                          >
                            <Trash2 size={16} />
                            Удалить
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
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
