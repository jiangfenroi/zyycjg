
# MediTrack Connect - 医疗闭环管理系统部署手册

本项目是一个专为医疗机构设计的 C/S 架构闭环管理系统。采用 Next.js 静态导出技术并嵌入 Electron 容器，后端接入中心化 MySQL 数据库。系统针对 Windows 7 及 8.1 环境进行了终极兼容性加固。

---

## 一 服务器端配置要求（中心端）

系统采用中心化部署模式，所有的客户端均连接至同一台服务器。

### 1 环境要求
- 操作系统：Windows Server 2012+ 或 Linux。
- 数据库版本：MySQL 8.0 及以上。

### 2 数据库安装步骤
1. 安装 MySQL Server。
2. 编辑配置文件 `my.ini` ：
   - 设置监听端口：`port = 10699`
   - 允许远程连接：确保 `bind-address = 0.0.0.0`
3. 重启 MySQL 服务。
4. 在防火墙中开放 TCP `10699` 端口。

### 3 用户与权限初始化
以 root 身份进入数据库终端，执行以下 SQL 命令：
```sql
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';
GRANT ALL PRIVILEGES ON *.* TO 'medi_admin'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

---

## 二 标准化随访计划与附件配置

### 1 标准化计划逻辑
- **计划库**：管理员可在“随访路径配置”页面添加临床标准化计划（如肺结节计划）及其对应的指南 URL。
- **预警驱动**：在登记异常结果时关联计划并设置预定日期。当系统时间到达该日期时，提醒中心会自动高亮。

### 2 影像及报告存储
- **推荐方案**：在服务器上创建一个网络共享文件夹（UNC 路径）。
- **权限配置**：确保运行客户端的所有计算机对该路径具有读写权限。
- **使用方法**：客户端通过 `app-file://` 协议预览 PDF，数据库记录完整物理路径。

---

## 三 数据库核心表结构

系统包含 7 张核心业务表：

- **SP_USERS**: 用户权限表。
- **SP_SETTINGS**: 系统配置表（品牌与 Logo）。
- **SP_PATHS**: 标准化随访计划库。包含 ID, NAME, URL, DESCRIPTION。
- **SP_PERSON**: 患者档案表。
- **SP_ZYJG**: 重要异常结果登记表。包含 PATH_ID (计划关联), NEXT_DATE (触发日期)。
- **SP_SF**: 随访结案表。
- **SP_LOGS**: 系统操作审计日志。
- **SP_DOCUMENTS**: 附件管理表。

---

## 四 客户端运行环境要求

### 1 系统与组件
- 操作系统：Windows 7 SP1, Windows 8.1, Windows 10/11。
- 基础组件：必须安装 **Microsoft Visual C++ Redistributable 2015-2022** 运行库。

### 2 常见问题排查（针对 Win 7/8.1）
- **无反应/黑屏**：系统已禁用硬件加速及沙盒。若仍无法启动，请检查 `%APPDATA%/meditrack-connect/app.log` 日志回顾运行轨迹。

---

## 五 打包流程
1. `npm install`
2. `npm run dist`
打包后的安装包位于 `dist` 目录。

&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
