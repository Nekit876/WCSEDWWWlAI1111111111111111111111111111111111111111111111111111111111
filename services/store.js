import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'

import { supabase } from './supabase.js'

let db

export async function syncHistoryFromCloud() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cloudHistory, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (cloudHistory) {
      // Объединяем локальную историю с облачной (по id или дате)
      const formattedCloud = cloudHistory.map(item => ({
        id: item.id,
        isFavorite: item.is_favorite || false,
        input: {
          topic: item.topic,
          subject: item.subject,
          grade: item.grade,
          difficulty: item.difficulty,
          type: item.type
        },
        output: { questions: item.questions },
        createdAt: item.created_at
      }))

      // Убираем дубликаты
      const localIds = new Set(db.data.history.map(h => h.id || h.createdAt))
      const newItems = formattedCloud.filter(item => !localIds.has(item.id || item.createdAt))
      
      // Обновляем существующие (например, если изменился статус избранного)
      db.data.history = db.data.history.map(localItem => {
        const cloudItem = formattedCloud.find(c => c.id === localItem.id)
        if (cloudItem) {
          return { ...localItem, isFavorite: cloudItem.isFavorite }
        }
        return localItem
      })

      db.data.history = [...newItems, ...db.data.history]
      await db.write()
    }
  } catch (err) {
    console.error('Failed to sync history from cloud:', err.message)
  }
}

export async function toggleFavoriteInCloud(id, isFavorite) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('history')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .eq('user_id', user.id)
  } catch (err) {
    console.error('Failed to toggle favorite in cloud:', err.message)
  }
}

export async function deleteHistoryFromCloud(id) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('history').delete().eq('id', id).eq('user_id', user.id)
  } catch (err) {
    console.error('Failed to delete history from cloud:', err.message)
  }
}

export async function initStore() {
  const dir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'db.json')
  const adapter = new JSONFile(file)
  db = new Low(adapter, {
    users: [],
    sessions: [],
    settings: {
      userApiKey: '',
      model: 'openrouter/auto',
      theme: 'light',
      licenseKey: '',
      plan: 'free',
      dailyUsage: { date: '', count: 0 },
      apiKeyUrl: 'https://raw.githubusercontent.com/Nekit876/WCSEDWWWlAI1111111111111111111111111111111111111111111111111111111111/refs/heads/main/keys.json',
      licenseUrl: 'https://raw.githubusercontent.com/Nekit876/WCSEDWWWlAI1111111111111111111111111111111111111111111111111111111111/refs/heads/main/licenses.json'
    },
    license: {
      key: '',
      type: 'free',
      expires: '',
      cachedAt: ''
    },
    history: []
  })
  await db.read()
  
  if (!db.data) {
    db.data = {
      users: [],
      sessions: [],
      settings: {
        userApiKey: '',
        model: 'openrouter/auto',
        theme: 'light',
        licenseKey: '',
        plan: 'free',
        dailyUsage: { date: '', count: 0 },
        apiKeyUrl: 'https://raw.githubusercontent.com/Nekit876/WCSEDWWWlAI1111111111111111111111111111111111111111111111111111111111/refs/heads/main/keys.json',
        licenseUrl: 'https://raw.githubusercontent.com/Nekit876/WCSEDWWWlAI1111111111111111111111111111111111111111111111111111111111/refs/heads/main/licenses.json'
      },
      license: {
        key: '',
        type: 'free', 
        expires: '',
        cachedAt: ''
      },
      history: []
    }
  }
  await db.write()
  return db
}

export function getDb() {
  return db
}

export async function save() {
  await db.write()
}
