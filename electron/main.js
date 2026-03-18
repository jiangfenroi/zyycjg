const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const isDev = process.env.NODE_ENV === 'development';

// 动态读取 .env 配置
require('dotenv').config();

let dbPool;

// 初始化数据库连接池并确保用户表存在
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
    
    // 初始化用户表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS SP_USERS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USERNAME VARCHAR(50) UNIQUE NOT NULL,
        PASSWORD VARCHAR(255) NOT NULL,
        REAL_NAME VARCHAR(50),
        ROLE ENUM('admin', 'operator') DEFAULT 'operator',
        CREATE_DATE DATE
      )
    `);

    // 检查是否已有管理员，若无则创建默认
    const [rows] = await dbPool.execute('SELECT * FROM SP_USERS WHERE USERNAME = ?', ['admin']);
    if (rows.length === 0) {
      await dbPool.execute(
        'INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)',
        ['admin', '123456', '系统管理员', 'admin', new Date().toISOString().split('T')[0]]
      );
    }

    console.log('MySQL Pool & Tables Initialized');
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

// IPC 处理器：通用数据库查询
ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbPool) await initDB();
  try {
    const [rows] = await dbPool.execute(sql, params);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理器：身份验证
ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbPool) await initDB();
  try {
    const [rows] = await dbPool.execute(
      'SELECT ID, USERNAME, REAL_NAME, ROLE FROM SP_USERS WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    if (rows.length > 0) {
      return { success: true, user: rows[0] };
    }
    return { success: false, error: '用户名或密码错误' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理器：文件上传
ipcMain.handle('file-upload', async (event, { personId, type }) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || filePaths.length === 0) return { success: false, error: 'User canceled' };

    const sourcePath = filePaths[0];
    const fileName = path.basename(sourcePath);
    const uploadBaseDir = process.env.UPLOAD_PATH || path.join(app.getPath('documents'), 'meditrack_uploads');
    
    if (!fs.existsSync(uploadBaseDir)) {
      fs.mkdirSync(uploadBaseDir, { recursive: true });
    }

    const targetFileName = `${Date.now()}_${fileName}`;
    const targetPath = path.join(uploadBaseDir, targetFileName);
    fs.copyFileSync(sourcePath, targetPath);

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
