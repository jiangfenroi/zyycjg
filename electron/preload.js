
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setupDB: (config) => ipcRenderer.invoke('setup-db', config),
  query: (sql, params = []) => ipcRenderer.invoke('db-query', { sql, params }),
  login: (username, password) => ipcRenderer.invoke('auth-login', { username, password }),
  log: (level, message) => ipcRenderer.invoke('app-log', { level, message }),
  uploadFile: (personId, type, customDate, storagePath) => ipcRenderer.invoke('file-upload', { personId, type, customDate, storagePath }),
  downloadFile: (sourcePath, fileName) => ipcRenderer.invoke('file-save', { sourcePath, fileName }),
  deleteFile: (filePath) => ipcRenderer.invoke('file-delete', { filePath }),
});
