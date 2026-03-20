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
      downloadFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      setupDB: (config: any) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

/**
 * 远程数据库管理工具核心服务
 * 所有的业务逻辑均强制通过 Electron IPC 通道与远程 MySQL 交互
 * 取消所有本地 Mock 数据逻辑
 */
export const DataService = {
  async logToFile(level: 'INFO' | 'ERROR', message: string) {
    if (isElectron) {
      await window.electronAPI.log(level, message);
    }
  },

  // --- 全院统一设置管理 ---

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
    return { 
      SYSTEM_NAME: 'MediTrack Connect', 
      SYSTEM_LOGO_TEXT: 'M', 
      SYSTEM_LOGO_URL: '', 
      STORAGE_PATH: '' 
    };
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
    return false;
  },

  // --- 审计日志 ---

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

  // --- 患者档案管理 (SP_PERSON) ---

  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
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
      if (result.success) await this.addLog(person.OPTNAME || '管理员', `创建/更新档案: ${person.PERSONNAME}`, 'update');
      return result.success;
    }
    return false;
  },

  // --- 重要异常结果 (SP_ZYJG) ---

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
          IS_HEALTH_EDU: !!r.IS_NOTIFIED // 使用通知状态同步宣教状态
        }));
      }
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
      if (result.success) await this.addLog(res.WORKER, `登记重要异常结果: ${res.PERSONID}`, 'alert');
      return result.success;
    }
    return false;
  },

  // --- 随访闭环管理 (SP_SF) ---

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
    return [];
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
    return false;
  },

  // --- PDF 附件管理 (SP_DOCUMENTS & 物理 IO) ---

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
      if (res.success && res.files) {
        return res.files;
      }
    }
    return [];
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
        if (dbResult.success) await this.addLog('操作员', `物理同步报告附件: ${fileName}`, 'update');
        return dbResult.success;
      } else if (uploadResult.error) {
        throw new Error(uploadResult.error);
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
      const deleteResult = await window.electronAPI.deleteFile(filePath);
      const dbResult = await window.electronAPI.query('DELETE FROM SP_DOCUMENTS WHERE ID = ?', [id]);
      if (dbResult.success) await this.addLog('管理员', `销毁报告附件索引: ${filePath.split(/[\\/]/).pop()}`, 'system');
      return dbResult.success;
    }
    return true;
  },

  // --- 人员权限与 Admin 安全中心 ---

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
      return await window.electronAPI.query(sql, [
        user.USERNAME, user.PASSWORD, user.REAL_NAME, user.ROLE, new Date().toISOString().split('T')[0]
      ]);
    }
    return { success: false, error: '非原生环境无法操作人员库' };
  },

  async deleteUser(id: number, username: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ? AND USERNAME = ?', [id, username]);
      if (result.success) await this.addLog('系统管理员', `注销账户: ${username}`, 'system');
      return result.success;
    }
    return false;
  },

  async resetPassword(id: number, username: string, pass: string): Promise<boolean> {
    if (isElectron) {
      const result = await window.electronAPI.query('UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?', [pass, id]);
      if (result.success) await this.addLog('系统管理员', `重置账户凭据: ${username}`, 'system');
      return result.success;
    }
    return false;
  }
};
