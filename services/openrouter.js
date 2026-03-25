import axios from 'axios'
import { getDb, save } from './store.js'
import { canGenerate, bumpGenerationCount } from './license.js'
import { getInfisicalSecret } from './infisical.js'

function buildPrompt({ topic, subject, difficulty, count, type }) {
  const mode = type === 'test' ? 'тест с вариантами' : type === 'open' ? 'открытые вопросы' : 'смешанный формат'
  return `Сгенерируй тест по теме "${topic}" по предмету "${subject}" на русском языке. Сложность: ${difficulty}. Количество вопросов: ${count}. Формат: ${mode}. Верни JSON с полями: questions[], где каждый элемент содержит: question, options[] (если есть), answer, explanation.`
}

async function getApiKey() {
  const db = getDb()
  
  // 1. Сначала пробуем Infisical (open_key)
  const infisicalKey = await getInfisicalSecret('open_key')
  if (infisicalKey) return infisicalKey;

  // 2. Если в Infisical нет, пробуем старый GitHub (fallback)
  const url = db.data.settings.apiKeyUrl
  if (url) {
    try {
      const res = await axios.get(url, { timeout: 8000 })
      const key = res.data?.apiKey || (typeof res.data === 'string' ? res.data : null)
      if (key) return key
    } catch (err) {
      console.error('Failed to fetch API key from GitHub:', err.message)
    }
  }
  
  // 3. Fallback на локальный ключ из настроек
  if (db.data.settings.userApiKey) return db.data.settings.userApiKey
  
  return ''
}

export async function generateTest(payload, onStream) {
  const db = getDb()
  if (!canGenerate()) return { ok: false, error: 'Превышен лимит генераций для текущего тарифа' }
  const apiKey = await getApiKey()
  if (!apiKey) return { ok: false, error: 'API ключ не найден' }
  const prompt = buildPrompt(payload)
  const model = db.data.settings.model || 'openrouter/auto'
  try {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: 'Ты генератор тестов для учителей. Отвечай строго в формате JSON.' },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://schoolai.local',
        'X-Title': 'SchoolAI TestGen'
      },
      timeout: 60000
    })
    const text = res.data?.choices?.[0]?.message?.content || ''
    onStream && onStream(text)
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { questions: [] }
    }
    const record = {
      id: cryptoRandom(),
      input: payload,
      output: parsed,
      createdAt: new Date().toISOString()
    }
    db.data.history.unshift(record)
    await bumpGenerationCount()
    await save()
    return { ok: true, data: record }
  } catch {
    return { ok: false, error: 'Ошибка OpenRouter' }
  }
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
