import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'

let db

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
