import { Person, AbnormalResult, FollowUp, PatientDocument } from './types';

/**
 * 核心存储已切换为远程 MySQL 数据库。
 * 移除了所有初始模拟数据，确保“中心化数据库管理工具”定位的纯净性。
 */
export const MOCK_PERSONS: Person[] = [];
export const MOCK_RESULTS: AbnormalResult[] = [];
export const MOCK_FOLLOW_UPS: FollowUp[] = [];
export const MOCK_DOCS: PatientDocument[] = [];
