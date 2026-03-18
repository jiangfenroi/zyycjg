
/**
 * 数据服务抽象层
 * 统一处理前端的数据请求，支持 MySQL 与 PDF 文件上传
 */
import { MOCK_PERSONS, MOCK_RESULTS, MOCK_TASKS, MOCK_DOCS } from '@/lib/mock-store';
import { Person, AbnormalResult, FollowUpTask, PatientDocument } from '@/lib/types';

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
   * 获取所有患者档案
   */
  async getPatients(): Promise<Person[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_PERSON ORDER BY OCCURDATE DESC');
      if (result.success) return result.data;
    }
    return MOCK_PERSONS;
  },

  /**
   * 获取重要异常结果
   */
  async getAbnormalResults(): Promise<AbnormalResult[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_ZYJG ORDER BY ZYYCJGTZRQ DESC, ZYYCJGTZSJ DESC');
      if (result.success) return result.data;
    }
    return MOCK_RESULTS;
  },

  /**
   * 获取报告文档
   */
  async getDocuments(): Promise<PatientDocument[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_DOCUMENTS ORDER BY UPLOAD_DATE DESC');
      if (result.success) return result.data;
    }
    return MOCK_DOCS;
  },

  /**
   * 触发 PDF 文件上传并保存数据库记录
   */
  async uploadDocument(personId: string, type: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // 1. 调用 Electron 原生对话框选择并保存文件
      const uploadResult = await window.electronAPI.uploadFile(personId, type);
      
      if (uploadResult.success && uploadResult.data) {
        const { fileName, fileUrl, uploadDate } = uploadResult.data;
        
        // 2. 将元数据存入 MySQL
        const sql = `INSERT INTO SP_DOCUMENTS (PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL) 
                     VALUES (?, ?, ?, ?, ?)`;
        const dbResult = await window.electronAPI.query(sql, [personId, type, fileName, uploadDate, fileUrl]);
        
        return dbResult.success;
      }
    }
    return false;
  }
};
