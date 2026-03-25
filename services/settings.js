import { getDb, save } from './store.js'

export async function getSettings() {
  const db = getDb()
  return db.data.settings
}

export async function setSetting(key, value) {
  const db = getDb()
  db.data.settings[key] = value
  await save()
  return db.data.settings
}
