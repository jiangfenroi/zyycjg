
const { app, BrowserWindow, ipcMain, dialog, protocol, Tray, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// 强制禁用硬件加速，解决 Windows 8.1/7 启动无反应或黑屏问题
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

const isDev = process.env.NODE_ENV === 'development';
const isAutoStart = process.argv.includes('--hidden');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'app-file', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let dbPool;
let mainWindow;
let tray;
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
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

async function initDB(config) {
  try {
    const dbConfig = config || loadLocalConfig();
    if (!dbConfig || !dbConfig.host) return { success: false, error: 'NO_CONFIG' };

    const targetDatabase = dbConfig.database || 'meditrack_db';

    // 先尝试连接到实例，确保权限正确并创建数据库
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: parseInt(dbConfig.port || '10699'),
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 10000
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();

    if (dbPool) {
      try { await dbPool.end(); } catch (e) {}
    }

    dbPool = mysql.createPool({
      host: dbConfig.host,
      port: parseInt(dbConfig.port || '10699'),
      user: dbConfig.user,
      password: dbConfig.password,
      database: targetDatabase,
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
      connectTimeout: 15000
    });

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

    // 初始化默认配置
    await dbPool.execute('INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES (?, ?)', ['SYSTEM_NAME', 'MediTrack Connect']);
    await dbPool.execute('INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES (?, ?)', ['SYSTEM_LOGO_TEXT', 'M']);
    await dbPool.execute('INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES (?, ?)', ['SYSTEM_LOGO_URL', '']);
    await dbPool.execute('INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES (?, ?)', ['AUTO_START', '0']);

    // 创建初始管理员
    await dbPool.execute('INSERT IGNORE INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)', 
      ['admin', '123456', '系统管理员', 'admin', new Date().toISOString().split('T')[0]]);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function createWindow(startPath = '/') {
  if (mainWindow) {
    const url = isDev ? `http://localhost:9002${startPath}` : `app://./index.html#${startPath}`;
    mainWindow.loadURL(url);
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), 
      webSecurity: false,
    },
    title: "MediTrack Connect"
  });

  const url = isDev ? `http://localhost:9002${startPath}` : `app://./index.html#${startPath}`;
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    if (!isAutoStart) {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(app.getAppPath(), 'public', 'favicon.ico');
  tray = new Tray(fs.existsSync(iconPath) ? iconPath : path.join(__dirname, 'icon_placeholder.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开系统主界面', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: '彻底退出系统', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('MediTrack Connect 医疗闭环管理');
  tray.setContextMenu(contextMenu);
}

// 后台定期检查待随访任务并通知
async function checkPendingTasksInBackground() {
  if (!dbPool) {
    const config = loadLocalConfig();
    if (config) await initDB(config);
  }
  
  if (dbPool) {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM SP_ZYJG r 
        LEFT JOIN SP_SF f ON r.PERSONID = f.PERSONID AND r.TJBHID = f.ZYYCJGTJBH 
        WHERE f.ID IS NULL`;
      const [rows] = await dbPool.execute(sql);
      const pendingCount = rows[0].count;
      
      if (pendingCount > 0) {
        if (mainWindow) mainWindow.flashFrame(true);
        if (Notification.isSupported()) {
          new Notification({
            title: '待随访任务提醒',
            body: `当前有 ${pendingCount} 例重要异常结果尚未完成随访。`,
            silent: false
          }).show();
        }
      }
    } catch (err) {}
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
    if (config) {
      const initRes = await initDB(config);
      if (!initRes.success) return { success: false, error: 'NO_CONNECTION' };
    } else {
      return { success: false, error: 'NO_CONFIG' };
    }
  }
  
  try {
    const [rows] = await dbPool.execute(sql, params || []);
    return { success: true, data: rows };
  } catch (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return { success: false, error: 'NO_CONNECTION' };
    }
    return { success: false, error: err.message };
  }
});

ipcMain.handle('set-autostart', (event, flag) => {
  app.setLoginItemSettings({
    openAtLogin: flag,
    path: app.getPath('exe'),
    args: ['--hidden']
  });
  return true;
});

ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbPool) return { success: false, error: 'NO_CONNECTION' };
  try {
    const [rows] = await dbPool.execute(
      'SELECT ID, USERNAME, REAL_NAME, ROLE FROM SP_USERS WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    if (rows.length > 0) return { success: true, user: rows[0] };
    return { success: false, error: '认证失败' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('set-flash', (event, flag) => {
  if (mainWindow) {
    mainWindow.flashFrame(flag);
  }
});

app.whenReady().then(async () => {
  // 注册 app:// 协议用于访问 out 目录下的静态资源
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace('app://', '');
    if (url.includes(':')) { url = url.split(':').pop(); }
    if (url.startsWith('/')) url = url.slice(1);
    if (url.startsWith('./')) url = url.slice(2);
    
    // 处理 Windows 绝对路径转换错误
    const cleanPath = url.split('#')[0].split('?')[0];
    const filePath = path.join(app.getAppPath(), 'out', cleanPath);
    
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      callback({ path: path.normalize(filePath) });
    } else {
      // 找不到文件时返回 index.html 以支持 SPA 路由
      callback({ path: path.normalize(path.join(app.getAppPath(), 'out', 'index.html')) });
    }
  });

  // 注册 app-file:// 协议用于访问本地文件系统资源
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

  createTray();

  const config = loadLocalConfig();
  if (config) {
    const dbResult = await initDB(config);
    if (dbResult.success) {
      createWindow('/login');
    } else {
      createWindow('/setup');
    }
  } else {
    createWindow('/setup');
  }

  // 启动后台扫描任务
  setInterval(checkPendingTasksInBackground, 5 * 60 * 1000);
  setTimeout(checkPendingTasksInBackground, 10000);
});
