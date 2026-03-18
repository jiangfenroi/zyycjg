import { Person, AbnormalResult, FollowUp, FollowUpTask, PatientDocument } from './types';

// 初始模拟数据
export const MOCK_PERSONS: Person[] = [
  {
    PERSONID: 'D00000119554',
    PERSONNAME: '张伟',
    SEX: '男',
    AGE: 45,
    IDNO: '110101197801011234',
    PHONE: '13800138000',
    UNITNAME: '北京科技发展有限公司',
    OCCURDATE: '2023-10-01',
    OPTNAME: '管理员',
  },
  {
    PERSONID: 'D00000119555',
    PERSONNAME: '李丽',
    SEX: '女',
    AGE: 32,
    IDNO: '110101199105055678',
    PHONE: '13911112222',
    UNITNAME: '朝阳医院',
    OCCURDATE: '2023-11-15',
    OPTNAME: '管理员',
  },
  {
    PERSONID: 'D00000119556',
    PERSONNAME: '王强',
    SEX: '男',
    AGE: 58,
    IDNO: '110101196608082345',
    PHONE: '13566667777',
    UNITNAME: '建设银行',
    OCCURDATE: '2024-01-20',
    OPTNAME: '管理员',
  }
];

export const MOCK_RESULTS: AbnormalResult[] = [
  {
    ID: 'R001',
    PERSONID: 'D00000119554',
    TJBHID: 'TJ20240501001',
    ZYYCJGXQ: '左肺上叶见磨玻璃结节，大小约8mm，边缘尚清。建议定期随访CT。',
    ZYYCJGFL: 'A',
    ZYYCJGCZYJ: '建议3个月后复查薄层CT',
    ZYYCJGFKJG: '患者表示理解并配合',
    ZYYCJGTZRQ: '2024-05-10',
    ZYYCJGTZSJ: '14:30',
    WORKER: '王医生',
    ZYYCJGBTZR: '本人',
    IS_NOTIFIED: true,
    IS_HEALTH_EDU: true,
  },
  {
    ID: 'R002',
    PERSONID: 'D00000119556',
    TJBHID: 'TJ20240615002',
    ZYYCJGXQ: '空腹血糖 12.5mmol/L，尿糖(+++)。',
    ZYYCJGFL: 'B',
    ZYYCJGCZYJ: '建议内科门诊进一步诊治',
    ZYYCJGFKJG: '已通知，建议即刻挂号',
    ZYYCJGTZRQ: '2024-06-16',
    ZYYCJGTZSJ: '09:15',
    WORKER: '李护士',
    ZYYCJGBTZR: '家属',
    IS_NOTIFIED: true,
    IS_HEALTH_EDU: true,
  }
];

export const MOCK_FOLLOW_UPS: FollowUp[] = [
  {
    ID: 'F001',
    PERSONID: 'D00000119554',
    HFresult: '患者自述已于外院复查CT，结节无明显变化。',
    SFTIME: '2024-05-20',
    SFGZRY: '管理员',
    jcsf: false,
  }
];

export const MOCK_TASKS: FollowUpTask[] = [
  {
    PERSONID: 'D00000119554',
    XCSFTIME: '2024-05-17',
    STATUS: 'completed',
  },
  {
    PERSONID: 'D00000119556',
    XCSFTIME: '2024-06-23',
    STATUS: 'pending',
  }
];

export const MOCK_DOCS: PatientDocument[] = [
  {
    ID: 'DOC001',
    PERSONID: 'D00000119554',
    TYPE: 'IMAGING',
    FILENAME: '胸部CT报告.pdf',
    UPLOAD_DATE: '2024-05-10',
    FILE_URL: '#',
  },
  {
    ID: 'DOC002',
    PERSONID: 'D00000119556',
    TYPE: 'PE_REPORT',
    FILENAME: '年度体检汇总报告.pdf',
    UPLOAD_DATE: '2024-06-15',
    FILE_URL: '#',
  }
];
