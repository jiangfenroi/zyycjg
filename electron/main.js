
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mysql = require('mysql2/promise');
const isDev = process.env.NODE_ENV === 'development';

// 动态读取 .env 配置
require('dotenv').config();

let dbPool;

// 初始化数据库连接池
async function initDB() {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'meditrack_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL Pool Initialized');
  } catch (err) {
    console.error('Failed to init MySQL:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // 注入预加载脚本
    },
    title: "MediTrack Connect"
  });

  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

// 注册 IPC 处理器
ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbPool) await initDB();
  try {
    const [rows] = await dbPool.execute(sql, params);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  await initDB();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
