/**
 * 网络版数据服务层
 * 封装客户端与中心 MySQL 服务器的全部数据交互
 */
import { Person, AbnormalResult, FollowUp, PatientDocument } from '@/lib/types';
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
  /**
   * 获取远程患者档案
   */
  async getPatients(): Promise<Person[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
      throw new Error(result.error);
    }
    return MOCK_PERSONS;
  },

  /**
   * 同步新档案至中心库
   */
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

  /**
   * 获取中心化异常结果记录
   */
  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (isElectron) {
      const result = await window.electronAPI.query('SELECT * FROM SP_ZYJG ORDER BY ZYYCJGTZRQ DESC, ZYYCJGTZSJ DESC');
      if (result.success) return result.data;
      throw new Error(result.error);
    }
    return MOCK_RESULTS;
  },

  /**
   * 登记并同步异常结果
   */
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

  /**
   * 获取全网随访记录
   */
  async getFollowUps(personId?: string): Promise<FollowUp[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_FOLLOWUPS WHERE PERSONID = ?' : 'SELECT * FROM SP_FOLLOWUPS';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return MOCK_FOLLOW_UPS;
  },

  /**
   * 提交随访结案并存档
   */
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

  /**
   * 获取远程附件列表
   */
  async getDocuments(personId?: string): Promise<PatientDocument[]> {
    if (isElectron) {
      const sql = personId ? 'SELECT * FROM SP_DOCUMENTS WHERE PERSONID = ?' : 'SELECT * FROM SP_DOCUMENTS';
      const result = await window.electronAPI.query(sql, personId ? [personId] : []);
      if (result.success) return result.data;
    }
    return MOCK_DOCS;
  },

  /**
   * 上传文件并同步至中心存储库
   */
  async uploadDocument(personId: string, type: string): Promise<boolean> {
    if (isElectron) {
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
