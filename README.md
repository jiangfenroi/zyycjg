
# MediTrack Connect - 医疗闭环管理系统部署与使用手册

本项目是一个专为医疗机构设计的 C/S 架构闭环管理系统。采用 Next.js 静态导出技术并嵌入 Electron 容器，后端接入中心化 MySQL 数据库。系统针对 Windows 7 及 8.1 等旧版环境进行了终极兼容性加固。

---

## 一 服务器端配置要求 (MySQL)

系统采用中心化部署模式，所有的客户端均连接至同一台服务器。

### 1 环境要求
- 操作系统：Windows Server 2012+ 或 Linux。
- 数据库版本：MySQL 8.0 及以上。

### 2 基础安装步骤
1. 安装 MySQL Server。
2. 编辑配置文件 `my.ini` (Windows) 或 `my.cnf` (Linux)：
   - 设置监听端口：`port = 10699` (建议使用此非标准端口)。
   - 允许远程连接：确保 `bind-address = 0.0.0.0`。
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

## 二 数据库表结构详解

系统在首次连接成功后会自动创建以下表结构：

- **SP_USERS**: 用户权限表 (ID, USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE)
- **SP_SETTINGS**: 系统配置表 (CONF_KEY, CONF_VALUE)
- **SP_PERSON**: 患者档案表 (PERSONID, PERSONNAME, SEX, AGE, PHONE, IDNO, UNITNAME, OCCURDATE, OPTNAME)
- **SP_ZYJG**: 重要异常结果登记表 (ID, PERSONID, TJBHID, ZYYCJGXQ, ZYYCJGFL, ZYYCJGCZYJ, ZYYCJGFKJG, ZYYCJGTZRQ, ZYYCJGTZSJ, WORKER, ZYYCJGBTZR, IS_NOTIFIED, IS_HEALTH_EDU)
- **SP_SF**: 随访记录表 (ID, PERSONID, ZYYCJGTJBH, HFRESULT, SFTIME, SFSJ, SFGZRY, jcsf, XCSFTIME)
- **SP_LOGS**: 系统操作日志表 (ID, OPERATOR, ACTION, TYPE, LOG_TIME)
- **SP_DOCUMENTS**: 附件管理表 (ID, PERSONID, TYPE, FILENAME, UPLOAD_DATE, FILE_URL)

---

## 三 客户端程序打包流程

### 1 开发环境准备
- 确保已安装 Node.js (建议 v20+)。
- 确保已安装 git。

### 2 打包步骤
1. 进入项目根目录：
   ```cmd
   cd /d "您的项目路径"
   ```
2. 安装依赖：
   ```cmd
   npm install
   ```
3. 生成安装程序：
   ```cmd
   npm run dist
   ```
   打包生成的安装程序位于项目根目录的 `dist` 文件夹下，文件名为 `MediTrack Connect Setup [版本号].exe`。

---

## 四 客户端运行环境要求

### 1 系统与组件
- 操作系统：Windows 7 SP1, Windows 8.1, Windows 10/11。
- 基础组件：必须安装 **Microsoft Visual C++ Redistributable 2015-2022** 运行库。

### 2 常见问题排查 (Windows 7/8.1)
针对安装后运行无反应的情况：
1. **硬件加速**：系统已默认禁用硬件加速。若仍无反应，请更新显卡驱动。
2. **VC++ 运行库**：未安装运行库会导致 `mysql2` 驱动无法加载。
3. **回顾性日志**：程序会自动记录运行详情。请查看以下路径的日志文件以获取报错堆栈：
   `%APPDATA%/meditrack-connect/app.log`

---

## 五 核心业务标准

### 1 重要异常结果登记标准
包含档案编号、体检编号、姓名、结果分类、异常结果详情、通知日期/时间、处置建议等 16 维核心数据。

### 2 重要异常随访结案标准
包含回访结果详情、是否复查、回访日期/时间、下次回访时间等 11 维标准闭环数据。

---
&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
