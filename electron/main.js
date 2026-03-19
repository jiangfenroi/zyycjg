
const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');

/**
 * 终极兼容性加固：彻底禁用所有 GPU 相关硬件加速
 * 解决 Windows 7 / 8.1 启动无反应或黑屏的核心手段
 */
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

const isDev = process.env.NODE_ENV === 'development';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let dbConnection;
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

    // 关闭现有连接
    if (dbConnection) {
      try { await dbConnection.close(); } catch (e) {}
    }

    // Oracle 连接字符串构造
    const connectString = `${dbConfig.host}:${dbConfig.port || '1521'}/${dbConfig.serviceName || 'orcl'}`;

    dbConnection = await oracledb.getConnection({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: connectString
    });

    // 自动建表逻辑
    const tables = [
      `CREATE TABLE SP_USERS (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        USERNAME VARCHAR2(50) UNIQUE NOT NULL,
        PASSWORD VARCHAR2(255) NOT NULL,
        REAL_NAME VARCHAR2(50),
        ROLE VARCHAR2(20) DEFAULT 'operator',
        CREATE_DATE DATE
      )`,
      `CREATE TABLE SP_SETTINGS (
        CONF_KEY VARCHAR2(50) PRIMARY KEY,
        CONF_VALUE CLOB
      )`,
      `CREATE TABLE SP_PERSON (
        PERSONID VARCHAR2(50) PRIMARY KEY,
        PERSONNAME VARCHAR2(50) NOT NULL,
        SEX VARCHAR2(10) NOT NULL,
        AGE NUMBER,
        PHONE VARCHAR2(20),
        IDNO VARCHAR2(18),
        UNITNAME VARCHAR2(200),
        OCCURDATE DATE,
        OPTNAME VARCHAR2(50)
      )`,
      `CREATE TABLE SP_ZYJG (
        ID VARCHAR2(50) PRIMARY KEY,
        PERSONID VARCHAR2(50),
        TJBHID VARCHAR2(50),
        ZYYCJGXQ CLOB,
        ZYYCJGFL VARCHAR2(10),
        ZYYCJGCZYJ CLOB,
        ZYYCJGFKJG CLOB,
        ZYYCJGTZRQ DATE,
        ZYYCJGTZSJ VARCHAR2(20),
        WORKER VARCHAR2(50),
        ZYYCJGBTZR VARCHAR2(50),
        IS_NOTIFIED NUMBER(1) DEFAULT 1,
        IS_HEALTH_EDU NUMBER(1) DEFAULT 1
      )`,
      `CREATE TABLE SP_SF (
        ID VARCHAR2(50) PRIMARY KEY,
        PERSONID VARCHAR2(50),
        ZYYCJGTJBH VARCHAR2(50),
        HFRESULT CLOB,
        SFTIME DATE,
        SFGZRY VARCHAR2(50),
        JCSF NUMBER(1) DEFAULT 0,
        XCSFTIME DATE
      )`,
      `CREATE TABLE SP_LOGS (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        OPERATOR VARCHAR2(50),
        ACTION CLOB,
        TYPE VARCHAR2(20),
        LOG_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      try {
        await dbConnection.execute(sql);
      } catch (e) {
        // 表已存在报错忽略
        if (e.errorNum !== 955) console.warn(e.message);
      }
    }

    // 初始化基础数据
    await dbConnection.execute(`MERGE INTO SP_SETTINGS t USING (SELECT 'SYSTEM_NAME' k, 'MediTrack Connect' v FROM dual) s ON (t.CONF_KEY = s.k) WHEN NOT MATCHED THEN INSERT (CONF_KEY, CONF_VALUE) VALUES (s.k, s.v)`);
    await dbConnection.execute(`MERGE INTO SP_USERS t USING (SELECT 'admin' u, '123456' p, '系统管理员' r, 'admin' role FROM dual) s ON (t.USERNAME = s.u) WHEN NOT MATCHED THEN INSERT (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (s.u, s.p, s.r, s.role, SYSDATE)`);
    
    await dbConnection.commit();

    return { success: true };
  } catch (err) {
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
      sandbox: false // 禁用沙盒以增加兼容性
    }
  });

  const url = isDev ? `http://localhost:9002${startPath}` : `app://./index.html#${startPath}`;
  win.loadURL(url);

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
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
    const result = await dbConnection.execute(sql, params || [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return { success: true, data: result.rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbConnection) return { success: false, error: 'NO_CONNECTION' };
  try {
    const result = await dbConnection.execute(
      'SELECT ID, USERNAME, REAL_NAME, ROLE FROM SP_USERS WHERE USERNAME = :u AND PASSWORD = :p',
      { u: username, p: password },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length > 0) return { success: true, user: result.rows[0] };
    return { success: false, error: '认证失败' };
  } catch (err) {
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
  app.quit();
});
