
'use client';

import { Person, AbnormalResult, FollowUp, PatientDocument, SystemSettings, SystemLog, User } from '@/lib/types';
import { MOCK_PERSONS, MOCK_RESULTS, MOCK_FOLLOW_UPS, MOCK_DOCS } from '@/lib/mock-store';

declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
      log: (level: string, message: string) => Promise<void>;
      selectPDF: () => Promise<{ success: boolean; path?: string; name?: string }>;
      confirmUpload: (sourcePath: string, personId: string, type: string, customDate: string | undefined, storagePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      downloadFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      setupDB: (config: any) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// 浏览器模拟存储键名
const STORAGE_KEYS = {
  PATIENTS: 'mt_patients',
  RESULTS: 'mt_results',
  FOLLOW_UPS: 'mt_follow_ups',
  DOCS: 'mt_docs',
  LOGS: 'mt_logs',
  SETTINGS: 'mt_settings',
  USERS: 'mt_users'
};

// 辅助函数：初始化浏览器模拟数据
const getLocal = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

const setLocal = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const DataService = {
  async logToFile(level: 'INFO' | 'ERROR', message: string) {
    if (isElectron) {
      await window.electronAPI.log(level, message);
    } else {
      console.log(`[MOCK LOG ${level}] ${message}`);
    }
  },

  async getSystemSettings(): Promise<SystemSettings> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_SETTINGS');
      if (result.success && result.data) {
        const settings: any = {};
        result.data.forEach((row: any) => {
          settings[row.CONF_KEY] = row.CONF_VALUE;
        });
        return settings as SystemSettings;
      }
    }
    return getLocal(STORAGE_KEYS.SETTINGS, { 
      SYSTEM_NAME: 'MediTrack Connect', 
      SYSTEM_LOGO_TEXT: 'M', 
      SYSTEM_LOGO_URL: '', 
      STORAGE_PATH: '/mock/storage' 
    });
  },

  async updateSystemSettings(settings: SystemSettings): Promise<boolean> {
    if (isElectron) {
      const promises = Object.entries(settings).map(([key, val]) => 
        window.electronAPI.query('UPDATE SP_SETTINGS SET CONF_VALUE = ? WHERE CONF_KEY = ?', [val || '', key])
      );
      const results = await Promise.all(promises);
      const success = results.every(r => r.success);
      if (success) await this.addLog('系统管理员', '同步更新全院全局配置', 'system');
      return success;
    }
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    return true;
  },

  async addLog(operator: string, action: string, type: 'alert' | 'update' | 'completed' | 'system'): Promise<boolean> {
    const newLog: SystemLog = {
      ID: Date.now(),
      OPERATOR: operator,
      ACTION: action,
      TYPE: type,
      LOG_TIME: new Date().toISOString()
    };

    if (isElectron) {
      const sql = 'INSERT INTO SP_LOGS (OPERATOR, ACTION, TYPE) VALUES (?, ?, ?)';
      const result = await window.electronAPI.query(sql, [operator, action, type]);
      return result.success;
    }

    const logs = getLocal<SystemLog[]>(STORAGE_KEYS.LOGS, []);
    setLocal(STORAGE_KEYS.LOGS, [newLog, ...logs]);
    return true;
  },

  async getLogs(): Promise<SystemLog[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_LOGS ORDER BY LOG_TIME DESC LIMIT 200');
      if (result.success) return result.data;
    }
    return getLocal(STORAGE_KEYS.LOGS, []);
  },

  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (!result.success) throw new Error(result.error || '中心数据库同步异常');
      return result.data;
    }
    return getLocal(STORAGE_KEYS.PATIENTS, MOCK_PERSONS);
  },

  async addPatient(person: Person): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME, IDNO) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, person.AGE, person.PHONE || '', 
        person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '管理员', person.IDNO || ''
      ]);
      if (result.success) await this.addLog(person.OPTNAME || '管理员', `创建档案: ${person.PERSONNAME}`, 'update');
      return result.success;
    }

    const patients = getLocal<Person[]>(STORAGE_KEYS.PATIENTS, MOCK_PERSONS);
    setLocal(STORAGE_KEYS.PATIENTS, [person, ...patients]);
    await this.addLog(person.OPTNAME || '管理员', `创建档案: ${person.PERSONNAME}`, 'update');
    return true;
  },

  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (isElectron) {
      const sql = `
        SELECT r.*, p.PERSONNAME, p.SEX, p.AGE, p.PHONE 
        FROM SP_ZYJG r 
        LEFT JOIN SP_PERSON p ON r.PERSONID = p.PERSONID 
        ORDER BY r.ZYYCJGTZRQ DESC, r.ZYYCJGTZSJ DESC`;
      const result = await window.electronAPI.query(sql);
      if (result.success) {
        return result.data.map((r: any) => ({
          ...r,
          IS_NOTIFIED: !!r.IS_NOTIFIED,
          IS_HEALTH_EDU: !!r.IS_HEALTH_EDU
        }));
      }
    }
    const results = getLocal<AbnormalResult[]>(STORAGE_KEYS.RESULTS, MOCK_RESULTS);
    const patients = getLocal<Person[]>(STORAGE_KEYS.PATIENTS, MOCK_PERSONS);
    
    // 模拟 JOIN
    return results.map(r => {
      const p = patients.find(p => p.PERSONID === r.PERSONID);
      return { ...r, PERSONNAME: p?.PERSONNAME, SEX: p?.SEX, AGE: p?.AGE, PHONE: p?.PHONE };
    });
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_ZYJG (ID, PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR, NEXT_DATE, IS_NOTIFIED, IS_HEALTH_EDU) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        res.ID, res.PERSONID, res.TJBHID || '', res.ZYYCJGXQ, res.ZYYCJGFL, 
        res.ZYYCJGCZYJ || '', res.ZYYCJGFKJG || '', res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, 
        res.WORKER, res.ZYYCJGBTZR || '', res.NEXT_DATE || null, res.IS_NOTIFIED ? 1 : 0, res.IS_HEALTH_EDU ? 1 : 0
      ]);
      if (result.success) await this.addLog(res.WORKER, `录入重要异常结果: ${res.PERSONID}`, 'alert');
      return result.success;
    }

    const results = getLocal<AbnormalResult[]>(STORAGE_KEYS.RESULTS, MOCK_RESULTS);
    setLocal(STORAGE_KEYS.RESULTS, [res, ...results]);
    await this.addLog(res.WORKER, `录入重要异常结果: ${res.PERSONID}`, 'alert');
    return true;
  },

  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_SF WHERE PERSONID = ? ORDER BY SFTIME DESC' : 'SELECT * FROM SP_SF ORDER BY SFTIME DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) {
        return result.data.map((f: any) => ({
          ...f,
          jcsf: !!f.jcsf
        }));
      }
    }
    const followUps = getLocal<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    return personId ? followUps.filter(f => f.PERSONID === personId) : followUps;
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_SF (ID, PERSONID, ZYYCJGTJBH, HFRESULT, SFTIME, SFSJ, SFGZRY, jcsf, XCSFTIME) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.ZYYCJGTJBH || '', followUp.HFresult, followUp.SFTIME, followUp.SFSJ || '', followUp.SFGZRY, followUp.jcsf ? 1 : 0, followUp.XCSFTIME || null
      ]);
      if (result.success) await this.addLog(followUp.SFGZRY, `随访闭环结案: ${followUp.PERSONID}`, 'completed');
      return result.success;
    }

    const followUps = getLocal<FollowUp[]>(STORAGE_KEYS.FOLLOW_UPS, MOCK_FOLLOW_UPS);
    setLocal(STORAGE_KEYS.FOLLOW_UPS, [followUp, ...followUps]);
    await this.addLog(followUp.SFGZRY, `随访闭环结案: ${followUp.PERSONID}`, 'completed');
    return true;
  },

  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ? ORDER BY UPLOAD_DATE DESC' : 'SELECT * FROM SP_DOCUMENTS ORDER BY UPLOAD_DATE DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    const docs = getLocal<PatientDocument[]>(STORAGE_KEYS.DOCS, MOCK_DOCS);
    return personId ? docs.filter(d => d.PERSONID === personId) : docs;
  },

  async selectLocalFile(): Promise<{ path: string; name: string } | null> {
    if (isElectron) {
      const res = await window.electronAPI.selectPDF();
      if (res.success && res.path) {
        return { path: res.path, name: res.name || '' };
      }
    }
    // 浏览器模拟选择
    return { path: 'mock/path/file.pdf', name: '模拟体检报告.pdf' };
  },

  async uploadDocument(sourcePath: string, personId: string, type: string, customDate?: string): Promise<boolean> {
    if (isElectron) {
      const settings = await this.getSystemSettings();
      const storagePath = settings.STORAGE_PATH;
      
      if (!storagePath) {
        throw new Error('未配置全院统一物理存储路径，请管理员在系统设置中配置。');
      }

      const uploadResult = await window.electronAPI.confirmUpload(sourcePath, personId, type, customDate, storagePath);
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        if (dbResult.success) await this.addLog('操作员', `上传报告附件: ${fileName}`, 'update');
        return dbResult.success;
      } else if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
    }

    // 浏览器模拟上传
    const fileName = sourcePath.split(/[\\/]/).pop() || 'report.pdf';
    const newDoc: PatientDocument = {
      ID: `DOC${Date.now()}`,
      PERSONID: personId,
      TYPE: type as any,
      FILENAME: fileName,
      UPLOAD_DATE: customDate || new Date().toISOString().split('T')[0],
      FILE_URL: '#'
    };
    const docs = getLocal<PatientDocument[]>(STORAGE_KEYS.DOCS, MOCK_DOCS);
    setLocal(STORAGE_KEYS.DOCS, [newDoc, ...docs]);
    await this.addLog('操作员', `上传报告附件: ${fileName}`, 'update');
    return true;
  },

  async downloadDocument(sourcePath: string, fileName: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.downloadFile(sourcePath, fileName);
      return result.success;
    }
    window.alert('浏览器环境：模拟下载文件 ' + fileName);
    return true;
  },

  async deleteDocument(id: string, filePath: string): Promise<boolean> {
    if (isElectron) {
      const deleteResult = await window.electronAPI.deleteFile(filePath);
      if (deleteResult.success) {
        const dbResult = await window.electronAPI.query('DELETE FROM SP_DOCUMENTS WHERE ID = ?', [id]);
        if (dbResult.success) await this.addLog('管理员', `删除报告附件: ${filePath.split(/[\\/]/).pop()}`, 'system');
        return dbResult.success;
      } else if (deleteResult.error) {
        await window.electronAPI.query('DELETE FROM SP_DOCUMENTS WHERE ID = ?', [id]);
        return true;
      }
    }
    const docs = getLocal<PatientDocument[]>(STORAGE_KEYS.DOCS, MOCK_DOCS);
    setLocal(STORAGE_KEYS.DOCS, docs.filter(d => d.ID !== id));
    return true;
  },

  async getUsers(): Promise<User[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT ID, USERNAME, REAL_NAME, ROLE, CREATE_DATE FROM SP_USERS ORDER BY ID DESC');
      if (result.success) return result.data;
    }
    return getLocal(STORAGE_KEYS.USERS, [
      { ID: 1, USERNAME: 'admin', REAL_NAME: '系统管理员', ROLE: 'admin', CREATE_DATE: '2023-01-01' }
    ]);
  },

  async addUser(user: Partial<User>): Promise<{ success: boolean; error?: string }> {
    if (isElectron) {
      const sql = `INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)`;
      return await window.electronAPI.query(sql, [
        user.USERNAME, user.PASSWORD, user.REAL_NAME, user.ROLE, new Date().toISOString().split('T')[0]
      ]);
    }
    const users = getLocal<User[]>(STORAGE_KEYS.USERS, []);
    const newUser = { 
      ...user, 
      ID: Date.now(), 
      CREATE_DATE: new Date().toISOString().split('T')[0] 
    } as User;
    setLocal(STORAGE_KEYS.USERS, [newUser, ...users]);
    return { success: true };
  },

  async deleteUser(id: number, username: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ? AND USERNAME = ?', [id, username]);
      if (result.success) await this.addLog('系统管理员', `销号操作: ${username}`, 'system');
      return result.success;
    }
    const users = getLocal<User[]>(STORAGE_KEYS.USERS, []);
    setLocal(STORAGE_KEYS.USERS, users.filter(u => u.ID !== id));
    return true;
  },

  async resetPassword(id: number, username: string, pass: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?', [pass, id]);
      if (result.success) await this.addLog('系统管理员', `强制重置密码: ${username}`, 'system');
      return result.success;
    }
    return true;
  }
};
