
const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

/**
 * 终极兼容性加固：针对 Windows 7 / 8.1
 * 彻底禁用 GPU 硬件加速及沙盒模式
 */
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

const isDev = process.env.NODE_ENV === 'development';
const configPath = path.join(app.getPath('userData'), 'db-config.json');
const logPath = path.join(app.getPath('userData'), 'app.log');

/**
 * 本地日志写入引擎
 */
function writeLog(level, message) {
  try {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

writeLog('INFO', '系统正在启动');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let dbConnection;

function loadLocalConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      writeLog('ERROR', '读取本地配置失败: ' + e.message);
    }
  }
  return null;
}

function saveLocalConfig(config) {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    writeLog('INFO', '数据库配置已保存');
    return true;
  } catch (e) {
    writeLog('ERROR', '保存配置失败: ' + e.message);
    return false;
  }
}

async function initDB(config) {
  try {
    const dbConfig = config || loadLocalConfig();
    if (!dbConfig || !dbConfig.host) {
      writeLog('INFO', '未检测到数据库配置');
      return { success: false, error: 'NO_CONFIG' };
    }

    if (dbConnection) {
      try { await dbConnection.end(); } catch (e) {}
    }

    writeLog('INFO', `正在尝试连接数据库: ${dbConfig.host}`);

    dbConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port || 3306,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database || 'meditrack_db',
      connectTimeout: 15000
    });

    writeLog('INFO', '数据库连接成功，开始初始化表结构');

    const tables = [
      `CREATE TABLE IF NOT EXISTS SP_USERS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USERNAME VARCHAR(50) UNIQUE NOT NULL,
        PASSWORD VARCHAR(255) NOT NULL,
        REAL_NAME VARCHAR(50),
        ROLE VARCHAR(20) DEFAULT 'operator',
        CREATE_DATE DATE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SETTINGS (
        CONF_KEY VARCHAR(50) PRIMARY KEY,
        CONF_VALUE TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS SP_PERSON (
        PERSONID VARCHAR(50) PRIMARY KEY,
        PERSONNAME VARCHAR(50) NOT NULL,
        SEX VARCHAR(10) NOT NULL,
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
        ZYYCJGFL VARCHAR(10),
        ZYYCJGCZYJ TEXT,
        ZYYCJGFKJG TEXT,
        ZYYCJGTZRQ DATE,
        ZYYCJGTZSJ VARCHAR(20),
        WORKER VARCHAR(50),
        ZYYCJGBTZR VARCHAR(50),
        IS_NOTIFIED TINYINT(1) DEFAULT 1,
        IS_HEALTH_EDU TINYINT(1) DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SF (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        ZYYCJGTJBH VARCHAR(50),
        HFRESULT TEXT,
        SFTIME DATE,
        SFGZRY VARCHAR(50),
        jcsf TINYINT(1) DEFAULT 0,
        XCSFTIME DATE
      )`,
      `CREATE TABLE IF NOT EXISTS SP_LOGS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        OPERATOR VARCHAR(50),
        ACTION TEXT,
        TYPE VARCHAR(20),
        LOG_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS SP_DOCUMENTS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        PERSONID VARCHAR(50),
        TYPE VARCHAR(50),
        FILENAME VARCHAR(255),
        UPLOAD_DATE DATE,
        FILE_URL TEXT
      )`
    ];

    for (const sql of tables) {
      await dbConnection.execute(sql);
    }

    await dbConnection.execute("INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES ('SYSTEM_NAME', 'MediTrack Connect')");
    await dbConnection.execute("INSERT IGNORE INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES ('admin', '123456', '系统管理员', 'admin', CURDATE())");

    writeLog('INFO', '数据库初始化完成');
    return { success: true };
  } catch (err) {
    writeLog('ERROR', '数据库接入失败: ' + err.message);
    return { success: false, error: err.message };
  }
}

function createWindow(startPath = '/') {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false 
    }
  });

  const url = isDev ? `http://localhost:9002${startPath}` : `app://./index.html#${startPath}`;
  win.loadURL(url);

  win.once('ready-to-show', () => {
    win.show();
    writeLog('INFO', '主窗口已显示');
  });

  return win;
}

ipcMain.handle('app-log', (event, { level, message }) => {
  writeLog(level, message);
});

ipcMain.handle('setup-db', async (event, config) => {
  const result = await initDB(config);
  if (result.success) {
    saveLocalConfig(config);
    return { success: true };
  }
  return { success: false, error: result.error };
});

ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbConnection) {
    const config = loadLocalConfig();
    if (config) {
      const initRes = await initDB(config);
      if (!initRes.success) return { success: false, error: 'NO_CONNECTION' };
    } else {
      return { success: false, error: 'NO_CONFIG' };
    }
  }
  
  try {
    const [rows] = await dbConnection.execute(sql, params || []);
    return { success: true, data: rows };
  } catch (err) {
    writeLog('ERROR', 'SQL 执行异常: ' + err.message + ' | SQL: ' + sql);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbConnection) return { success: false, error: 'NO_CONNECTION' };
  try {
    const [rows] = await dbConnection.execute(
      'SELECT ID, USERNAME, REAL_NAME, ROLE FROM SP_USERS WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    if (rows.length > 0) {
      writeLog('INFO', `用户登录成功: ${username}`);
      return { success: true, user: rows[0] };
    }
    writeLog('INFO', `登录失败: ${username}`);
    return { success: false, error: '认证失败' };
  } catch (err) {
    writeLog('ERROR', '认证过程异常: ' + err.message);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace('app://', '');
    if (url.includes(':')) { url = url.split(':').pop(); }
    if (url.startsWith('/')) url = url.slice(1);
    
    const cleanPath = url.split('#')[0].split('?')[0];
    const filePath = path.join(app.getAppPath(), 'out', cleanPath);
    
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      callback({ path: path.normalize(filePath) });
    } else {
      callback({ path: path.normalize(path.join(app.getAppPath(), 'out', 'index.html')) });
    }
  });

  const config = loadLocalConfig();
  if (config) {
    const dbResult = await initDB(config);
    createWindow(dbResult.success ? '/login' : '/setup');
  } else {
    createWindow('/setup');
  }
});

app.on('window-all-closed', () => {
  writeLog('INFO', '系统正常退出');
  app.quit();
});
