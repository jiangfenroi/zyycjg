
# MediTrack Connect - 医疗闭环管理系统部署手册

本项目是一个专为医疗机构设计的 C/S 架构中心化数据库管理工具。采用 Next.js 静态导出技术并嵌入 Electron 容器，后端接入中心化 MySQL 数据库。系统针对 Windows 7 及 8.1 环境进行了终极兼容性加固。

---

## 一 服务器端配置要求

本系统采用中心化部署模式，所有客户端必须连接至同一台 MySQL 服务器。

### 1 数据库安装
- 推荐版本：MySQL 8.0.x
- 端口配置：默认 `10699` (可在登录页修改)
- 配置文件 (`my.ini`) 关键设置：
  ```ini
  [mysqld]
  port = 10699
  bind-address = 0.0.0.0
  max_connections = 500
  ```

### 2 权限初始化
以 root 身份执行以下命令创建业务账号：
```sql
CREATE DATABASE IF NOT EXISTS meditrack_db DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
FLUSH PRIVILEGES;
```

---

## 二 附件中心化存储配置 (PDF/影像)

系统支持附件的远程调阅，建议采用 Windows 网络共享方案。

1. **创建共享文件夹**：在服务器上创建文件夹（如 `D:\MediStorage`）。
2. **权限分配**：确保所有运行客户端的计算机账号或公共账号对该文件夹具有“读取/写入”权限。
3. **UNC 路径引用**：在客户端配置中，附件路径应使用 UNC 格式（如 `\\SERVER_IP\MediStorage`）。
4. **协议映射**：系统内部通过 `app-file://` 协议解析上述路径以实现 PDF 预览。

---

## 三 核心业务表结构

系统在连接成功后会自动创建以下 7 张核心管理表：

- **SP_USERS**: 操作员权限管理表。
- **SP_SETTINGS**: 系统全局品牌配置表。
- **SP_PATHS**: 自定义随访路径库。包含 ID, NAME, URL (参考链接), DESCRIPTION。
- **SP_PERSON**: 患者电子档案主表。
- **SP_ZYJG**: 重要异常结果登记流水。包含 PATH_ID (关联路径), NEXT_DATE (预定触发日期)。
- **SP_SF**: 随访闭环结案流水。
- **SP_LOGS**: 全量业务操作审计日志。
- **SP_DOCUMENTS**: 附件索引表。

---

## 四 客户端部署

### 1 环境要求
- 操作系统：Windows 7 SP1, Windows 8.1, Windows 10/11。
- **必备组件**：必须安装 **Microsoft Visual C++ Redistributable 2015-2022**。

### 2 打包流程
1. `npm install`
2. `npm run dist`
打包产物位于 `dist` 目录。

### 3 运行诊断
- **无反应/黑屏**：系统已禁用硬件加速及沙盒。若仍无法启动，请检查 `%APPDATA%/meditrack-connect/app.log` 日志。
- **数据库连接**：点击登录页面底部的“服务器连接设置”进行即时配置。

&copy; 2024 MediTrack Connect. 医疗数据中心管理工具.
