const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const isDev = process.env.NODE_ENV === 'development';

// 动态读取 .env 配置
require('dotenv').config();

let dbPool;

// 初始化数据库连接池并确保所有业务表存在
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
    
    // 1. 初始化用户表
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

    // 2. 初始化患者档案表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS SP_PERSON (
        PERSONID VARCHAR(50) PRIMARY KEY,
        PERSONNAME VARCHAR(50) NOT NULL,
        SEX ENUM('男', '女') NOT NULL,
        AGE INT,
        PHONE VARCHAR(20),
        UNITNAME VARCHAR(100),
        OCCURDATE DATE,
        OPTNAME VARCHAR(50)
      )
    `);

    // 3. 初始化重要异常结果表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS SP_ZYJG (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        TJBHID VARCHAR(50),
        ZYYCJGXQ TEXT,
        ZYYCJGFL ENUM('A', 'B'),
        ZYYCJGCZYJ TEXT,
        ZYYCJGFKJG TEXT,
        ZYYCJGTZRQ DATE,
        ZYYCJGTZSJ TIME,
        WORKER VARCHAR(50),
        ZYYCJGBTZR VARCHAR(50),
        IS_NOTIFIED BOOLEAN DEFAULT TRUE,
        IS_HEALTH_EDU BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (PERSONID) REFERENCES SP_PERSON(PERSONID)
      )
    `);

    // 4. 初始化随访记录表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS SP_FOLLOWUPS (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        HFresult TEXT,
        SFTIME DATE,
        SFGZRY VARCHAR(50),
        jcsf BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (PERSONID) REFERENCES SP_PERSON(PERSONID)
      )
    `);

    // 5. 初始化附件文档表
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS SP_DOCUMENTS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        PERSONID VARCHAR(50),
        TYPE VARCHAR(20),
        FILENAME VARCHAR(255),
        UPLOAD_DATE DATE,
        FILE_URL TEXT,
        FOREIGN KEY (PERSONID) REFERENCES SP_PERSON(PERSONID)
      )
    `);

    // 检查并创建默认管理员
    const [rows] = await dbPool.execute('SELECT * FROM SP_USERS WHERE USERNAME = ?', ['admin']);
    if (rows.length === 0) {
      await dbPool.execute(
        'INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)',
        ['admin', '123456', '系统管理员', 'admin', new Date().toISOString().split('T')[0]]
      );
    }

    console.log('MySQL Service Initialized Successfully');
  } catch (err) {
    console.error('Database Connection Error:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), 
    },
    title: "MediTrack Connect - 医疗数据安全保护系统"
  });

  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbPool) await initDB();
  try {
    const [rows] = await dbPool.execute(sql, params);
    return { success: true, data: rows };
  } catch (err) {
    console.error('SQL Error:', err.message);
    return { success: false, error: err.message };
  }
});

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
    return { success: false, error: '用户名或密码不正确' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-upload', async (event, { personId, type }) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择病历 PDF 文件',
      properties: ['openFile'],
      filters: [{ name: 'PDF 报告', extensions: ['pdf'] }]
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
