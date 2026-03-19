
/**
 * 数据库预设配置管理类
 */
export const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '10699'),
  user: process.env.DB_USER || 'medi_admin',
  password: process.env.DB_PASSWORD || 'AdminPassword123',
  database: process.env.DB_NAME || 'meditrack_db',
};

export default DB_CONFIG;
