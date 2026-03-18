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
  ZYYCJGXQ: string; // Detail
  ZYYCJGFL: 'A' | 'B'; // Classification
  ZYYCJGCZYJ: string; // Disposition advice
  ZYYCJGFKJG: string; // Feedback
  ZYYCJGTZRQ: string; // Notification Date
  ZYYCJGTZSJ: string; // Notification Time (HH:mm)
  WORKER: string; // Notifier
  ZYYCJGBTZR: string; // Person notified
  IS_NOTIFIED: boolean;
  IS_HEALTH_EDU: boolean;
}

export interface FollowUp {
  ID: string;
  PERSONID: string;
  HFresult: string; // Result
  SFTIME: string; // Date
  SFGZRY: string; // Follow-up staff
  jcsf: boolean; // Further pathological check
}

export interface FollowUpTask {
  PERSONID: string;
  XCSFTIME: string; // Next date
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
