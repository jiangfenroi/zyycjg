# MediTrack Connect - 网络版部署手册

本项目是一个采用 **Client-Server (C/S)** 架构的医疗闭环管理系统。客户端基于 Electron + Next.js，服务器端依赖 MySQL 数据库。

## 一、 环境要求

### 1. 服务器端 (Windows Server)
- **数据库**: MySQL 8.0+ (建议安装在高性能磁盘分区)
- **文件存储**: 需要一个用于存放 PDF 附件的目录。
  - **关键步骤**: 在 Windows 中将该目录设置为“共享”，并确保所有客户端计算机均有读写权限（SMB 共享）。
  - **示例路径**: `\\192.168.1.100\meditrack_storage`。
- **网络**: 确保服务器防火墙已开放 3306 端口。

### 2. 客户端 (Client PC)
- **操作系统**: Windows 10/11 (x64)
- **运行时**: 无需额外环境（安装包已内置运行时）。

---

## 二、 数据库部署 (MySQL)

### 第一步：创建数据库与权限
执行以下 SQL 创建数据库与远程接入账号：
```sql
CREATE DATABASE meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建远程访问账号 (请替换 YourStrongPassword)
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'YourStrongPassword';
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
FLUSH PRIVILEGES;
```

### 第二步：表结构参考 (系统首次运行时会自动创建)
系统主要包含以下 8 张核心业务表：

1. **SP_USERS**: 用户权限表 (存储工号、密码、角色)。
2. **SP_SETTINGS**: 系统配置表 (存储程序名称、Logo URL 等)。
3. **SP_PERSON**: 患者档案表 (存储患者基本信息、单位、建档日期)。
4. **SP_ZYJG**: 重要异常结果表 (存储 A/B 类结果详情、通知医生、通知记录)。
5. **SP_FOLLOWUPS**: 随访记录表 (存储已完成的随访内容、复查状态)。
6. **SP_FOLLOWUP_TASKS**: 随访计划表 (存储待执行的下次随访任务)。
7. **SP_DOCUMENTS**: 报告附件表 (存储 PDF 文件的物理路径索引)。
8. **SP_LOGS**: 系统操作日志表 (全量审计业务操作)。

---

## 三、 客户端编译与分发

1. 下载源码并在根目录创建 `.env` 文件：
   ```env
   # 中心服务器文件存储路径 (必须使用局域网共享路径)
   UPLOAD_PATH=\\192.168.1.100\meditrack_storage
   ```
2. 安装依赖并编译打包：
   ```bash
   npm install
   npm run dist
   ```
3. 将 `dist/` 目录下的 `MediTrack Connect Setup.exe` 分发至各科室安装。

---

## 四、 核心功能说明

### 1. 随访闭环管理
- **A类结果**: 系统自动实时提醒。
- **下次随访日期**: 在登记随访时，可预设未来某天再次跟进。到达预设日期后，任务会自动出现在“待执行”列表。

### 2. PDF 附件功能
- **上传**: 支持自定义“检查日期”，系统会自动重命名文件并存入 `UPLOAD_PATH` 服务器路径。
- **预览**: 通过安全协议 `app-file://` 实现局域网 PDF 在线查阅。

### 3. 系统身份自定义
- 管理员可在“系统身份设置”中修改全院统一的 **系统名称** 和 **Logo 图片**，所有客户端即时同步。

---

## 五、 常见问题 (FAQ)
- **连接超时**: 请检查服务器 3306 端口是否被防火墙拦截。
- **PDF 无法加载**: 确保客户端电脑能通过资源管理器直接访问 `UPLOAD_PATH` 路径。
- **权限不足**: 建议使用共享文件夹的“所有人(Everyone)”读取权限进行测试。
