const { contextBridge, ipcRenderer } = require('electron');

// 建立渲染进程与主进程的安全桥梁
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 数据库初始化与测试
   */
  setupDB: (config) => ipcRenderer.invoke('setup-db', config),

  /**
   * 执行数据库查询
   */
  query: (sql, params = []) => ipcRenderer.invoke('db-query', { sql, params }),
  
  /**
   * 登录验证
   */
  login: (username, password) => ipcRenderer.invoke('auth-login', { username, password }),

  /**
   * 调起原生对话框并上传文件
   */
  uploadFile: (personId, type, customDate) => ipcRenderer.invoke('file-upload', { personId, type, customDate }),

  /**
   * 下载/另存为中心库文件
   */
  downloadFile: (sourcePath, fileName) => ipcRenderer.invoke('file-save', { sourcePath, fileName }),
});