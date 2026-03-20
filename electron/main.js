
const { app, BrowserWindow, ipcMain, protocol, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

/**
 * 终端兼容性与性能加固
 */
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');

const isDev = process.env.NODE_ENV === 'development';
const configPath = path.join(app.getPath('userData'), 'db-config.enc');
const logPath = path.join(app.getPath('userData'), 'app.log');

// AES-256 加密配置
const ENCRYPTION_KEY = crypto.scryptSync(app.name || 'meditrack-system-secret', 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return null;
  }
}

function writeLog(level, message) {
  try {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (e) {}
}

let dbConnection;

async function initDB(config) {
  try {
    if (dbConnection) {
      try { await dbConnection.end(); } catch (e) {}
    }

    dbConnection = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port) || 10699,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 15000
    });

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
        OPTNAME VARCHAR(50),
        SOURCE VARCHAR(20) DEFAULT 'manual',
        STATUS VARCHAR(20) DEFAULT 'alive',
        LAST_UPDATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        ZYYCJGJKXJ TINYINT(1) DEFAULT 1,
        NEXT_DATE DATE,
        IS_NOTIFIED TINYINT(1) DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS SP_SF (
        ID VARCHAR(50) PRIMARY KEY,
        PERSONID VARCHAR(50),
        ZYYCJGTJBH VARCHAR(50),
        HFRESULT TEXT,
        SFTIME DATE,
        SFSJ VARCHAR(20),
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

    await dbConnection.execute("INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES ('SYSTEM_NAME', '重要异常结果管理系统')");
    await dbConnection.execute("INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES ('STORAGE_PATH', '')");
    await dbConnection.execute("INSERT IGNORE INTO SP_SETTINGS (CONF_KEY, CONF_VALUE) VALUES ('SYSTEM_LOGO_TEXT', '重')");
    await dbConnection.execute("INSERT IGNORE INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES ('admin', '123456', '系统管理员', 'admin', CURDATE())");

    return { success: true };
  } catch (err) {
    writeLog('ERROR', '数据库接入失败: ' + err.message);
    return { success: false, error: err.message };
  }
}

ipcMain.handle('setup-db', async (event, config) => {
  const result = await initDB(config);
  if (result.success) {
    const encryptedData = encrypt(JSON.stringify(config));
    fs.writeFileSync(configPath, encryptedData, 'utf8');
    return { success: true };
  }
  return { success: false, error: result.error };
});

ipcMain.handle('db-query', async (event, { sql, params }) => {
  if (!dbConnection) {
    if (fs.existsSync(configPath)) {
      try {
        const encryptedData = fs.readFileSync(configPath, 'utf8');
        const configStr = decrypt(encryptedData);
        if (configStr) {
          const config = JSON.parse(configStr);
          await initDB(config);
        } else {
          return { success: false, error: '解密凭据失败' };
        }
      } catch (e) {
        return { success: false, error: '加载数据库配置失败' };
      }
    } else {
      return { success: false, error: 'NO_CONFIG' };
    }
  }
  try {
    const [rows] = await dbConnection.execute(sql, params || []);
    return { success: true, data: rows };
  } catch (err) {
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
    if (rows.length > 0) return { success: true, user: rows[0] };
    return { success: false, error: '无效的工号或密码' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-pdf', async (event, multi = false) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: multi ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [{ name: '报告文件', extensions: ['pdf', 'jpg', 'png', 'jpeg'] }]
  });
  if (canceled) return { success: false };
  return { success: true, files: filePaths.map(p => ({ path: p, name: path.basename(p) })) };
});

ipcMain.handle('upload-system-asset', async (event, { sourcePath, storagePath, assetType }) => {
  try {
    const assetDir = path.join(storagePath, 'system_assets');
    if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });
    const ext = path.extname(sourcePath);
    const fileName = `${assetType}${ext}`;
    const destPath = path.join(assetDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, filePath: destPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-upload-confirm', async (event, { sourcePath, personId, type, customDate, storagePath }) => {
  try {
    const destDir = path.join(storagePath, personId, type);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const ext = path.extname(sourcePath);
    const fileName = `${Date.now()}_${path.basename(sourcePath)}`;
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, data: { fileName, fileUrl: destPath, uploadDate: customDate || new Date().toISOString().split('T')[0] } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-save', async (event, { sourcePath, fileName }) => {
  try {
    const { filePath } = await dialog.showSaveDialog({ defaultPath: fileName });
    if (filePath) {
      fs.copyFileSync(sourcePath, filePath);
      return { success: true };
    }
    return { success: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-delete', async (event, { filePath }) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app-log', (event, { level, message }) => writeLog(level, message));

app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace('app://', '');
    if (url.includes(':')) url = url.split(':').pop();
    if (url.startsWith('/')) url = url.slice(1);
    const cleanPath = url.split('#')[0].split('?')[0];
    const filePath = path.join(app.getAppPath(), 'out', cleanPath);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      callback({ path: path.normalize(filePath) });
    } else {
      callback({ path: path.normalize(path.join(app.getAppPath(), 'out', 'index.html')) });
    }
  });

  protocol.registerFileProtocol('app-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('app-file://', ''));
    callback({ path: path.normalize(filePath) });
  });

  createWindow();
});

function createWindow() {
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

  const url = isDev ? `http://localhost:9002/login` : `app://./index.html#/login`;
  win.loadURL(url);
  win.once('ready-to-show', () => win.show());
  return win;
}

app.on('window-all-closed', () => app.quit());
