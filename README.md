
# MediTrack Connect - 全院中心化数据库管理工具

本项目是一个专为医疗机构设计的中心化数据库管理工具。采用 C/S 架构，客户端基于 Next.js 与 Electron 技术构建，后端接入中心化远程 MySQL 数据库，实现全院重要异常结果的闭环管理。

---

## 一 服务器端配置要求 (中心化部署)

本系统不再区分服务器端与客户端程序，所有终端均连接至同一台中心 MySQL 服务器。

### 1 远程 MySQL 安装
- **推荐版本**：MySQL 8.0.x
- **监听端口**：默认 `10699`
- **配置文件关键设置**：
  ```ini
  [mysqld]
  port = 10699
  bind-address = 0.0.0.0
  max_connections = 500
  ```

### 2 权限初始化
以 root 身份执行以下命令：
```sql
CREATE DATABASE IF NOT EXISTS meditrack_db DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
FLUSH PRIVILEGES;
```

---

## 二 中心化附件存储配置

系统支持 PDF 报告的中心化上传与共享调阅。

1. **创建中心目录**：建议在服务器或专用存储节点创建共享文件夹。
2. **UNC 路径引用**：在登录后的“全院统一配置”中设定该路径（如 `\\SERVER_IP\MediStorage`）。
3. **权限**：确保运行程序的计算机账户对该路径具有完整的读写权限。

---

## 三 核心业务表结构

系统连接成功后会自动同步以下 7 张核心业务表：

- **SP_USERS**: 人员权限表。存储工号、加密密码及角色。
- **SP_SETTINGS**: 全局配置表。存储全院品牌名称及 **STORAGE_PATH** (中心存储路径)。
- **SP_PERSON**: 患者电子档案主表。
- **SP_ZYJG**: 重要异常结果登记流水。存储 16 维登记信息及预定随访日期。
- **SP_SF**: 随访闭环结案流水。存储 11 维回访结论及复查标记。
- **SP_LOGS**: 全量审计日志。记录全院业务操作足迹。
- **SP_DOCUMENTS**: 附件索引表。

---

## 四 客户端部署与安装

### 1 环境要求
- **操作系统**：Windows 7 SP1, 8.1, 10, 11。
- **必备组件**：必须安装 **Microsoft Visual C++ Redistributable 2015-2022**。
- **兼容性加固**：针对 Windows 8.1，系统已自动禁用硬件加速及沙盒。

### 2 打包流程
1. `npm install`
2. `npm run dist`
打包产物位于 `dist` 目录。

### 3 运行诊断
- **数据库连接**：点击登录页面底部的“服务器连接设置”实时校准 MySQL 地址。
- **日志分析**：程序自动记录运行详情至 `%APPDATA%/meditrack-connect/app.log`，用于回顾性判断连接或 SQL 异常。

&copy; 2024 MediTrack Connect. 医疗数据中心管理工具.
