
# MediTrack Connect - 医疗闭环管理系统部署与使用手册

本项目是一个专为医疗机构设计的 C/S 架构闭环管理系统。采用 Next.js 静态导出技术并嵌入 Electron 容器，后端接入中心化 MySQL 数据库。系统针对 Windows 7 及 8.1 等旧版环境进行了终极兼容性加固。

---

## 一 服务器端配置要求

系统采用中心化部署模式，所有的客户端均连接至同一台服务器。

### 1 环境要求
- 操作系统：Windows Server 2012+ 或 Linux。
- 数据库版本：MySQL 8.0 及以上。

### 2 数据库安装步骤
1. 安装 MySQL Server。
2. 编辑配置文件 `my.ini` 或 `my.cnf`：
   - 设置监听端口：`port = 10699`
   - 允许远程连接：确保 `bind-address = 0.0.0.0`
3. 重启 MySQL 服务。
4. 在防火墙中开放 TCP `10699` 端口。

### 3 用户与权限初始化
以 root 身份进入数据库终端，执行以下 SQL 命令：
```sql
-- 创建专用业务账号
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';

-- 授予全部权限
GRANT ALL PRIVILEGES ON *.* TO 'medi_admin'@'%' WITH GRANT OPTION;

-- 刷新权限
FLUSH PRIVILEGES;
```

---

## 二 附件及随访路径配置

### 1 影像及报告存储
- **推荐方案**：在服务器上创建一个共享文件夹。
- **权限配置**：确保运行客户端的所有计算机对该路径具有读写权限。
- **使用方法**：客户端通过 `app-file://` 协议预览 PDF，数据库记录完整物理路径。

### 2 随访路径（指南）配置
- **路径功能**：管理员可在“随访路径配置”页面添加临床指南名称及其对应的 URL（如微信公众号文章链接）。
- **预警关联**：在登记异常结果时关联随访路径并设置预定日期。当系统时间到达该日期时，仪表盘及提醒中心会自动高亮。

---

## 三 数据库表结构详解

系统包含 8 张核心业务表：

- **SP_USERS**: 用户权限表。
- **SP_SETTINGS**: 系统配置表。
- **SP_PATHS**: 随访路径库。包含 ID, NAME, URL, DESCRIPTION, CREATE_DATE。
- **SP_PERSON**: 患者档案表。
- **SP_ZYJG**: 重要异常结果登记表。包含 ID, PERSONID, PATH_ID, NEXT_DATE, ZYYCJGXQ, ZYYCJGFL, ZYYCJGTZRQ, WORKER 等。
- **SP_SF**: 随访记录表。
- **SP_LOGS**: 系统操作日志表。
- **SP_DOCUMENTS**: 附件管理表。

---

## 四 客户端运行环境要求

### 1 系统与组件
- 操作系统：Windows 7 SP1, Windows 8.1, Windows 10/11。
- 基础组件：必须安装 **Microsoft Visual C++ Redistributable 2015-2022** 运行库。

### 2 常见问题排查（针对 Win 7/8.1）
- **无反应/黑屏**：系统已禁用硬件加速及沙盒。若仍无法启动，请检查 `%APPDATA%/meditrack-connect/app.log` 日志。

---

## 五 打包流程
1. `npm install`
2. `npm run dist`
打包后的安装包位于 `dist` 目录。

&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
