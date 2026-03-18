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
  TJBHID: string;
  ZYYCJGXQ: string;
  ZYYCJGFL: 'A' | 'B';
  ZYYCJGCZYJ: string;
  ZYYCJGFKJG: string;
  ZYYCJGTZRQ: string;
  ZYYCJGTZSJ: string;
  WORKER: string;
  ZYYCJGBTZR: string;
  IS_NOTIFIED: boolean;
  IS_HEALTH_EDU: boolean;
  PERSONNAME?: string;
  SEX?: '男' | '女';
  AGE?: number;
  PHONE?: string;
  OCCURDATE?: string;
}

export interface FollowUp {
  ID: string;
  PERSONID: string;
  HFresult: string;
  SFTIME: string;
  SFGZRY: string;
  jcsf: boolean;
}

export interface FollowUpTask {
  ID?: number;
  PERSONID: string;
  XCSFTIME: string;
  STATUS: 'pending' | 'completed';
  CREATE_TIME?: string;
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

export interface SystemSettings {
  SYSTEM_NAME: string;
  SYSTEM_LOGO_TEXT: string;
  SYSTEM_LOGO_URL?: string;
}

export interface SystemLog {
  ID: number;
  OPERATOR: string;
  ACTION: string;
  TYPE: 'alert' | 'update' | 'completed' | 'system';
  LOG_TIME: string;
}
