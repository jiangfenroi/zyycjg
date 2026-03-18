
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const isDev = process.env.NODE_ENV === 'development';

// 预先注册协议
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'app-file', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let dbPool;
let mainWindow;
const configPath = path.join(app.getPath('userData'), 'db-config.json');

function loadLocalConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
}

function saveLocalConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function initDB(config) {
  try {
    const dbConfig = config || loadLocalConfig();
    if (!dbConfig) return { success: false, error: 'NO_CONFIG' };

    if (dbPool) {
      try { await dbPool.end(); } catch (e) {}
    }

    dbPool = mysql.createPool({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
      connectTimeout: 15000
    });
    
    const connection = await dbPool.getConnection();
    connection.release();

    const tables = [
      `CREATE TABLE IF NOT EXISTS SP_USERS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USERNAME VARCHAR(50) UNIQUE NOT NULL,
        PASSWORD VARCHAR(255) NOT NULL,
        REAL_NAME VARCHAR(50),
        ROLE ENUM('admin', 'operator') DEFAULT 'operator',
        CREATE_DATE DATE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SETTINGS (
        CONF_KEY VARCHAR(50) PRIMARY KEY,
        CONF_VALUE TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS SP_PERSON (
        PERSONID VARCHAR(50) PRIMARY KEY,
        PERSONNAME VARCHAR(50) NOT NULL,
        SEX ENUM('男', '女') NOT NULL,
        AGE INT,
        PHONE VARCHAR(20),
        IDNO VARCHAR(18),
        UNITNAME VARCHAR(200),
        OCCURDATE DATE,
        OPTNAME VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS SP_ZYJG (
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
        IS_NOTIFIED TINYINT(1) DEFAULT 1,
        IS_HEALTH_EDU TINYINT(1) DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SF (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        ZYYCJGTJBH VARCHAR(50),
        HFresult TEXT,
        SFTIME DATE,
        SFGZRY VARCHAR(50),
        jcsf TINYINT(1) DEFAULT 0,
        XCSFTIME DATE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SFRW (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        PERSONID VARCHAR(50),
        ZYYCJGTJBH VARCHAR(50),
        XCSFTIME DATE,
        STATUS ENUM('pending', 'completed') DEFAULT 'pending',
        CREATE_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS SP_DOCUMENTS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        PERSONID VARCHAR(50),
        TYPE VARCHAR(20),
        FILENAME VARCHAR(255),
        UPLOAD_DATE DATE,
        FILE_URL TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS SP_LOGS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        OPERATOR VARCHAR(50),
        ACTION TEXT,
        TYPE VARCHAR(20),
        LOG_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await dbPool.execute(sql);
    }

    // 默认管理员
    await dbPool.execute('INSERT IGNORE INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)', 
      ['admin', '123456', '系统管理员', 'admin', new Date().toISOString().split('T')[0]]);

    return { success: true };
  } catch (err) {
    console.error("Database Init Error:", err);
    return { success: false, error: err.message };
  }
}

function createWindow(startPath = '/') {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), 
      webSecurity: false,
    },
    title: "MediTrack Connect"
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:9002${startPath}`);
  } else {
    // 静态导出后使用 app 协议加载
    mainWindow.loadURL(`app://./index.html#${startPath}`);
  }
}

ipcMain.handle('setup-db', async (event, config) => {
  const result = await initDB(config);
  if (result.success) {
    saveLocalConfig(config);
    return { success: true };
  }
  return { success: false, error: result.error };
});

ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbPool) {
    const config = loadLocalConfig();
    if (config) await initDB(config);
  }
  if (!dbPool) return { success: false, error: 'NO_CONNECTION' };
  
  try {
    const [rows] = await dbPool.execute(sql, params || []);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbPool) return { success: false, error: 'OFFLINE' };
  try {
    const [rows] = await dbPool.execute(
      'SELECT ID, USERNAME, REAL_NAME, ROLE FROM SP_USERS WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    if (rows.length > 0) return { success: true, user: rows[0] };
    return { success: false, error: 'INVALID_CREDENTIALS' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-upload', async (event, { personId, type, customDate }) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择报告文件',
      properties: ['openFile'],
      filters: [{ name: 'PDF/Image', extensions: ['pdf', 'jpg', 'png', 'jpeg'] }]
    });

    if (canceled || filePaths.length === 0) return { success: false };

    const sourcePath = filePaths[0];
    const fileName = path.basename(sourcePath);
    const uploadBaseDir = process.env.UPLOAD_PATH || path.join(app.getPath('documents'), 'meditrack_storage');
    
    if (!fs.existsSync(uploadBaseDir)) fs.mkdirSync(uploadBaseDir, { recursive: true });

    const targetFileName = `${personId}_${Date.now()}_${fileName}`;
    const targetPath = path.join(uploadBaseDir, targetFileName);
    fs.copyFileSync(sourcePath, targetPath);

    return { 
      success: true, 
      data: { fileName, fileUrl: targetPath, uploadDate: customDate || new Date().toISOString().split('T')[0] }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  // 注册 app 协议以解决 Next.js 静态资源 404 问题
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace('app://', '');
    // 处理 Windows 路径中的根斜杠问题
    if (url.startsWith('/')) url = url.slice(1);
    if (url.startsWith('./')) url = url.slice(2);
    
    // 如果路径指向 index.html#/... 截断哈希
    const cleanPath = url.split('#')[0].split('?')[0];
    const filePath = path.join(app.getAppPath(), 'out', cleanPath);
    
    callback({ path: path.normalize(filePath) });
  });

  // 注册 app-file 协议以加载本地磁盘文件
  protocol.registerFileProtocol('app-file', (request, callback) => {
    let url = request.url.replace('app-file://', '');
    try {
      url = decodeURIComponent(url);
      if (process.platform === 'win32') {
        if (url.startsWith('/') && url[2] === ':') url = url.slice(1);
        if (!url.includes(':') && !url.startsWith('\\\\')) url = '\\\\' + url.replace(/\//g, '\\');
        url = path.normalize(url);
      }
      callback({ path: url });
    } catch (e) {
      callback({ error: -6 });
    }
  });

  const result = await initDB();
  if (result.success) {
    createWindow('/login');
  } else {
    createWindow('/setup');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
