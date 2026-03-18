
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
  // 系统设置
  async getSystemSettings(): Promise<SystemSettings> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_SETTINGS');
      if (result.success) {
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
      return results.every(r => r.success);
    }
    return true;
  },

  // 用户管理
  async getUsers(): Promise<User[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT ID, USERNAME, REAL_NAME, ROLE, CREATE_DATE FROM SP_USERS ORDER BY ID DESC');
      if (result.success) return result.data;
    }
    return [];
  },

  async addUser(user: Partial<User>): Promise<{ success: boolean; error?: string }> {
    if (isElectron) {
      const sql = `INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) 
                   VALUES (?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        user.USERNAME, 
        user.PASSWORD, 
        user.REAL_NAME, 
        user.ROLE,
        new Date().toISOString().split('T')[0]
      ]);
      if (result.success) {
        await this.addLog('系统', `创建了新用户账号: ${user.USERNAME}`, 'system');
      }
      return result;
    }
    return { success: false, error: '非客户端环境' };
  },

  async deleteUser(id: number, username: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ?', [id]);
      if (result.success) {
        await this.addLog('系统', `注销了用户账号: ${username}`, 'system');
      }
      return result.success;
    }
    return false;
  },

  async resetPassword(id: number, username: string, newPassword: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?', [newPassword, id]);
      if (result.success) {
        await this.addLog('系统', `重置了用户 ${username} 的登录密码`, 'system');
      }
      return result.success;
    }
    return false;
  },

  // 患者档案
  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
      throw new Error(result.error || '无法获取患者列表');
    }
    return [];
  },

  async addPatient(person: Person): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, person.AGE, person.PHONE || '', 
        person.UNITNAME || '', person.OCCURDATE, person.OPTNAME || '管理员'
      ]);
      if (result.success) {
        await this.addLog(person.OPTNAME || '系统管理员', `为患者 ${person.PERSONNAME} 建立了新档案`, 'update');
      } else {
        throw new Error(result.error || '数据库写入失败');
      }
      return result.success;
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
      throw new Error(result.error || '无法获取异常结果列表');
    }
    return [];
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_ZYJG (ID, PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        res.ID, res.PERSONID, res.TJBHID, res.ZYYCJGXQ, res.ZYYCJGFL, 
        res.ZYYCJGCZYJ || '', res.ZYYCJGFKJG || '', res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, 
        res.WORKER, res.ZYYCJGBTZR || ''
      ]);
      if (result.success) {
        await this.addLog(res.WORKER, `录入了一项 ${res.ZYYCJGFL}类 重要异常结果 (ID: ${res.ID})`, 'update');
      } else {
        throw new Error(result.error || '结果写入数据库失败');
      }
      return result.success;
    }
    return true;
  },

  // 重要异常结果随访
  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_FOLLOWUPS WHERE PERSONID = ?' : 'SELECT * FROM SP_FOLLOWUPS ORDER BY SFTIME DESC';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return [];
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_FOLLOWUPS (ID, PERSONID, HFresult, SFTIME, SFGZRY, jcsf) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.HFresult, followUp.SFTIME, followUp.SFGZRY, followUp.jcsf ? 1 : 0
      ]);
      if (result.success) {
        await this.addLog(followUp.SFGZRY, `完成了患者 ID ${followUp.PERSONID} 的重要异常结果随访结案`, 'completed');
      } else {
        throw new Error(result.error || '随访记录写入失败');
      }
      return result.success;
    }
    return true;
  },

  // 随访计划管理
  async getFollowUpTasks(status = 'pending'): Promise<FollowUpTask[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_FOLLOWUP_TASKS WHERE STATUS = ? ORDER BY XCSFTIME ASC', [status]);
      if (result.success) return result.data;
    }
    return [];
  },

  async addFollowUpTask(task: FollowUpTask): Promise<boolean> {
    if (isElectron) {
      const sql = 'INSERT INTO SP_FOLLOWUP_TASKS (PERSONID, XCSFTIME, STATUS) VALUES (?, ?, ?)';
      const result = await window.electronAPI.query(sql, [task.PERSONID, task.XCSFTIME, task.STATUS]);
      return result.success;
    }
    return true;
  },

  async updateFollowUpTaskStatus(personId: string, status: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_FOLLOWUP_TASKS SET STATUS = ? WHERE PERSONID = ? AND STATUS = "pending"', [status, personId]);
      return result.success;
    }
    return true;
  },

  // 报告管理
  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ?' : 'SELECT * FROM SP_DOCUMENTS ORDER BY UPLOAD_DATE DESC';
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
        
        if (personId === 'SYSTEM') {
           return uploadResult.data.fileUrl;
        }

        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) 
                     VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        if (dbResult.success) {
          await this.addLog('系统', `为患者 ID ${personId} 上传了报告附件: ${fileName}`, 'update');
        } else {
          throw new Error(dbResult.error || '文档记录写入数据库失败');
        }
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

  // 日志管理
  async getLogs(): Promise<SystemLog[]> {
    if (isElectron) {
      const sql = 'SELECT * FROM SP_LOGS ORDER BY LOG_TIME DESC LIMIT 100';
      const result = await window.electronAPI.query(sql);
      if (result.success) return result.data;
    }
    return [];
  },

  async addLog(operator: string, action: string, type: 'alert' | 'update' | 'completed' | 'system'): Promise<boolean> {
    if (isElectron) {
      const sql = 'INSERT INTO SP_LOGS (OPERATOR, ACTION, TYPE) VALUES (?, ?, ?)';
      const result = await window.electronAPI.query(sql, [operator, action, type]);
      return result.success;
    }
    return true;
  }
};
