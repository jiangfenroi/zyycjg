
# MediTrack Connect - 医疗闭环管理系统部署与使用手册

本项目是一个专为医疗机构设计的 C/S 架构闭环管理系统。采用 Next.js 静态导出技术并嵌入 Electron 容器，后端接入中心化 MySQL 数据库。系统针对 Windows 7 及 8.1 等旧版环境进行了终极兼容性加固。

---

## 一 数据库服务器端配置

系统采用中心化部署模式，所有的客户端均连接至同一台 MySQL 服务器。

### 1 环境要求
- 操作系统：Windows Server 2012+ 或 Linux。
- 数据库版本：MySQL 8.0 及以上。

### 2 基础安装步骤
1. 安装 MySQL Server。
2. 编辑配置文件 `my.ini` 或 `my.cnf`：
   - 设置监听端口：`port = 10699`。
   - 允许远程连接：确保 `bind-address = 0.0.0.0`。
3. 重启 MySQL 服务。

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
*注意：程序在首次接入时会自动创建名为 meditrack_db 的数据库及其业务表结构。*

### 4 网络防火墙
- 在服务器防火墙中新建入站规则，允许 TCP 端口 10699 的流量通过。

---

## 二 客户端打包流程

打包生成的安装包是通用的，所有的接入参数均在安装后通过客户端向导进行动态配置。

### 1 环境准备
- 安装 Node.js v18 或更高版本。
- 重要：Windows 用户请确保安装了 Microsoft Visual C++ Redistributable 运行库。

### 2 打包命令
1. 安装依赖：
   ```bash
   npm install
   ```
2. 生成安装程序：
   ```bash
   npm run dist
   ```
   打包生成的安装程序位于项目根目录的 dist 文件夹下，文件名为 `MediTrack Connect Setup [版本号].exe`。

---

## 三 安装与配置

### 1 客户端安装
在目标电脑运行生成的 .exe 安装包。安装程序会自动创建桌面快捷方式。

### 2 首次运行配置
启动程序后，系统会自动判断：
- 客户端侧判定：若本地无配置文件，则自动进入接入页面。
- 配置步骤：
  - 输入服务器 IP。
  - 确认预设端口：10699。
  - 确认预设账号：medi_admin。
  - 点击建立连接并初始化中心端。
  - 程序会自动创建数据库 Schema、业务表以及默认管理员。

---

## 四 兼容性与故障排查

针对 Windows 7 或 8.1 系统运行无反应的终极解决方案：

### 1 硬件加速与沙盒
系统已默认禁用硬件加速及内核沙盒模式。若程序仍无法启动，请检查显卡驱动是否过旧，并确保已安装 VC++ 2015-2022 运行库。

### 2 回顾性日志分析
程序会自动记录运行详情及报错。若遇到连接失败或启动异常，请查看以下路径的日志文件进行问题判断：
`%APPDATA%/meditrack-connect/app.log`

---

## 五 业务标准维度

### 1 重要异常结果登记标准
登记界面及导出报表包含以下 16 维标准数据：
1. 档案编号
2. 体检编号
3. 姓名
4. 性别
5. 年龄
6. 联系电话
7. 体检日期
8. 结果分类
9. 重要异常结果详情
10. 是否通知
11. 是否健康宣教
12. 通知日期
13. 通知时间
14. 通知医生
15. 被通知人
16. 处置建议

### 2 重要异常随访结案标准
随访管理模块导出的记录包含以下 11 维标准数据：
1. 档案编号
2. 体检编号
3. 姓名
4. 性别
5. 年龄
6. 重要异常结果详情
7. 回访结果详情
8. 是否复查及进一步病理检查
9. 回访时间
10. 回访人
11. 下次回访时间

---

## 六 数据库表结构详解

系统在初始化阶段会自动在中心端创建以下 7 张核心业务表：

### 1 SP_USERS - 用户权限表
- ID: 自增主键。
- USERNAME: 登录账号。
- PASSWORD: 登录密码。
- REAL_NAME: 用户真实姓名。
- ROLE: 用户角色。
- CREATE_DATE: 账号创建日期。

### 2 SP_SETTINGS - 系统配置表
- CONF_KEY: 配置键名。
- CONF_VALUE: 配置内容文本。

### 3 SP_PERSON - 患者档案基础表
- PERSONID: 档案编号。
- PERSONNAME: 患者姓名。
- SEX: 性别。
- AGE: 年龄。
- PHONE: 联系电话。
- IDNO: 身份证号。
- UNITNAME: 所属单位名称。
- OCCURDATE: 建档日期。
- OPTNAME: 录入人姓名。

### 4 SP_ZYJG - 重要异常结果登记表
- ID: 登记唯一编号。
- PERSONID: 关联档案编号。
- TJBHID: 体检编号。
- ZYYCJGXQ: 重要异常结果详情。
- ZYYCJGFL: 结果分类。
- ZYYCJGCZYJ: 处置建议。
- ZYYCJGFKJG: 反馈结果。
- ZYYCJGTZRQ: 通知日期。
- ZYYCJGTZSJ: 通知时间。
- WORKER: 通知医生。
- ZYYCJGBTZR: 被通知人。
- IS_NOTIFIED: 是否通知。
- IS_HEALTH_EDU: 是否健康宣教。

### 5 SP_SF - 重要异常随访记录表
- ID: 随访唯一编号。
- PERSONID: 关联档案编号。
- ZYYCJGTJBH: 关联体检编号。
- HFRESULT: 回访结果详情。
- SFTIME: 回访日期。
- SFGZRY: 回访人姓名。
- jcsf: 是否复查及进一步病理检查。
- XCSFTIME: 下次随访日期。

### 6 SP_LOGS - 系统操作审计日志表
- ID: 自增主键。
- OPERATOR: 操作员姓名。
- ACTION: 具体动作描述。
- TYPE: 日志类型。
- LOG_TIME: 日志记录时间。

### 7 SP_DOCUMENTS - 报告附件关联表
- ID: 自增主键。
- PERSONID: 关联档案编号。
- TYPE: 报告分类。
- FILENAME: 文件原始名称。
- UPLOAD_DATE: 上传日期。
- FILE_URL: 中心库存储路径。

---
&copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
