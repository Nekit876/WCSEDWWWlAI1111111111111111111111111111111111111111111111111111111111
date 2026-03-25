import { supabase } from './supabase.js'
import Store from 'electron-store'
import { getDb } from './store.js'

const electronStore = new Store({ name: 'secure' })

export async function registerUser(email, password, confirm) {
  if (!email || !password || password !== confirm) return { ok: false, error: 'Некорректные данные' }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

export async function authenticate(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { ok: false, error: error.message }
  
  // Сохраняем сессию в electron-store для авто-логина
  if (data.session) {
    electronStore.set('supabase_session', data.session)
  }
  
  return { ok: true, token: data.session?.access_token, user: data.user }
}

export async function getProfile(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return { ok: false, error: 'Сессия недействительна' }
  
  const db = getDb()
  return { 
    ok: true, 
    profile: { 
      email: user.email, 
      plan: db.data.settings.plan || 'free', 
      generations: db.data.history.length 
    } 
  }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  electronStore.delete('supabase_session')
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function logout(token) {
  return await logoutUser()
}
