/**
 * 数据服务抽象层
 * 统一处理前端的数据请求，支持 MySQL 持久化
 */
import { Person, AbnormalResult, FollowUp, PatientDocument } from '@/lib/types';
import { MOCK_PERSONS, MOCK_RESULTS, MOCK_DOCS, MOCK_FOLLOW_UPS } from '@/lib/mock-store';

declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      login: (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
      uploadFile: (personId: string, type: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    };
  }
}

export const DataService = {
  /**
   * 患者档案操作
   */
  async getPatients(): Promise<Person[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
    }
    return MOCK_PERSONS;
  },

  async addPatient(person: Person): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
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

  /**
   * 重要异常结果操作
   */
  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_ZYJG ORDER BY ZYYCJGTZRQ DESC, ZYYCJGTZSJ DESC');
      if (result.success) return result.data;
    }
    return MOCK_RESULTS;
  },

  async addAbnormalResult(res: AbnormalResult): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
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

  /**
   * 随访记录操作
   */
  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const sql = personId ? 'SELECT * FROM SP_FOLLOWUPS WHERE PERSONID = ?' : 'SELECT * FROM SP_FOLLOWUPS';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return MOCK_FOLLOW_UPS;
  },

  async addFollowUp(followUp: FollowUp): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const sql = `INSERT INTO SP_FOLLOWUPS (ID, PERSONID, HFresult, SFTIME, SFGZRY, jcsf) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await window.electronAPI.query(sql, [
        followUp.ID, followUp.PERSONID, followUp.HFresult, followUp.SFTIME, followUp.SFGZRY, followUp.jcsf
      ]);
      return result.success;
    }
    return true;
  },

  /**
   * 附件管理
   */
  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ?' : 'SELECT * FROM SP_DOCUMENTS';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return MOCK_DOCS;
  },

  async uploadDocument(personId: string, type: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const uploadResult = await window.electronAPI.uploadFile(personId, type);
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) 
                     VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        return dbResult.success;
      }
    }
    return false;
  }
};
