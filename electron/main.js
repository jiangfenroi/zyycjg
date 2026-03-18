const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const isDev = process.env.NODE_ENV === 'development';

// 动态读取 .env 配置（仅作为默认值）
require('dotenv').config();

let dbPool;
let mainWindow;
const configPath = path.join(app.getPath('userData'), 'db-config.json');

/**
 * 从本地存储读取数据库配置
 */
function loadLocalConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Read config error:', e);
    }
  }
  return null;
}

/**
 * 保存数据库配置到本地
 */
function saveLocalConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Save config error:', e);
    return false;
  }
}

/**
 * 初始化数据库连接池并确保所有业务表存在
 */
async function initDB(config) {
  try {
    const dbConfig = config || loadLocalConfig();
    if (!dbConfig) return { success: false, error: 'NO_CONFIG' };

    dbPool = mysql.createPool({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 测试连接
    const connection = await dbPool.getConnection();
    connection.release();

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
        IS_HEALTH_EDU BOOLEAN DEFAULT TRUE
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
        jcsf BOOLEAN DEFAULT FALSE
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
        FILE_URL TEXT
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
    return { success: true };
  } catch (err) {
    console.error('Database Connection Error:', err);
    return { success: false, error: err.message };
  }
}

function createWindow(startPath = '/') {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), 
    },
    title: "MediTrack Connect - 医疗数据安全保护系统"
  });

  const url = isDev 
    ? `http://localhost:9002${startPath}` 
    : `file://${path.join(__dirname, '../out/index.html')}#${startPath}`;

  if (isDev) {
    mainWindow.loadURL(url);
  } else {
    // 静态导出模式下使用 Hash 路由或直接加载文件
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'), { hash: startPath });
  }
}

// IPC 处理器：测试并保存配置
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
  if (!dbPool) return { success: false, error: '数据库未连接' };
  
  try {
    const [rows] = await dbPool.execute(sql, params);
    return { success: true, data: rows };
  } catch (err) {
    console.error('SQL Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth-login', async (event, { username, password }) => {
  if (!dbPool) return { success: false, error: '数据库未初始化' };
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
  const result = await initDB();
  if (result.success) {
    createWindow('/login');
  } else {
    // 如果没有配置或连接失败，进入设置页面
    createWindow('/setup');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
