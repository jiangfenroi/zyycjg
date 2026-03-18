
# MediTrack Connect - 医疗闭环管理系统部署手册

本项目是一个采用 **Client-Server (C/S)** 架构的专业医疗业务管理系统，支持多终端同步。

## 一、 系统环境要求

### 1. 核心兼容性 (Legacy Windows Support)
- **客户端支持**: Windows 7 (SP1+), Windows 8.1, Windows 10/11 (x64)
  - *注：为了适配 Windows 7，系统内核已降级至 Electron 22.x，这是支持旧版 Windows 的最后一个长期维护内核。*
- **服务器端**: Windows Server 2012+ 或 Windows 10+
- **数据库**: MySQL 8.0+

### 2. 网络存储配置 (关键)
为了实现“一处上传，全院查看”：
1. 在服务器上创建一个用于存放 PDF 的目录（如 `D:\meditrack_storage`）。
2. 将该目录设置为 **Windows 共享文件夹**。
3. 确保所有客户端电脑能通过 `\\服务器IP\共享名` 路径直接读写该目录。

---

## 二、 数据库部署 (MySQL)

### 1. 初始化脚本
连接至 MySQL 服务器并执行：
```sql
CREATE DATABASE meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建远程访问账号 (请替换为您的强密码)
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
FLUSH PRIVILEGES;
```

### 2. 业务表结构 (系统首次启动会自动创建)
1. `SP_USERS`: 账户权限与工号管理。
2. `SP_PERSON`: 全院患者基础档案库。
3. `SP_ZYJG`: A/B 类重要异常结果登记表。
4. `SP_FOLLOWUPS`: 随访结案记录流水。
5. `SP_FOLLOWUP_TASKS`: 自动化随访计划引擎。
6. `SP_DOCUMENTS`: PDF 报告与影像附件索引。
7. `SP_SETTINGS`: 全局品牌标识与 Logo 配置。
8. `SP_LOGS`: 全量操作审计日志。

---

## 三、 客户端打包与分发

1. 安装依赖（确保 Node.js 环境已就绪）：
   ```bash
   npm install
   ```
2. 编译生产环境静态文件并生成 EXE 安装包：
   ```bash
   npm run dist
   ```
3. 将 `dist/` 目录下的安装包分发至科室终端。

---

## 四、 常见适配问题解决

- **Windows 7 提示“无法定位程序输入点”**: 请确保已安装 Windows 7 Service Pack 1 及相关安全更新（KB2533623）。
- **PDF 预览空白**: 请检查客户端是否具备对服务器共享文件夹的读权限。
- **数据库连接失败**: 
  - 检查服务器 3306 端口是否在防火墙中开放。
  - 检查 MySQL 账户是否配置了 `%` (任何主机) 的连接权限。

---
&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
