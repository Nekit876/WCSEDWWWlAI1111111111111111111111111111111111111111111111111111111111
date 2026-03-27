const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script (CJS) is running!')

try {
  contextBridge.exposeInMainWorld('api', {
    register: (email, password, confirm) => ipcRenderer.invoke('auth:register', { email, password, confirm }),
    login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
    profile: (token) => ipcRenderer.invoke('auth:profile', token),
    logout: (token) => ipcRenderer.invoke('auth:logout', token),
    validateLicense: (key) => ipcRenderer.invoke('license:validate', key),
    getLicense: () => ipcRenderer.invoke('license:get'),
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
    getHistory: () => ipcRenderer.invoke('history:get'),
    deleteHistory: (id) => ipcRenderer.invoke('history:delete', id),
    sync: () => ipcRenderer.invoke('git:sync'),
    generate: (payload) => ipcRenderer.invoke('ai:generate', payload),
    onAIStream: (cb) => {
      ipcRenderer.removeAllListeners('ai:stream')
      ipcRenderer.on('ai:stream', (_e, delta) => cb(delta))
    },
    exportTxt: (content, defaultPath) => ipcRenderer.invoke('export:txt', { content, defaultPath }),
    exportPdf: (content, defaultPath) => ipcRenderer.invoke('export:pdf', { content, defaultPath }),
    exportDocx: (content, defaultPath) => ipcRenderer.invoke('export:docx', { content, defaultPath })
  })
  console.log('API successfully exposed to window.api')
} catch (error) {
  console.error('Failed to expose API:', error)
}
