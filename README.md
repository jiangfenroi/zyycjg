
# MediTrack Connect - 医疗闭环管理系统部署手册

本项目是一个采用 **Client-Server (C/S)** 架构的专业医疗业务管理系统，支持全院多终端同步，适配 Windows 7 及以上系统。

## 一、 系统环境要求

### 1. 核心兼容性 (Legacy Windows Support)
- **客户端支持**: Windows 7 (SP1+), Windows 8.1, Windows 10/11 (x64)
  - *注：为了适配 Windows 7/8.1，系统内核已锁定至 Electron 22.x 系列。*
- **服务器端**: Windows Server 2012+ 或 Windows 10/11
- **数据库**: MySQL 8.0+

### 2. 网络存储配置 (关键)
为了实现“一处上传，全院查看”：
1. 在服务器上创建一个用于存放附件报告的目录（如 `D:\meditrack_storage`）。
2. 将该目录设置为 **Windows 共享文件夹**。
3. 确保所有客户端电脑能通过 `\\服务器IP\共享名` 路径直接读写该目录。
4. 客户端打包前，请在 `.env` 中设置 `UPLOAD_PATH=\\服务器IP\共享名`。

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
系统在客户端配置成功后会自动创建以下 8 张表：
- `SP_USERS`: 账户权限与工号管理。
- `SP_PERSON`: 全院患者基础档案库。
- `SP_ZYJG`: A/B 类重要异常结果登记表。
- `SP_FOLLOWUPS`: 随访结案记录流水。
- `SP_FOLLOWUP_TASKS`: 自动化计划复查任务。
- `SP_DOCUMENTS`: PDF 报告与影像扫描件索引。
- `SP_SETTINGS`: 全局品牌标识与 Logo。
- `SP_LOGS`: 系统操作审计日志。

---

## 三、 客户端打包与分发

1. 安装依赖：
   ```bash
   npm install
   ```
2. 编译并生成适配 Win7/10 的 EXE 安装包：
   ```bash
   npm run dist
   ```
3. 将 `dist/` 目录下的安装包分发至科室终端。

---

## 四、 常见问题解决

- **Windows 7 提示“无法定位程序输入点”**: 确保安装了 KB2533623 补丁。
- **PDF 预览空白**: 检查客户端是否具备对服务器共享文件夹的读权限，路径是否使用了 UNC 格式。
- **数据同步失败**: 检查 MySQL 是否允许远程连接，防火墙是否拦截 3306 端口。

---
&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
