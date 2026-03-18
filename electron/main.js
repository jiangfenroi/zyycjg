
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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
      preload: path.join(__dirname, 'preload.js'), 
    },
    title: "MediTrack Connect"
  });

  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

// 注册 IPC 处理器：数据库查询
ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbPool) await initDB();
  try {
    const [rows] = await dbPool.execute(sql, params);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 注册 IPC 处理器：文件选择与上传（保存至本地/服务器目录）
ipcMain.handle('file-upload', async (event, { personId, type }) => {
  try {
    // 1. 选择文件
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || filePaths.length === 0) return { success: false, error: 'User canceled' };

    const sourcePath = filePaths[0];
    const fileName = path.basename(sourcePath);
    
    // 2. 确定保存目录 (从 .env 读取，默认为用户文档下的 meditrack_uploads)
    const uploadBaseDir = process.env.UPLOAD_PATH || path.join(app.getPath('documents'), 'meditrack_uploads');
    if (!fs.existsSync(uploadBaseDir)) {
      fs.mkdirSync(uploadBaseDir, { recursive: true });
    }

    // 为防止重名，添加时间戳
    const targetFileName = `${Date.now()}_${fileName}`;
    const targetPath = path.join(uploadBaseDir, targetFileName);

    // 3. 复制文件
    fs.copyFileSync(sourcePath, targetPath);

    // 4. 返回文件信息供数据库记录
    return { 
      success: true, 
      data: {
        fileName: fileName,
        fileUrl: targetPath,
        uploadDate: new Date().toISOString().split('T')[0]
      }
    };
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
