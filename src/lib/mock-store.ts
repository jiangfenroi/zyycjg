import { Person, AbnormalResult, FollowUp, FollowUpTask, PatientDocument } from './types';

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
];

export const MOCK_RESULTS: AbnormalResult[] = [
  {
    ID: 'R001',
    PERSONID: 'D00000119554',
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
];

export const MOCK_FOLLOW_UPS: FollowUp[] = [];

export const MOCK_TASKS: FollowUpTask[] = [
  {
    PERSONID: 'D00000119554',
    XCSFTIME: '2024-05-17', // Exactly 1 week after notification
    STATUS: 'pending',
  },
];

export const MOCK_DOCS: PatientDocument[] = [
  {
    ID: 'DOC001',
    PERSONID: 'D00000119554',
    TYPE: 'IMAGING',
    FILENAME: '胸部CT报告.pdf',
    UPLOAD_DATE: '2024-05-10',
    FILE_URL: '#',
  }
];
