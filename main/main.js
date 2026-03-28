import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { URL } from 'url'
import { authenticate, registerUser, getProfile, logout } from '../services/auth.js'
import { checkLicenseAtStartup, validateLicenseKey, getCachedLicense } from '../services/license.js'
import { generateTest } from '../services/openrouter.js'
import { exportAsTxt, exportAsPdf, exportAsDocx } from '../services/exporter.js'
import { initStore, getDb, save, syncHistoryFromCloud, deleteHistoryFromCloud, toggleFavoriteInCloud } from '../services/store.js'
import { syncPull, syncPush } from '../services/gitSync.js'
import { setSetting, getSettings } from '../services/settings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let mainWindow

function resolveHtmlPath() {
  const devServer = process.env.VITE_DEV_SERVER
  if (devServer) return process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173'
  return path.join(__dirname, '../renderer/dist/index.html')
}

async function createWindow() {
  await initStore()
  
  // Пытаемся восстановить сессию
  const Store = (await import('electron-store')).default
  const electronStore = new Store({ name: 'secure' })
  const session = electronStore.get('supabase_session')
  const userEmail = session?.user?.email

  // Если сессия есть, устанавливаем её в supabase
  if (session) {
    const { supabase } = await import('../services/supabase.js')
    await supabase.auth.setSession(session)
  }

  // Запускаем синхронизацию в фоне, чтобы не блокировать создание окна
  syncHistoryFromCloud().catch(err => console.error('Background sync failed:', err))
  checkLicenseAtStartup(userEmail).catch(err => console.error('Background license check failed:', err))
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })
  mainWindow.setMenu(null) // Полностью удаляем меню
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  const url = resolveHtmlPath()
  
  const loadURL = async () => {
    try {
      if (typeof url === 'string' && url.startsWith('http')) {
        await mainWindow.loadURL(url)
      } else {
        await mainWindow.loadFile(url)
      }
    } catch (err) {
      if (process.env.VITE_DEV_SERVER) {
        console.log('Retrying loadURL in 1s...')
        setTimeout(loadURL, 1000)
      } else {
        console.error('Failed to load file:', url, err)
      }
    }
  }

  await loadURL()
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(async () => {
  await createWindow()
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

ipcMain.handle('auth:register', async (_e, payload) => {
  return await registerUser(payload.email, payload.password, payload.confirm)
})

ipcMain.handle('auth:login', async (_e, payload) => {
  const res = await authenticate(payload.email, payload.password)
  if (res.ok && res.user) {
    await checkLicenseAtStartup(res.user.email)
    // После логина сразу синхронизируем историю
    await syncHistoryFromCloud()
  }
  return res
})

ipcMain.handle('auth:profile', async (_e, token) => {
  return await getProfile(token)
})

ipcMain.handle('auth:logout', async (_e, token) => {
  const res = await logout(token)
  // Очищаем локальные данные при выходе
  const db = getDb()
  db.data.history = []
  db.data.settings.licenseKey = ''
  db.data.settings.plan = 'free'
  db.data.license = { key: '', type: 'free', expires: '', cachedAt: '' }
  await save()
  return res
})

ipcMain.handle('license:validate', async (_e, key) => {
  return await validateLicenseKey(key)
})

ipcMain.handle('license:refresh', async () => {
  const Store = (await import('electron-store')).default
  const electronStore = new Store({ name: 'secure' })
  const session = electronStore.get('supabase_session')
  const userEmail = session?.user?.email
  if (userEmail) {
    await checkLicenseAtStartup(userEmail)
  }
  return await getCachedLicense()
})

ipcMain.handle('license:get', async () => {
  return await getCachedLicense()
})

ipcMain.handle('settings:get', async () => {
  return await getSettings()
})

ipcMain.handle('settings:set', async (_e, payload) => {
  const res = await setSetting(payload.key, payload.value)
  // Синхронизируем изменения настроек на GitHub
  try {
    await syncPush(`Update setting: ${payload.key}`)
  } catch (err) {
    console.error('Settings sync failed:', err)
  }
  return res
})

ipcMain.handle('git:sync', async () => {
  try {
    const pull = await syncPull()
    const push = await syncPush('Manual sync from app')
    return { ok: true, pull, push }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('history:get', async () => {
  const db = getDb()
  return db.data.history
})

ipcMain.handle('history:delete', async (_e, id) => {
  const db = getDb()
  db.data.history = db.data.history.filter(item => item.id !== id)
  await save()
  await deleteHistoryFromCloud(id)
  return { ok: true }
})

ipcMain.handle('history:favorite', async (_e, { id, isFavorite }) => {
  const db = getDb()
  const item = db.data.history.find(h => h.id === id)
  if (item) {
    item.isFavorite = isFavorite
    await save()
    await toggleFavoriteInCloud(id, isFavorite)
  }
  return { ok: true }
})

ipcMain.handle('history:sync', async () => {
  await syncHistoryFromCloud()
  const db = getDb()
  return db.data.history
})

ipcMain.handle('ai:generate', async (_e, payload) => {
  return await generateTest(payload, (delta) => {
    mainWindow.webContents.send('ai:stream', delta)
  })
})

ipcMain.handle('export:txt', async (_e, { content, defaultPath }) => {
  const result = await dialog.showSaveDialog({ defaultPath, filters: [{ name: 'Text', extensions: ['txt'] }] })
  if (result.canceled || !result.filePath) return { ok: false }
  await exportAsTxt(result.filePath, content)
  return { ok: true, path: result.filePath }
})

ipcMain.handle('export:pdf', async (_e, { content, defaultPath }) => {
  const result = await dialog.showSaveDialog({ defaultPath, filters: [{ name: 'PDF', extensions: ['pdf'] }] })
  if (result.canceled || !result.filePath) return { ok: false }
  await exportAsPdf(result.filePath, content)
  return { ok: true, path: result.filePath }
})

ipcMain.handle('export:docx', async (_e, { content, defaultPath }) => {
  const result = await dialog.showSaveDialog({ defaultPath, filters: [{ name: 'Word', extensions: ['docx'] }] })
  if (result.canceled || !result.filePath) return { ok: false }
  await exportAsDocx(result.filePath, content)
  return { ok: true, path: result.filePath }
})
