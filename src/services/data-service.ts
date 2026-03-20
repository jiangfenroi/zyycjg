
'use client';

import { Person, AbnormalResult, FollowUp, PatientDocument, SystemSettings, SystemLog, User } from '@/lib/types';

declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
      log: (level: string, message: string) => Promise<void>;
      selectPDF: (multi?: boolean) => Promise<{ success: boolean; files?: {path: string, name: string}[] }>;
      confirmUpload: (sourcePath: string, personId: string, type: string, customDate: string | undefined, storagePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      uploadSystemAsset: (data: { sourcePath: string, storagePath: string, assetType: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      downloadFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      setupDB: (config: any) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// 增加简单的内存缓存，提升侧边栏和配置页的响应速度
let cachedSettings: SystemSettings | null = null;

export const DataService = {
  async getSystemSettings(force = false): Promise<SystemSettings> {
    if (!force && cachedSettings) return cachedSettings;

    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_SETTINGS');
      if (result.success && result.data) {
        const settings: any = {};
        result.data.forEach((row: any) => {
          settings[row.CONF_KEY] = row.CONF_VALUE;
        });
        cachedSettings = settings as SystemSettings;
        return cachedSettings;
      }
    }
    return { SYSTEM_NAME: '重要异常结果管理系统', SYSTEM_LOGO_TEXT: '重', STORAGE_PATH: '' };
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<boolean> {
    if (isElectron) {
      const promises = Object.entries(settings).map(([key, val]) => 
        window.electronAPI.query('UPDATE SP_SETTINGS SET CONF_VALUE = ? WHERE CONF_KEY = ?', [val || '', key])
      );
      const results = await Promise.all(promises);
      const success = results.every(r => r.success);
      if (success) cachedSettings = null; // 清除缓存以便下次拉取最新
      return success;
    }
    return false;
  },

  async uploadSystemAsset(sourcePath: string, assetType: 'SYSTEM_LOGO_URL' | 'LOGIN_BG_URL'): Promise<boolean> {
    if (isElectron) {
      const settings = await this.getSystemSettings();
      if (!settings.STORAGE_PATH) throw new Error('未配置中心存储路径');
      
      const res = await window.electronAPI.uploadSystemAsset({
        sourcePath,
        storagePath: settings.STORAGE_PATH,
        assetType
      });
      
      if (res.success && res.filePath) {
        return await this.updateSystemSettings({ [assetType]: res.filePath });
      }
    }
    return false;
  },

  async addLog(operator: string, action: string, type: string): Promise<boolean> {
    if (isElectron) {
      const sql = 'INSERT INTO SP_LOGS (OPERATOR, ACTION, TYPE) VALUES (?, ?, ?)';
      const result = await window.electronAPI.query(sql, [operator, action, type]);
      return result.success;
    }
    return true;
  },

  async getLogs(): Promise<SystemLog[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_LOGS ORDER BY LOG_TIME DESC LIMIT 200');
      if (result.success) return result.data;
    }
    return [];
  },

  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
    }
    return [];
  },

  async checkPatientExists(personId: string, idNo?: string): Promise<{ exists: boolean; field?: string }> {
    if (!isElectron) return { exists: false };
    
    const [idRes] = await Promise.all([
      window.electronAPI.query('SELECT PERSONID FROM SP_PERSON WHERE PERSONID = ?', [personId])
    ]);
    
    if (idRes.success && idRes.data && idRes.data.length > 0) {
      return { exists: true, field: '档案编号' };
    }

    if (idNo) {
      const idNoRes = await window.electronAPI.query('SELECT PERSONID FROM SP_PERSON WHERE IDNO = ?', [idNo]);
      if (idNoRes.success && idNoRes.data && idNoRes.data.length > 0) {
        return { exists: true, field: '身份证号' };
      }
    }

    return { exists: false };
  },

  async addPatient(person: Person): Promise<{ success: boolean; error?: string }> {
    if (isElectron) {
      // 在插入前进行最后一次查重校验
      const check = await this.checkPatientExists(person.PERSONID, person.IDNO);
      if (check.exists) {
        return { success: false, error: `${check.field} 已存在，请勿重复创建` };
      }

      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME, IDNO) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, person.AGE, person.PHONE || '', 
        person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '管理员', person.IDNO || null
      ]);
      return result;
    }
    return { success: false, error: '环境限制' };
  },

  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (isElectron) {
      const sql = `SELECT r.*, p.PERSONNAME FROM SP_ZYJG r LEFT JOIN SP_PERSON p ON r.PERSONID = p.PERSONID ORDER BY r.ZYYCJGTZRQ DESC`;
      const result = await window.electronAPI.query(sql);
      if (result.success) return result.data.map((r: any) => ({ ...r, IS_NOTIFIED: !!r.IS_NOTIFIED }));
    }
    return [];
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_ZYJG (ID, PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR, NEXT_DATE, IS_NOTIFIED) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        res.ID, res.PERSONID, res.TJBHID || '', res.ZYYCJGXQ, res.ZYYCJGFL, 
        res.ZYYCJGCZYJ || '', res.ZYYCJGFKJG || '', res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, 
        res.WORKER, res.ZYYCJGBTZR || '', res.NEXT_DATE || null, res.IS_NOTIFIED ? 1 : 0
      ]);
      return result.success;
    }
    return false;
  },

  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_SF WHERE PERSONID = ? ORDER BY SFTIME DESC' : 'SELECT * FROM SP_SF ORDER BY SFTIME DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data.map((f: any) => ({ ...f, jcsf: !!f.jcsf }));
    }
    return [];
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_SF (ID, PERSONID, ZYYCJGTJBH, HFRESULT, SFTIME, SFSJ, SFGZRY, jcsf, XCSFTIME) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.ZYYCJGTJBH || '', followUp.HFresult, followUp.SFTIME, followUp.SFSJ || '', followUp.SFGZRY, followUp.jcsf ? 1 : 0, followUp.XCSFTIME || null
      ]);
      return result.success;
    }
    return false;
  },

  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ? ORDER BY UPLOAD_DATE DESC' : 'SELECT * FROM SP_DOCUMENTS ORDER BY UPLOAD_DATE DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return [];
  },

  async selectLocalFiles(multi = true): Promise<{ path: string; name: string }[]> {
    if (isElectron) {
      const res = await window.electronAPI.selectPDF(multi);
      if (res.success && res.files) return res.files;
    }
    return [];
  },

  async uploadDocument(sourcePath: string, personId: string, type: string, customDate?: string): Promise<boolean> {
    if (isElectron) {
      const settings = await this.getSystemSettings();
      if (!settings.STORAGE_PATH) throw new Error('未配置存储路径');
      const uploadResult = await window.electronAPI.confirmUpload(sourcePath, personId, type, customDate, settings.STORAGE_PATH);
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        return dbResult.success;
      }
    }
    return false;
  },

  async downloadDocument(sourcePath: string, fileName: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.downloadFile(sourcePath, fileName);
      return result.success;
    }
    return false;
  },

  async deleteDocument(id: string, filePath: string): Promise<boolean> {
    if (isElectron) {
      await window.electronAPI.deleteFile(filePath);
      const dbResult = await window.electronAPI.query('DELETE FROM SP_DOCUMENTS WHERE ID = ?', [id]);
      return dbResult.success;
    }
    return true;
  },

  async getUsers(): Promise<User[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT ID, USERNAME, REAL_NAME, ROLE, CREATE_DATE FROM SP_USERS ORDER BY ID DESC');
      if (result.success) return result.data;
    }
    return [];
  },

  async addUser(user: Partial<User>): Promise<{ success: boolean; error?: string }> {
    if (isElectron) {
      const sql = `INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)`;
      return await window.electronAPI.query(sql, [user.USERNAME, user.PASSWORD, user.REAL_NAME, user.ROLE, new Date().toISOString().split('T')[0]]);
    }
    return { success: false, error: '环境限制' };
  },

  async deleteUser(id: number, username: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ? AND USERNAME = ?', [id, username]);
      return result.success;
    }
    return false;
  },

  async resetPassword(id: number, username: string, pass: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?', [pass, id]);
      return result.success;
    }
    return false;
  },

  async logToFile(level: string, message: string) {
    if (isElectron) {
      await window.electronAPI.log(level, message);
    }
  }
};
