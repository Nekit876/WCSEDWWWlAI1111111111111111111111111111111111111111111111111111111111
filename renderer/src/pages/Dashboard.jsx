import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { Sparkles, FileText, Download, Copy, RefreshCcw, Send, FileJson, FileType, CheckCircle, ChevronDown, Settings, GraduationCap, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Dashboard = () => {
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState('middle')
  const [count, setCount] = useState(10)
  const [type, setType] = useState('test')
  const [includeAnswers, setIncludeAnswers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
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
    
    try {
      const res = await window.api.generate({ topic, subject, difficulty, count, type, includeAnswers })
      if (res.ok) {
        setResult(res.data)
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

  const formatContentForExport = (data, userWantsAnswers = true) => {
    // Приоритет: если пользователь в форме отключил ответы, то в экспорте их тоже не будет
    const showAnswers = data.input.includeAnswers !== false && userWantsAnswers;
    
    let text = `Тест по теме: ${data.input.topic}\nПредмет: ${data.input.subject}\nСложность: ${data.input.difficulty}\n\n`
    data.output.questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`
      if (q.options) {
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
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-right" />
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Sparkles className="text-primary-500" />
          Генератор тестов
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Создавайте уникальные проверочные материалы за считанные секунды</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/20 dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-primary-500/10 rounded-2xl text-primary-600 dark:text-primary-400">
                <Settings size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Настройки</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Тема теста</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white placeholder:text-slate-400"
                    placeholder="Напр: Законы Ньютона"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Предмет</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white placeholder:text-slate-400"
                    placeholder="Напр: Физика"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Сложность</label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none dark:text-white font-medium"
                    >
                      <option value="easy">Легкая</option>
                      <option value="middle">Средняя</option>
                      <option value="hard">Сложная</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Вопросов</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white font-medium text-center"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Формат теста</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[18px]">
                  {[
                    { id: 'test', label: 'Тест', icon: CheckCircle },
                    { id: 'open', label: 'Ответ', icon: MessageSquare },
                    { id: 'mix', label: 'Микс', icon: RefreshCcw }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-[14px] transition-all duration-300 ${
                        type === t.id
                          ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <t.icon size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">С ответами</h3>
                  <p className="text-[9px] text-slate-400">Включить пояснения</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeAnswers(!includeAnswers)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${includeAnswers ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeAnswers ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 transition-all duration-300 group-hover:scale-105"></div>
                <div className="relative flex items-center justify-center gap-3 py-5 px-6 text-white font-black text-sm uppercase tracking-widest">
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles size={18} className="animate-pulse" />
                      <span>Создать тест</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          </motion.div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/20 dark:shadow-none overflow-hidden flex flex-col min-h-[700px]"
          >
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-800/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Результат</span>
              </div>
              
              {result && (
                <div className="flex items-center gap-3">
                   <div className="relative group">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-lg shadow-slate-900/10">
                      <Download size={14} />
                      Скачать
                      <ChevronDown size={14} />
                    </button>
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden translate-y-2 group-hover:translate-y-0">
                      {['txt', 'pdf', 'docx'].map(fmt => (
                        <div key={fmt} className="p-2 border-b last:border-0 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                          <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{fmt} формат</div>
                          <button onClick={() => handleExport(fmt, 'teacher')} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group/item">
                            Для учителя
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                          </button>
                          <button onClick={() => handleExport(fmt, 'student')} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group/item">
                            Для ученика
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-10 overflow-auto custom-scrollbar bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-950/30">
              <AnimatePresence mode="wait">
                {!loading && !result && !streamData && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-700">
                        <Sparkles size={48} className="text-primary-500 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Готов к работе</h3>
                      <p className="text-slate-400 text-sm max-w-[320px] mt-3 leading-relaxed">Настройте параметры слева и нажмите кнопку создания, чтобы начать магию AI</p>
                    </div>
                  </motion.div>
                )}

                {(loading || streamData) && !result && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="max-w-none"
                  >
                    <div className="flex items-center gap-4 mb-10">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                            className="w-1 h-4 bg-primary-500 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-black text-primary-500 uppercase tracking-widest">Нейросеть генерирует контент...</span>
                    </div>
                    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-serif leading-relaxed text-lg bg-white/50 dark:bg-slate-800/40 p-10 rounded-[40px] border border-white dark:border-slate-700/50 shadow-xl italic">
                      {streamData || "Начинаем обработку запроса..."}
                    </div>
                  </motion.div>
                )}

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-2 mb-12 border-b pb-8 border-slate-100 dark:border-slate-800">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{result.input.topic}</h2>
                      <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                        <span>{result.input.subject}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span>{result.input.difficulty}</span>
                      </div>
                    </div>

                    <div className="space-y-10">
                      {result.output.questions.map((q, i) => (
                        <div key={i} className="group">
                          <div className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg flex items-center justify-center font-bold text-sm">
                              {i + 1}
                            </span>
                            <div className="space-y-4 pt-1 flex-1">
                              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                {q.question}
                              </p>
                              
                              {q.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options.map((opt, j) => (
                                    <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">{String.fromCharCode(97 + j)}</span>
                                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {result.input.includeAnswers !== false && (
                                <div className="bg-primary-50/50 dark:bg-primary-900/10 border-l-4 border-primary-500 p-4 rounded-r-xl mt-4">
                                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-black uppercase mb-1 tracking-widest">
                                    <CheckCircle size={14} />
                                    Правильный ответ
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{q.answer}</p>
                                  {q.explanation && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic">
                                      {q.explanation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
