import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { Sparkles, FileText, Download, Copy, RefreshCcw, Send, FileJson, FileType, CheckCircle, ChevronDown, Settings, GraduationCap, MessageSquare, BookOpen, Layers, Zap, Clock, Save, Edit3, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Dashboard = () => {
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [difficulty, setDifficulty] = useState('middle')
  const [count, setCount] = useState(10)
  const [type, setType] = useState('test')
  const [includeAnswers, setIncludeAnswers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingQuestions, setEditingQuestions] = useState([])
  const [streamData, setStreamData] = useState('')

  useEffect(() => {
    window.api.onAIStream((delta) => {
      setStreamData(prev => prev + delta)
    })
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setStreamData('')
    setEditingIndex(null)
    
    try {
      const res = await window.api.generate({ topic, subject, grade, difficulty, count, type, includeAnswers })
      if (res.ok) {
        setResult(res.data)
        setEditingQuestions([...res.data.output.questions])
        toast.success('Тест успешно сгенерирован!')
      } else {
        toast.error(res.error || 'Ошибка генерации')
      }
    } catch (err) {
      toast.error('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...editingQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setEditingQuestions(updated)
  }

  const handleUpdateOption = (qIndex, optIndex, value) => {
    const updated = [...editingQuestions]
    const opts = [...updated[qIndex].options]
    opts[optIndex] = value
    updated[qIndex] = { ...updated[qIndex], options: opts }
    setEditingQuestions(updated)
  }

  const handleSaveEdits = () => {
    setResult(prev => ({
      ...prev,
      output: { ...prev.output, questions: editingQuestions }
    }))
    setEditingIndex(null)
    toast.success('Изменения сохранены')
  }

  const handleDeleteQuestion = (index) => {
    const updated = editingQuestions.filter((_, i) => i !== index)
    setEditingQuestions(updated)
    setResult(prev => ({
      ...prev,
      output: { ...prev.output, questions: updated }
    }))
    toast.success('Вопрос удален')
  }

  const formatContentForExport = (data, isTeacherVersion = true) => {
    const showAnswers = isTeacherVersion;
    let text = `Тест по теме: ${data.input.topic}\n`
    text += `Предмет: ${data.input.subject}\n`
    text += `Сложность: ${data.input.difficulty}\n\n`
    
    data.output.questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, j) => {
          text += `   ${String.fromCharCode(97 + j)}) ${opt}\n`
        })
      }
      if (showAnswers) {
        text += `   Правильный ответ: ${q.answer}\n`
        if (q.explanation) text += `   Пояснение: ${q.explanation}\n`
      }
      text += '\n'
    })
    return text
  }

  const handleExport = async (format, mode) => {
    if (!result) return
    const content = formatContentForExport(result, mode !== 'student')
    const fileName = `test_${result.input.topic.replace(/\s+/g, '_')}_${mode}`
    
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              SchoolAI <span className="text-primary-600">Gen</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg ml-1">
            Создавайте профессиональные тесты за считанные секунды
          </p>
        </div>
        
        {result && (
          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
            <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Вопросов</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{result.output.questions.length}</span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Сложность</span>
              <span className={`text-sm font-black uppercase ${
                result.input.difficulty === 'hard' ? 'text-red-500' :
                result.input.difficulty === 'middle' ? 'text-amber-500' : 'text-green-500'
              }`}>{result.input.difficulty}</span>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Configuration Panel */}
        <div className="lg:col-span-4 sticky top-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 to-indigo-600"></div>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 shadow-sm">
                <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Параметры</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                  <BookOpen size={14} className="text-primary-500" />
                  Предмет и тема
                </label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all dark:text-white font-bold placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Предмет (напр: Физика)"
                      required
                    />
                  </div>
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all dark:text-white font-bold placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Тема теста (напр: Гравитация)"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    <Layers size={14} className="text-indigo-500" />
                    Уровень
                  </label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 appearance-none dark:text-white font-bold transition-all"
                    >
                      <option value="easy">Легкая</option>
                      <option value="middle">Средняя</option>
                      <option value="hard">Сложная</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    <Zap size={14} className="text-amber-500" />
                    Вопросы
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-black text-center transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 block">Тип заданий</label>
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[24px] border border-slate-100 dark:border-slate-700">
                  {[
                    { id: 'test', label: 'Тест', icon: CheckCircle, color: 'text-primary-500' },
                    { id: 'open', label: 'Открытый', icon: MessageSquare, color: 'text-indigo-500' },
                    { id: 'mix', label: 'Микс', icon: RefreshCcw, color: 'text-amber-500' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] transition-all duration-500 ${
                        type === t.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-600 scale-[1.05]'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <t.icon size={20} className={type === t.id ? t.color : ''} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-[28px] group/toggle hover:border-primary-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${includeAnswers ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Ответы</h3>
                    <p className="text-[10px] text-slate-400 font-medium">С пояснениями</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeAnswers(!includeAnswers)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${includeAnswers ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${includeAnswers ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-[28px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 bg-[length:200%_auto] animate-gradient transition-all duration-500 group-hover:scale-105"></div>
                <div className="relative flex items-center justify-center gap-4 py-6 px-8 text-white font-black text-sm uppercase tracking-[0.2em]">
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles size={20} className="animate-pulse" />
                      <span>Сгенерировать</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right: Results Preview Panel */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/20 dark:shadow-none overflow-hidden flex flex-col min-h-[850px] relative"
          >
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]'}`}></div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em]">Предпросмотр</span>
              </div>
              
              {result && (
                <div className="flex items-center gap-4">
                   <div className="relative group/download">
                    <button className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-[22px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                      <Download size={16} />
                      Экспорт
                      <ChevronDown size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover/download:opacity-100 group-hover/download:visible transition-all z-30 overflow-hidden translate-y-4 group-hover/download:translate-y-0 p-3">
                      {['txt', 'pdf', 'docx'].map(fmt => (
                        <div key={fmt} className="mb-2 last:mb-0">
                          <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{fmt} формат</div>
                          <div className="grid grid-cols-1 gap-1">
                            <button onClick={() => handleExport(fmt, 'teacher')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between group/item">
                              Для учителя
                              <div className="w-2 h-2 rounded-full bg-primary-500 scale-0 group-hover/item:scale-100 transition-transform"></div>
                            </button>
                            <button onClick={() => handleExport(fmt, 'student')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between group/item">
                              Для ученика
                              <div className="w-2 h-2 rounded-full bg-indigo-500 scale-0 group-hover/item:scale-100 transition-transform"></div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-12 overflow-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20">
              <AnimatePresence mode="wait">
                {!loading && !result && !streamData && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full animate-pulse-slow"></div>
                      <div className="relative bg-white dark:bg-slate-800 p-10 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-700 transform hover:scale-110 transition-transform duration-500 cursor-default">
                        <Sparkles size={64} className="text-primary-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Интеллект готов</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-lg max-w-[420px] mx-auto leading-relaxed font-medium">
                        Укажите параметры теста в левой панели, и наш AI создаст уникальные задания для ваших учеников.
                      </p>
                    </div>
                    <div className="flex gap-4 opacity-50">
                       <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <Clock size={12} /> Экономия времени
                       </div>
                       <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <CheckCircle size={12} /> Точность данных
                       </div>
                    </div>
                  </motion.div>
                )}

                {(loading || streamData) && !result && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="max-w-4xl mx-auto"
                  >
                    <div className="flex items-center gap-6 mb-12">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ 
                              height: [12, 32, 12], 
                              opacity: [0.4, 1, 0.4],
                              backgroundColor: i % 2 === 0 ? '#4F46E5' : '#818CF8'
                            }}
                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                            className="w-1.5 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-black text-primary-500 uppercase tracking-[0.4em] animate-pulse">Генерация...</span>
                    </div>
                    <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-serif leading-relaxed text-xl bg-white/80 dark:bg-slate-900/80 p-12 rounded-[56px] border border-white dark:border-slate-800 shadow-2xl italic relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-primary-500/20"></div>
                      {streamData || "Собираем лучшие вопросы для вашего предмета..."}
                    </div>
                  </motion.div>
                )}

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12 pb-20"
                  >
                    <div className="relative group/title inline-block">
                      <div className="absolute -inset-4 bg-primary-500/5 rounded-3xl opacity-0 group-hover/title:opacity-100 transition-opacity"></div>
                      <div className="relative space-y-3">
                        <span className="text-xs font-black text-primary-500 uppercase tracking-[0.5em] block ml-1">{result.input.subject}</span>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{result.input.topic}</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {editingQuestions.map((q, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`group relative bg-white dark:bg-slate-900 p-10 rounded-[40px] border transition-all duration-500 ${
                            editingIndex === i 
                              ? 'border-primary-500 shadow-2xl shadow-primary-500/10 ring-4 ring-primary-500/5' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none'
                          }`}
                        >
                          <div className="absolute -left-5 top-10 flex flex-col gap-2">
                             <div className="w-10 h-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">
                               {i + 1}
                             </div>
                          </div>

                          <div className="absolute right-6 top-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingIndex === i ? (
                              <button onClick={handleSaveEdits} className="p-3 bg-green-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                                <Save size={18} />
                              </button>
                            ) : (
                              <button onClick={() => setEditingIndex(i)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary-500 hover:text-white transition-all shadow-lg shadow-slate-200 dark:shadow-none">
                                <Edit3 size={18} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteQuestion(i)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-slate-200 dark:shadow-none">
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="space-y-8 pl-4">
                            {editingIndex === i ? (
                              <textarea
                                value={q.question}
                                onChange={(e) => handleUpdateQuestion(i, 'question', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/10 min-h-[120px] resize-none"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight pr-10">
                                {q.question}
                              </p>
                            )}
                            
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, j) => (
                                  <div key={j} className="relative group/opt">
                                    {editingIndex === i ? (
                                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-black text-primary-500 w-4 uppercase">{String.fromCharCode(97 + j)}</span>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateOption(i, j, e.target.value)}
                                          className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 group-hover/opt:bg-white dark:group-hover/opt:bg-slate-800 group-hover/opt:border-primary-500/30 transition-all duration-300">
                                        <div className="w-7 h-7 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase shadow-sm">
                                          {String.fromCharCode(97 + j)}
                                        </div>
                                        <span className="text-base text-slate-700 dark:text-slate-300 font-bold">{opt}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {result.input.includeAnswers !== false && (
                              <div className="relative mt-8 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-start gap-5">
                                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-3xl text-primary-600 dark:text-primary-400 shadow-inner">
                                    <CheckCircle size={24} />
                                  </div>
                                  <div className="space-y-2 flex-1">
                                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] block">Правильный ответ</span>
                                    {editingIndex === i ? (
                                      <input
                                        type="text"
                                        value={q.answer}
                                        onChange={(e) => handleUpdateQuestion(i, 'answer', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-bold text-slate-800 dark:text-white"
                                      />
                                    ) : (
                                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{q.answer}</p>
                                    )}
                                    {q.explanation && (
                                      <div className="mt-4 p-5 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 italic text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                        {editingIndex === i ? (
                                          <textarea
                                            value={q.explanation}
                                            onChange={(e) => handleUpdateQuestion(i, 'explanation', e.target.value)}
                                            className="w-full bg-transparent border-none outline-none resize-none min-h-[60px]"
                                          />
                                        ) : (
                                          q.explanation
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center pt-10"
                    >
                      <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-10 py-4 bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] rounded-full border border-slate-100 dark:border-slate-700 shadow-xl hover:text-primary-500 transition-all"
                      >
                        Вернуться к началу
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
