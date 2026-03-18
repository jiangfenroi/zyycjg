
# MediTrack Connect - 医疗闭环管理系统部署手册 (v1.1)

本项目是一个专门为医疗机构设计的 **Client-Server (C/S)** 架构管理系统，实现了全院多终端同步，并原生适配 Windows 7 / 8.1 / 10 / 11 系统。

## 一、 系统环境要求

### 1. 核心兼容性 (Legacy Windows Support)
- **客户端支持**: Windows 7 (SP1+), Windows 8.1, Windows 10/11 (x64)
  - *注：系统内核已锁定至 Electron 22.x 系列，以确保在 Win7/8.1 上稳定运行。*
- **服务器端**: Windows Server 2012+ (推荐) 或 Windows 10/11
- **数据库**: MySQL 8.0+

### 2. 网络存储配置 (关键)
为了实现“一处上传，全院查看”，必须配置 Windows 网络共享：
1. 在服务器上创建一个文件夹（如 `D:\meditrack_storage`）。
2. 将该文件夹设置为 **Windows 共享文件夹**。
3. 确保所有客户端能通过 UNC 路径（如 `\\服务器IP\共享名`）直接读写。
4. 打包前在 `.env` 中设置 `UPLOAD_PATH=\\服务器IP\共享名`。

---

## 二、 数据库部署 (MySQL)

### 1. 初始化脚本
连接至 MySQL 服务器并执行：
```sql
CREATE DATABASE meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建远程访问账号 (请确保服务器 3306 端口已在防火墙开放)
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
FLUSH PRIVILEGES;
```

### 2. 核心业务表结构
系统首次连接成功后会自动创建以下 8 张核心表：
- `SP_USERS`: 账户角色与工号管理。
- `SP_PERSON`: 全院患者基础档案库。
- `SP_ZYJG`: A/B 类重要异常结果登记（闭环入口）。
- `SP_FOLLOWUPS`: 随访沟通记录与结案流水。
- `SP_FOLLOWUP_TASKS`: 自动化计划复查任务（支持下次日期提醒）。
- `SP_DOCUMENTS`: PDF 报告与影像扫描件路径索引。
- `SP_SETTINGS`: 全局品牌标识（系统名、Logo）。
- `SP_LOGS`: 全量操作审计日志。

---

## 三、 客户端分发

1. 安装依赖：`npm install`
2. 编译并生成适配旧版 Windows 的 EXE：`npm run dist`
3. 将 `dist/` 目录下的安装包分发至各科室终端。

---

## 四、 常见问题解决

- **Windows 7 无法启动**: 确保安装了 `KB2533623` 系统补丁。
- **PDF 预览空白**: 检查客户端是否具备对服务器共享路径的读权限，路径必须使用 UNC 格式。
- **数据不更新**: 检查数据库连接池配置，确保服务器 MySQL 允许最大连接数大于 100。

---
&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
