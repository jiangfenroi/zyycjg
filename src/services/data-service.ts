
'use client';

import { Person, AbnormalResult, FollowUp, FollowUpTask, PatientDocument, SystemSettings, SystemLog, User } from '@/lib/types';

declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
      uploadFile: (personId: string, type: string, customDate?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      downloadFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
      setupDB: (config: any) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export const DataService = {
  // 系统设置管理
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
    return { SYSTEM_NAME: 'MediTrack Connect', SYSTEM_LOGO_TEXT: 'M', SYSTEM_LOGO_URL: '' };
  },

  async updateSystemSettings(settings: SystemSettings): Promise<boolean> {
    if (isElectron) {
      const promises = Object.entries(settings).map(([key, val]) => 
        window.electronAPI.query('UPDATE SP_SETTINGS SET CONF_VALUE = ? WHERE CONF_KEY = ?', [val || '', key])
      );
      const results = await Promise.all(promises);
      const success = results.every(r => r.success);
      if (success) await this.addLog('管理员', '更新了系统品牌配置', 'system');
      return success;
    }
    return true;
  },

  // 审计日志
  async addLog(operator: string, action: string, type: 'alert' | 'update' | 'completed' | 'system'): Promise<boolean> {
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

  // 患者档案
  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
      throw new Error(result.error || '数据库连接异常');
    }
    return [];
  },

  async addPatient(person: Person): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME, IDNO) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, person.AGE, person.PHONE || '', 
        person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '管理员', person.IDNO || ''
      ]);
      if (result.success) {
        await this.addLog(person.OPTNAME || '管理员', `创建档案: ${person.PERSONNAME}`, 'update');
        return true;
      }
      throw new Error(result.error);
    }
    return true;
  },

  // 重要异常结果
  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (isElectron) {
      const sql = `
        SELECT r.*, p.PERSONNAME, p.SEX, p.AGE, p.PHONE, p.OCCURDATE 
        FROM SP_ZYJG r 
        LEFT JOIN SP_PERSON p ON r.PERSONID = p.PERSONID 
        ORDER BY r.ZYYCJGTZRQ DESC, r.ZYYCJGTZSJ DESC`;
      const result = await window.electronAPI.query(sql);
      if (result.success) return result.data;
    }
    return [];
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_ZYJG (ID, PERSONID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        res.ID, res.PERSONID, res.ZYYCJGXQ, res.ZYYCJGFL, 
        res.ZYYCJGCZYJ || '', res.ZYYCJGFKJG || '', res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, 
        res.WORKER, res.ZYYCJGBTZR || ''
      ]);
      if (result.success) {
        await this.addLog(res.WORKER, `登记异常结果 (ID: ${res.PERSONID})`, 'alert');
        return true;
      }
      throw new Error(result.error);
    }
    return true;
  },

  // 随访结案 (SP_SF)
  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_SF WHERE PERSONID = ? ORDER BY SFTIME DESC' : 'SELECT * FROM SP_SF ORDER BY SFTIME DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return [];
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_SF (ID, PERSONID, ZYYCJGTJBH, HFresult, SFTIME, SFGZRY, jcsf) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.ZYYCJGTJBH || '', followUp.HFresult, followUp.SFTIME, followUp.SFGZRY, followUp.jcsf ? 1 : 0
      ]);
      if (result.success) {
        await this.addLog(followUp.SFGZRY, `随访结案 (ID: ${followUp.PERSONID})`, 'completed');
        return true;
      }
      throw new Error(result.error);
    }
    return true;
  },

  // 后续随访任务 (SP_SFRW)
  async addFollowUpTask(task: FollowUpTask): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_SFRW (PERSONID, ZYYCJGTJBH, XCSFTIME, STATUS) VALUES (?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [task.PERSONID, task.ZYYCJGTJBH || '', task.XCSFTIME, task.STATUS]);
      return result.success;
    }
    return true;
  },

  // 附件管理
  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ? ORDER BY UPLOAD_DATE DESC' : 'SELECT * FROM SP_DOCUMENTS ORDER BY UPLOAD_DATE DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return [];
  },

  async uploadDocument(personId: string, type: string, customDate?: string): Promise<any> {
    if (isElectron) {
      const uploadResult = await window.electronAPI.uploadFile(personId, type, customDate);
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        if (personId === 'SYSTEM') return fileUrl;
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

  // 账户管理
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
      const result = await window.electronAPI.query(sql, [
        user.USERNAME, user.PASSWORD, user.REAL_NAME, user.ROLE, new Date().toISOString().split('T')[0]
      ]);
      return result;
    }
    return { success: false, error: 'OFFLINE' };
  },

  async deleteUser(id: number, username: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ? AND USERNAME = ?', [id, username]);
      if (result.success) await this.addLog('管理员', `注销用户: ${username}`, 'system');
      return result.success;
    }
    return false;
  },

  async resetPassword(id: number, username: string, pass: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?', [pass, id]);
      if (result.success) await this.addLog('管理员', `重置用户密码: ${username}`, 'system');
      return result.success;
    }
    return false;
  }
};
