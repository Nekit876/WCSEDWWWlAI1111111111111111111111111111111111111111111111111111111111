import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { app } from 'electron'

const execPromise = util.promisify(exec)
const gitPath = 'C:\\Program Files\\Git\\cmd\\git.exe'
const projectRoot = app.getAppPath()

export async function syncPull() {
  try {
    await execPromise(`"${gitPath}" pull origin main`, { cwd: projectRoot })
    return { ok: true }
  } catch (err) {
    console.error('Git Pull Error:', err)
    return { ok: false, error: err.message }
  }
}

export async function syncPush(message = 'Auto-sync from app') {
  try {
    // 1. Add everything (including db.json if it's there)
    await execPromise(`"${gitPath}" add .`, { cwd: projectRoot })
    
    // 2. Commit (ignore if nothing to commit)
    try {
      await execPromise(`"${gitPath}" commit -m "${message}"`, { cwd: projectRoot })
    } catch (commitErr) {
      if (commitErr.stdout && commitErr.stdout.includes('nothing to commit')) {
        return { ok: true, message: 'Nothing to sync' }
      }
    }
    
    // 3. Push
    await execPromise(`"${gitPath}" push origin main`, { cwd: projectRoot })
    return { ok: true }
  } catch (err) {
    console.error('Git Push Error:', err)
    return { ok: false, error: err.message }
  }
}
