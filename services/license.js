import axios from 'axios'
import { getDb, save } from './store.js'
import { getInfisicalSecret } from './infisical.js'
import { supabase } from './supabase.js'

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

  // 1. Сначала пробуем Infisical (License и License_basic)
  const infisicalLicensePro = await getInfisicalSecret('License')
  const infisicalLicenseBasic = await getInfisicalSecret('License_basic')
  
  for (const [infisicalLicense, defaultPlan] of [[infisicalLicensePro, 'pro'], [infisicalLicenseBasic, 'basic']]) {
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
        // Если это просто строка с ключом (или email)
        if (infisicalLicense === userEmail) {
          // Для строк тоже считаем срок действия
          const durationMonths = defaultPlan === 'basic' ? 1 : 12;
          const expireDate = new Date();
          expireDate.setMonth(expireDate.getMonth() + durationMonths);
          const expires = expireDate.toISOString().slice(0, 10);
          
          db.data.settings.plan = defaultPlan
          db.data.license = { email: userEmail, type: defaultPlan, expires: expires, cachedAt: new Date().toISOString() }
          await save()
          return
        }
      }
    }
  }

  // 2. Fallback на Supabase (проверяем, есть ли лицензия в профиле)
  if (userEmail) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan, license_expires')
        .eq('email', userEmail)
        .single()
        
      if (!error && profile && profile.plan) {
        if (!profile.license_expires || profile.license_expires >= now) {
          db.data.settings.plan = choosePlan(profile.plan)
          db.data.license = { email: userEmail, type: profile.plan, expires: profile.license_expires, cachedAt: new Date().toISOString() }
          await save()
          return
        }
      }
    } catch (err) {
      console.error('Supabase license check failed:', err)
    }
  }

  // 3. Fallback на GitHub (legacy)
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
  const now = today()

  // Обработка специального ключа "0" для сброса до тарифа Free
  if (key === '0') {
    db.data.license = { key: '', type: 'free', expires: '', cachedAt: new Date().toISOString() }
    db.data.settings.licenseKey = ''
    db.data.settings.plan = 'free'
    await save()
    await saveLicenseToSupabase(db.data.license)
    return { ok: true, license: db.data.license, plan: db.data.settings.plan }
  }

  // Проверяем ключ через Infisical
  const infisicalLicensePro = await getInfisicalSecret('License')
  const infisicalLicenseBasic = await getInfisicalSecret('License_basic')

  // Сначала проверяем точное совпадение ключа со строками из Infisical
  if (key === infisicalLicenseBasic) {
     const expireDate = new Date();
     expireDate.setMonth(expireDate.getMonth() + 1); // Basic на 1 месяц
     const expires = expireDate.toISOString().slice(0, 10);
     
     db.data.license = { key: key, type: 'basic', expires: expires, cachedAt: new Date().toISOString() }
     db.data.settings.licenseKey = key
     db.data.settings.plan = 'basic'
     await save()
     await saveLicenseToSupabase(db.data.license)
     return { ok: true, license: db.data.license, plan: db.data.settings.plan }
  }

  if (key === infisicalLicensePro) {
     const expireDate = new Date();
     expireDate.setMonth(expireDate.getMonth() + 12); // Pro на 1 год
     const expires = expireDate.toISOString().slice(0, 10);
     
     db.data.license = { key: key, type: 'pro', expires: expires, cachedAt: new Date().toISOString() }
     db.data.settings.licenseKey = key
     db.data.settings.plan = 'pro'
     await save()
     await saveLicenseToSupabase(db.data.license)
     return { ok: true, license: db.data.license, plan: db.data.settings.plan }
  }

  // Если это не прямые строки, пробуем распарсить JSON, если он там есть
  for (const [infisicalLicense, defaultPlan] of [[infisicalLicensePro, 'pro'], [infisicalLicenseBasic, 'basic']]) {
    if (infisicalLicense) {
      try {
        const data = JSON.parse(infisicalLicense)
        const list = data.licenses || []
        const found = list.find(l => l.key === key)
        if (found) {
           if (found.expires && found.expires < now) return { ok: false, error: 'Лицензия просрочена' }
           
           db.data.license = { key: found.key, type: found.type || defaultPlan, expires: found.expires || '', cachedAt: new Date().toISOString() }
           db.data.settings.licenseKey = found.key
           db.data.settings.plan = choosePlan(found.type || defaultPlan)
           await save()
           await saveLicenseToSupabase(db.data.license)
           return { ok: true, license: db.data.license, plan: db.data.settings.plan }
        }
      } catch (err) {
        // Игнорируем ошибку парсинга JSON, так как мы уже проверили прямое совпадение строк выше
      }
    }
  }

  return { ok: false, error: 'Лицензия не найдена' }
}

async function saveLicenseToSupabase(licenseData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email,
          plan: licenseData.type,
          license_expires: licenseData.expires,
          updated_at: new Date().toISOString()
        })
    }
  } catch (e) {
    console.error('Failed to sync license to Supabase:', e)
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
