
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const isDev = process.env.NODE_ENV === 'development';

require('dotenv').config();

let dbPool;
let mainWindow;
const configPath = path.join(app.getPath('userData'), 'db-config.json');

// Windows 7/8 适配：必须在 app.whenReady 之前注册自定义协议的特权
protocol.registerSchemesAsPrivileged([
  { scheme: 'app-file', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

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
      try {
        await dbPool.end();
      } catch (e) {
        console.error("Failed to close old pool:", e);
      }
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
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 15000
    });
    
    // 测试连接
    const connection = await dbPool.getConnection();
    connection.release();

    // 核心业务表初始化 (适配 Windows 环境)
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
        UNITNAME VARCHAR(100),
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
        IS_NOTIFIED BOOLEAN DEFAULT TRUE,
        IS_HEALTH_EDU BOOLEAN DEFAULT TRUE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_FOLLOWUPS (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        HFresult TEXT,
        SFTIME DATE,
        SFGZRY VARCHAR(50),
        jcsf BOOLEAN DEFAULT FALSE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_FOLLOWUP_TASKS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        PERSONID VARCHAR(50),
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

    // 初始化默认管理员 (如果不存在)
    const [userRows] = await dbPool.execute('SELECT * FROM SP_USERS WHERE USERNAME = ?', ['admin']);
    if (userRows.length === 0) {
      await dbPool.execute(
        'INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)',
        ['admin', '123456', '系统管理员', 'admin', new Date().toISOString().split('T')[0]]
      );
    }

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
      webSecurity: false, // 允许加载局域网/本地资源
    },
    title: "MediTrack Connect"
  });

  const url = isDev 
    ? `http://localhost:9002${startPath}` 
    : `file://${path.join(__dirname, '../out/index.html')}#${startPath}`;

  if (isDev) {
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'), { hash: startPath });
  }
}

// IPC 消息处理器
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
    console.error("SQL Error:", sql, err.message);
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
    if (rows.length > 0) {
      return { success: true, user: rows[0] };
    }
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
    
    // 优先读取环境变量 UPLOAD_PATH (建议配置为 Windows 共享文件夹)
    const uploadBaseDir = process.env.UPLOAD_PATH || path.join(app.getPath('documents'), 'meditrack_storage');
    
    if (!fs.existsSync(uploadBaseDir)) {
      try {
        fs.mkdirSync(uploadBaseDir, { recursive: true });
      } catch (e) {
        console.error("Failed to create upload dir:", e);
      }
    }

    const targetFileName = personId === 'SYSTEM' 
      ? `logo_${Date.now()}${path.extname(fileName)}`
      : `${personId}_${Date.now()}_${fileName}`;
    
    const targetPath = path.join(uploadBaseDir, targetFileName);
    fs.copyFileSync(sourcePath, targetPath);

    return { 
      success: true, 
      data: {
        fileName: fileName,
        fileUrl: targetPath,
        uploadDate: customDate || new Date().toISOString().split('T')[0]
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-save', async (event, { sourcePath, fileName }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '另存为',
      defaultPath: fileName,
    });

    if (canceled || !filePath) return { success: false };

    fs.copyFileSync(sourcePath, filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  // Windows 7/8.1 适配：使用 Electron 22 规范的协议注册
  protocol.registerFileProtocol('app-file', (request, callback) => {
    const urlStr = request.url;
    let filePath = decodeURIComponent(urlStr.slice('app-file://'.length));
    
    if (process.platform === 'win32') {
      // 处理 Windows UNC 路径和盘符
      if (filePath.startsWith('/') && filePath[2] === ':') {
        filePath = filePath.slice(1);
      }
      filePath = path.normalize(filePath);
    }
    
    callback({ path: filePath });
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
