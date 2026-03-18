
const { contextBridge, ipcRenderer } = require('electron');

// 建立渲染进程与主进程的安全桥梁
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 执行数据库查询
   * @param {string} sql SQL 语句
   * @param {any[]} params 参数
   */
  query: (sql, params = []) => ipcRenderer.invoke('db-query', { sql, params }),
  
  // 可以添加更多功能，如文件系统访问等
});
