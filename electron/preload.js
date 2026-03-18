
const { contextBridge, ipcRenderer } = require('electron');

// 建立渲染进程与主进程的安全桥梁
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 执行数据库查询
   */
  query: (sql, params = []) => ipcRenderer.invoke('db-query', { sql, params }),
  
  /**
   * 调起原生对话框并上传文件
   * @param {string} personId 关联患者ID
   * @param {string} type 报告类型
   */
  uploadFile: (personId, type) => ipcRenderer.invoke('file-upload', { personId, type }),
});
