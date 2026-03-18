
/**
 * 数据库配置管理类
 * 用于读取 .env 中的配置信息
 */
export const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meditrack_db',
};

export default DB_CONFIG;
