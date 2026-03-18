
/**
 * 数据服务抽象层
 * 统一处理前端的数据请求，自动根据环境切换 Mock 数据或真实 IPC 查询
 */
import { MOCK_PERSONS, MOCK_RESULTS, MOCK_TASKS, MOCK_DOCS } from '@/lib/mock-store';
import { Person, AbnormalResult, FollowUpTask, PatientDocument } from '@/lib/types';

// 声明全局 Electron 接口（仅在 Electron 环境下存在）
declare global {
  interface Window {
    electronAPI: {
      query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
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
      const result = await window.electronAPI.query('SELECT * FROM SP_ZYJG ORDER BY ZYYCJGTZRQ DESC');
      if (result.success) return result.data;
    }
    return MOCK_RESULTS;
  },

  /**
   * 新增异常结果登记
   */
  async addAbnormalResult(data: AbnormalResult): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const sql = `INSERT INTO SP_ZYJG (PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR, IS_NOTIFIED, IS_HEALTH_EDU) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        data.PERSONID, data.TJBHID, data.ZYYCJGXQ, data.ZYYCJGFL, data.ZYYCJGCZYJ, 
        data.ZYYCJGFKJG, data.ZYYCJGTZRQ, data.ZYYCJGTZSJ, data.WORKER, data.ZYYCJGBTZR,
        data.IS_NOTIFIED ? 1 : 0, data.IS_HEALTH_EDU ? 1 : 0
      ];
      const result = await window.electronAPI.query(sql, params);
      return result.success;
    }
    // Mock 模式下直接返回成功（实际状态由页面 State 管理）
    return true;
  },

  /**
   * 获取随访任务
   */
  async getFollowUpTasks(): Promise<FollowUpTask[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_TASKS');
      if (result.success) return result.data;
    }
    return MOCK_TASKS;
  },

  /**
   * 获取报告文档
   */
  async getDocuments(): Promise<PatientDocument[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.query('SELECT * FROM SP_DOCUMENTS');
      if (result.success) return result.data;
    }
    return MOCK_DOCS;
  }
};
