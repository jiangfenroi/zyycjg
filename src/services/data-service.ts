
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

let cachedSettings: SystemSettings | null = null;

export const DataService = {
  // 年龄计算核心逻辑
  calculateCurrentAge(person: Person): number {
    const today = new Date();
    
    // 优先级 1: 身份证驱动
    if (person.IDNO && person.IDNO.length === 18) {
      const birthYear = parseInt(person.IDNO.substring(6, 10));
      const birthMonth = parseInt(person.IDNO.substring(10, 12)) - 1;
      const birthDay = parseInt(person.IDNO.substring(12, 14));
      
      const birthDate = new Date(birthYear, birthMonth, birthDay);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }

    // 优先级 2: 建档日期推算驱动
    if (person.OCCURDATE && person.AGE !== undefined) {
      const occurDate = new Date(person.OCCURDATE);
      const yearDiff = today.getFullYear() - occurDate.getFullYear();
      
      // 检查是否已过建档日的周年
      const anniversaryThisYear = new Date(today.getFullYear(), occurDate.getMonth(), occurDate.getDate());
      let ageIncrement = yearDiff;
      if (today < anniversaryThisYear) {
        ageIncrement--;
      }
      return person.AGE + Math.max(0, ageIncrement);
    }

    return person.AGE || 0;
  },

  // 每月 1 号全量核查
  async performMonthlyAgeAudit(): Promise<void> {
    if (!isElectron) return;
    
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    // 仅在每月 1 号执行
    if (today.getDate() !== 1) return;

    const settings = await this.getSystemSettings(true);
    if (settings.LAST_AGE_AUDIT === monthKey) return; // 本月已核查过

    console.log('启动全院中心化年龄自动核查流水...');
    const patients = await this.getPatients();
    
    for (const p of patients) {
      const newAge = this.calculateCurrentAge(p);
      if (newAge !== p.AGE) {
        await window.electronAPI.query('UPDATE SP_PERSON SET AGE = ? WHERE PERSONID = ?', [newAge, p.PERSONID]);
      }
    }

    await this.updateSystemSettings({ LAST_AGE_AUDIT: monthKey });
    console.log('年龄核查完成，数据库已同步。');
  },

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
      if (success) cachedSettings = null;
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
      // 增加身份证关联逻辑：如果有关联，物理上展示为独立记录，但在逻辑上支持身份证聚合
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
    }
    return [];
  },

  async checkPatientExists(personId: string, idNo?: string): Promise<{ exists: boolean; existingData?: Person }> {
    if (!isElectron) return { exists: false };
    
    // 优先级 1: 身份证
    if (idNo) {
      const idNoRes = await window.electronAPI.query('SELECT * FROM SP_PERSON WHERE IDNO = ? ORDER BY SOURCE = "import" DESC, LAST_UPDATE DESC LIMIT 1', [idNo]);
      if (idNoRes.success && idNoRes.data && idNoRes.data.length > 0) {
        return { exists: true, existingData: idNoRes.data[0] };
      }
    }

    // 优先级 2: 档案编号
    const idRes = await window.electronAPI.query('SELECT * FROM SP_PERSON WHERE PERSONID = ?', [personId]);
    if (idRes.success && idRes.data && idRes.data.length > 0) {
      return { exists: true, existingData: idRes.data[0] };
    }

    return { exists: false };
  },

  async addPatient(person: Person): Promise<{ success: boolean; error?: string }> {
    if (isElectron) {
      const check = await this.checkPatientExists(person.PERSONID, person.IDNO);
      
      // 优先级逻辑：如果身份证已存在，且当前是手动录入，而数据库中是导入，则不覆盖导入数据
      if (check.exists && check.existingData) {
        if (check.existingData.SOURCE === 'import' && person.SOURCE === 'manual') {
          // 只允许基于已有档案创建新流水，不更新档案基本信息
          return { success: true }; 
        }
        
        // 如果当前是导入或已有档案是手动，则以最新修改为准（UPDATE）
        const sql = `UPDATE SP_PERSON SET PERSONNAME=?, SEX=?, AGE=?, PHONE=?, UNITNAME=?, OCCURDATE=?, OPTNAME=?, SOURCE=?, IDNO=? WHERE PERSONID=?`;
        const res = await window.electronAPI.query(sql, [
          person.PERSONNAME, person.SEX, this.calculateCurrentAge(person), person.PHONE || '', 
          person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '系统', person.SOURCE || 'manual', person.IDNO || null, person.PERSONID
        ]);
        return res;
      }

      // 新增档案
      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME, IDNO, SOURCE) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, this.calculateCurrentAge(person), person.PHONE || '', 
        person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '管理员', person.IDNO || null, person.SOURCE || 'manual'
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
