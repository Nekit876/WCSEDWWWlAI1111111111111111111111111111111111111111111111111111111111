import axios from 'axios'
import { getDb, save } from './store.js'
import { canGenerate, bumpGenerationCount } from './license.js'
import { getInfisicalSecret } from './infisical.js'

function buildPrompt({ topic, subject, difficulty, count, type, grade }) {
  let modeDesc = ''
  if (type === 'test') {
    modeDesc = 'ТОЛЬКО тестовые вопросы с вариантами ответов (4 варианта).'
  } else if (type === 'open') {
    modeDesc = 'ТОЛЬКО открытые вопросы (без вариантов ответов). Ученик должен сам написать ответ.'
  } else {
    modeDesc = 'СМЕШАННЫЙ формат (примерно половина вопросов с вариантами ответов, половина - открытые).'
  }

  const gradeText = grade ? `Целевая аудитория: ${grade} класс.` : '';
  
  return `Ты - профессиональный помощник учителя. Сгенерируй проверочную работу по теме "${topic}" по предмету "${subject}" на русском языке. 
Уровень сложности: ${difficulty}. 
Количество вопросов ровно: ${count}. 
ФОРМАТ ВОПРОСОВ: ${modeDesc}
${gradeText}

ОЧЕНЬ ВАЖНО: 
- НЕ используй LaTeX форматирование (типа $\\frac{...}{...}$).
- Пиши математические и физические формулы обычным текстом, используя символы верхнего индекса для степеней (², ³, ⁴, ⁵ и т.д.). Например: (x² - 9) / (x² - 6x + 9).
- НЕ используй знак ^ и НЕ пиши словами "в квадрате". Только символы: ², ³.

ОБЯЗАТЕЛЬНО верни ответ ТОЛЬКО в формате JSON со следующей структурой:
{
  "questions": [
    {
      "question": "Текст вопроса",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"], // ОСТАВЬ ПОЛЕ ПУСТЫМ МАССИВОМ [], ЕСЛИ ЭТО ОТКРЫТЫЙ ВОПРОС БЕЗ ВАРИАНТОВ
      "answer": "Правильный вариант (или подробный текстовый ответ для открытых вопросов)",
      "explanation": "Краткое решение и пояснение почему этот ответ правильный"
    }
  ]
}
Ничего не пиши, кроме JSON.`
}

async function getApiKey() {
  const db = getDb()
  
  // 1. Сначала пробуем Infisical (openrouter)
  console.log('Attempting to fetch API key from Infisical...');
  const infisicalKey = await getInfisicalSecret('openrouter')
  if (infisicalKey) {
    console.log('API key successfully fetched from Infisical');
    return infisicalKey;
  }
  console.log('Infisical API key fetch failed');

  // 2. Если в Infisical нет, пробуем старый GitHub (fallback)
  const url = db.data.settings.apiKeyUrl
  if (url) {
    console.log('Attempting to fetch API key from GitHub...');
    try {
      const res = await axios.get(url, { timeout: 8000 })
      const key = res.data?.apiKey || (typeof res.data === 'string' ? res.data : null)
      if (key) {
        console.log('API key successfully fetched from GitHub');
        return key
      }
    } catch (err) {
      console.error('Failed to fetch API key from GitHub:', err.message)
    }
  }
  
  // 3. Fallback на локальный ключ из настроек
  if (db.data.settings.userApiKey) {
    console.log('Using local API key from settings');
    return db.data.settings.userApiKey
  }
  
  console.error('No API key found in any source!');
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
    console.log('Generating test with model:', model);
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: 'Ты генератор тестов для учителей. Делай задания более ориентированными на старшую школу. Отвечай строго в формате JSON. Структура: {"questions": [{"question": "...", "options": ["...", "..."], "answer": "...", "explanation": "..."}]}' },
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
    console.log('OpenRouter response text:', text);
    
    onStream && onStream(text)
    let parsed
    try {
      // Очистка от markdown-блоков, если они есть
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleanText)
    } catch (err) {
      console.error('JSON Parse Error:', err.message, 'Text:', text);
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
  } catch (err) {
    console.error('OpenRouter Error:', err.response?.data || err.message)
    return { ok: false, error: `Ошибка OpenRouter: ${err.response?.data?.error?.message || err.message}` }
  }
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
