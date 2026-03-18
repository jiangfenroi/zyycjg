
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setupDB: (config) => ipcRenderer.invoke('setup-db', config),
  query: (sql, params = []) => ipcRenderer.invoke('db-query', { sql, params }),
  login: (username, password) => ipcRenderer.invoke('auth-login', { username, password }),
  setTaskbarFlash: (flag) => ipcRenderer.invoke('set-flash', flag),
  uploadFile: (personId, type, customDate) => ipcRenderer.invoke('file-upload', { personId, type, customDate }),
  downloadFile: (sourcePath, fileName) => ipcRenderer.invoke('file-save', { sourcePath, fileName }),
});
