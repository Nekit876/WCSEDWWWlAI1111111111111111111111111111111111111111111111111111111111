import axios from 'axios'
import { getDb, save } from './store.js'
import { getInfisicalSecret } from './infisical.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function choosePlan(type) {
  if (type === 'pro') return 'pro'
  if (type === 'basic') return 'basic'
  return 'free'
}

export async function checkLicenseAtStartup(userEmail) {
  const db = getDb()
  const lic = db.data.license
  const now = today()
  const url = db.data.settings.licenseUrl

  // 1. Сначала пробуем Infisical (License)
  const infisicalLicense = await getInfisicalSecret('License')
  if (infisicalLicense && userEmail) {
    // В Infisical лицензия может быть в формате JSON: { "licenses": [{ "email": "...", "type": "pro" }] }
    try {
      const data = JSON.parse(infisicalLicense)
      const list = data.licenses || []
      const found = list.find(l => l.email === userEmail)
      if (found && (!found.expires || found.expires >= now)) {
        db.data.settings.plan = choosePlan(found.type)
        db.data.license = { ...found, cachedAt: new Date().toISOString() }
        await save()
        return
      }
    } catch (err) {
      // Если это просто строка с ключом
      if (infisicalLicense === userEmail) {
        db.data.settings.plan = 'pro'
        db.data.license = { email: userEmail, type: 'pro', cachedAt: new Date().toISOString() }
        await save()
        return
      }
    }
  }

  // 2. Fallback на GitHub
  if (url && userEmail) {
    try {
      const res = await axios.get(url, { timeout: 5000 })
      const list = res.data && res.data.licenses ? res.data.licenses : []
      const found = list.find(l => l.email === userEmail)
      if (found) {
        if (!found.expires || found.expires >= now) {
          db.data.settings.plan = choosePlan(found.type)
          db.data.license = { ...found, cachedAt: new Date().toISOString() }
          await save()
          return
        }
      }
    } catch (err) {
      console.error('Remote license check failed:', err)
    }
  }

  // 2. Если по email не нашли, проверяем кэшированную лицензию
  if (lic && lic.key && (!lic.expires || lic.expires >= now)) {
    db.data.settings.plan = choosePlan(lic.type || 'free')
  } else {
    db.data.settings.plan = 'free'
  }
  
  if (db.data.settings.dailyUsage.date !== now) {
    db.data.settings.dailyUsage = { date: now, count: 0 }
  }
  await save()
}

export async function validateLicenseKey(key) {
  const db = getDb()
  const url = db.data.settings.licenseUrl
  if (!url) return { ok: false, error: 'URL лицензий не задан' }
  try {
    const res = await axios.get(url, { timeout: 8000 })
    const list = res.data && res.data.licenses ? res.data.licenses : []
    const found = list.find(l => l.key === key)
    if (!found) return { ok: false, error: 'Лицензия не найдена' }
    const now = today()
    if (found.expires && found.expires < now) return { ok: false, error: 'Лицензия просрочена' }
    db.data.license = { key: found.key, type: found.type || 'free', expires: found.expires || '', cachedAt: new Date().toISOString() }
    db.data.settings.licenseKey = found.key
    db.data.settings.plan = choosePlan(found.type)
    await save()
    return { ok: true, license: db.data.license, plan: db.data.settings.plan }
  } catch {
    return { ok: false, error: 'Не удалось проверить лицензию' }
  }
}

export async function getCachedLicense() {
  const db = getDb()
  return db.data.license
}

export function canGenerate() {
  const db = getDb()
  const plan = db.data.settings.plan || 'free'
  const usage = db.data.settings.dailyUsage || { date: '', count: 0 }
  const now = today()
  if (usage.date !== now) {
    db.data.settings.dailyUsage = { date: now, count: 0 }
  }
  if (plan === 'pro') return true
  if (plan === 'basic') return usage.count < 50
  return usage.count < 5
}

export async function bumpGenerationCount() {
  const db = getDb()
  const now = today()
  if (db.data.settings.dailyUsage.date !== now) {
    db.data.settings.dailyUsage = { date: now, count: 0 }
  }
  db.data.settings.dailyUsage.count += 1
  await save()
}
