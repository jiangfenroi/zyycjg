
export interface Person {
  PERSONID: string;
  PERSONNAME: string;
  SEX: '男' | '女';
  AGE: number;
  PHONE: string;
  IDNO?: string;
  UNITNAME?: string;
  OCCURDATE: string;
  OPTNAME?: string;
  SOURCE?: 'manual' | 'import';
  LAST_UPDATE?: string;
  STATUS?: 'alive' | 'deceased' | 'lost';
}

export interface AbnormalResult {
  ID: string;
  PERSONID: string;
  TJBHID?: string;
  ZYYCJGXQ: string;
  ZYYCJGFL: 'A' | 'B';
  ZYYCJGCZYJ: string;
  ZYYCJGFKJG: string;
  ZYYCJGTZRQ: string;
  ZYYCJGTZSJ: string;
  WORKER: string;
  ZYYCJGBTZR: string;
  ZYYCJGJKXJ: boolean;
  NEXT_DATE?: string;
  IS_NOTIFIED: boolean;
  PERSONNAME?: string;
  SEX?: '男' | '女';
  AGE?: number;
  PHONE?: string;
  STATUS?: 'alive' | 'deceased' | 'lost';
}

export interface FollowUp {
  ID: string;
  PERSONID: string;
  ZYYCJGTJBH?: string;
  HFresult: string;
  SFTIME: string;
  SFSJ?: string;
  SFGZRY: string;
  jcsf: boolean;
  XCSFTIME?: string;
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
  LOGIN_BG_URL?: string;
  STORAGE_PATH?: string;
  LAST_AGE_AUDIT?: string;
}

export interface SystemLog {
  ID: number;
  OPERATOR: string;
  ACTION: string;
  TYPE: 'alert' | 'update' | 'completed' | 'system';
  LOG_TIME: string;
}
