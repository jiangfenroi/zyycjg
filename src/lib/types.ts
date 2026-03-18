export interface Person {
  PERSONID: string;
  PERSONNAME: string;
  SPELLNO?: string;
  SEX: '男' | '女';
  AGE: number;
  BIRTHDAY?: string;
  MARRYNAME?: string;
  NATIONNAME?: string;
  IDNO: string;
  PHONE: string;
  UNITNAME?: string;
  OCCURDATE: string;
  OPTNAME?: string;
}

export interface AbnormalResult {
  ID: string;
  PERSONID: string;
  TJBHID: string; // 体检编号
  ZYYCJGXQ: string; // 重要异常结果详情
  ZYYCJGFL: 'A' | 'B'; // 分类
  ZYYCJGCZYJ: string; // 处置意见
  ZYYCJGFKJG: string; // 被通知人反馈结果
  ZYYCJGTZRQ: string; // 通知日期 (xxxx/xx/xx)
  ZYYCJGTZSJ: string; // 通知时间 (hh:mm)
  WORKER: string; // 通知人
  ZYYCJGBTZR: string; // 重要异常结果被通知人
  IS_NOTIFIED: boolean;
  IS_HEALTH_EDU: boolean;
}

export interface FollowUp {
  ID: string;
  PERSONID: string;
  HFresult: string; // 结果
  SFTIME: string; // 日期
  SFGZRY: string; // 随访工作人员
  jcsf: boolean; // 是否进一步病理检查
}

export interface FollowUpTask {
  PERSONID: string;
  XCSFTIME: string; // 下次随访日期
  STATUS: 'pending' | 'completed';
}

export interface PatientDocument {
  ID: string;
  PERSONID: string;
  TYPE: 'PE_REPORT' | 'IMAGING' | 'PATHOLOGY';
  FILENAME: string;
  UPLOAD_DATE: string;
  FILE_URL: string;
}

export interface User {
  ID: number;
  USERNAME: string;
  PASSWORD?: string;
  REAL_NAME: string;
  ROLE: 'admin' | 'operator';
  CREATE_DATE: string;
}
