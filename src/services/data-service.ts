import { Person, AbnormalResult, FollowUp, PatientDocument, SystemSettings } from '@/lib/types';
import { MOCK_PERSONS, MOCK_RESULTS, MOCK_DOCS, MOCK_FOLLOW_UPS } from '@/lib/mock-store';

declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
      uploadFile: (personId: string, type: string) => Promise<{ success: boolean; data?: any; error?: string }>;
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

  // 患者档案
  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
      throw new Error(result.error);
    }
    return MOCK_PERSONS;
  },

  async addPatient(person: Person): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_PERSON (PERSONID, PERSONNAME, SEX, AGE, PHONE, UNITNAME, OCCURDATE, OPTNAME) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        person.PERSONID, person.PERSONNAME, person.SEX, person.AGE, person.PHONE, 
        person.UNITNAME, person.OCCURDATE, person.OPTNAME
      ]);
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
      throw new Error(result.error);
    }
    return MOCK_RESULTS;
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_ZYJG (ID, PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        res.ID, res.PERSONID, res.TJBHID, res.ZYYCJGXQ, res.ZYYCJGFL, 
        res.ZYYCJGCZYJ, res.ZYYCJGFKJG, res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, 
        res.WORKER, res.ZYYCJGBTZR
      ]);
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
    return MOCK_FOLLOW_UPS;
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (isElectron) {
      const sql = `INSERT INTO SP_FOLLOWUPS (ID, PERSONID, HFresult, SFTIME, SFGZRY, jcsf) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.HFresult, followUp.SFTIME, followUp.SFGZRY, followUp.jcsf
      ]);
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
    return MOCK_DOCS;
  },

  async uploadDocument(personId: string, type: string): Promise<boolean> {
    if (isElectron) {
      const uploadResult = await window.electronAPI.uploadFile(personId, type);
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        
        // 如果是系统 Logo 上传，不需要记录到文档表，直接返回 URL
        if (personId === 'SYSTEM') {
           return uploadResult.data.fileUrl;
        }

        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) 
                     VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        return dbResult.success;
      }
    }
    return false;
  }
};
