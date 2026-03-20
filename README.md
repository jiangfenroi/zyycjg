
# 重要异常结果管理系统 - 全院中心化数据库管理工具

本项目是一个专为医疗机构设计的 **中心化、纯数据库驱动** 的异常结果闭环管理工具，深度适配 MySQL 8.4 (Winx64) 服务器环境。系统通过 Electron 桌面端直接接入全院中心数据库，实现数据的高并发、实时同步与物理安全归档。

---

## 一、 服务器端 MySQL 8.4 部署指南

为确保系统的中心化特性与数据一致性，请按以下步骤配置服务器端：

### 1. 环境准备
- **操作系统**：Windows Server 2016+ 或 Windows 10/11 (x64)。
- **数据库版本**：MySQL 8.4.0 LTS (Windows (x86, 64-bit), MSI Installer)。

### 2. 数据库初始化
安装完成后，通过命令行或管理工具执行以下配置：

```sql
-- 1. 创建中心数据库
CREATE DATABASE IF NOT EXISTS meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 创建临床操作专用账户（建议限制 IP 访问）
CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'AdminPassword123';

-- 3. 授予全量权限（重要：系统启动时会自动执行建表及索引维护）
GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';

-- 4. 刷新权限
FLUSH PRIVILEGES;
```

### 3. 网络与防火墙
- 确保服务器 **10699** 端口（或自定义端口）已在防火墙中开放。
- 在 `my.ini` 配置文件中确保 `max_connections` 至少设置为 `500` 以应对全院并发。

---

## 二、 核心数据库结构描述

系统采用物理去重与时序关联逻辑，核心表结构如下：

### 1. SP_USERS (全院人员权限表)
管理临床操作员与管理员的访问凭据。
- `USERNAME`: 唯一工号/用户名（索引）。
- `PASSWORD`: 安全密码（明文或加密存储）。
- `REAL_NAME`: 临床医生/护理真实姓名。
- `ROLE`: 权限角色 (`admin` 管理员, `operator` 操作员)。

### 2. SP_SETTINGS (全局配置表)
存储全院同步的品牌资产与系统集成参数。
- `CONF_KEY`: 配置项键（如 `PACS_URL_TEMPLATE`, `STORAGE_PATH`）。
- `CONF_VALUE`: 物理路径、URL 模板或品牌文字。

### 3. SP_PERSON (电子档案主表)
患者基础资料中心。支持 `ON DUPLICATE KEY UPDATE` 物理去重。
- `PERSONID`: 唯一档案编号（主键）。
- `IDNO`: 18 位身份证号（物理唯一索引）。
- `STATUS`: 生命状态 (`alive` 正常, `deceased` 已死亡 - 自动停办预警)。
- `OCCURDATE`: 首次建档日期。

### 4. SP_ZYJG (重要异常结果流水)
记录核心临床发现及通知闭环状态。
- `ZYYCJGFL`: 结果分类（A类-即时干预, B类-常规随访）。
- `ZYYCJGJKXJ`: 健康宣教标记（1-已宣教, 0-未宣教）。
- `IS_NOTIFIED`: 通知状态标记（1-已通知, 0-未通知）。
- `TJBHID`: 体检流水号（前 8 位自动物理计算 T+365 预警日期）。
- `NEXT_DATE`: 预定随访日期（用于触发 T+7 或自定义周期提醒）。

### 5. SP_SF (随访结案流水)
记录闭环路径中的每一次干预结论。
- `jcsf`: 医学复查标记（1-已完成医学检查, 0-仅电话随访）。
- `XCSFTIME`: 联动更新的下一次预定随访时间。

### 6. SP_DOCUMENTS (附件索引表)
与业务流通过 `UPLOAD_DATE` 物理关联。
- `TYPE`: 报告类别 (`PE_REPORT` 体检, `IMAGING` 影像, `PATHOLOGY` 病理)。
- `FILE_URL`: 中心存储库 (UNC) 的物理相对路径。

---

## 三、 核心业务逻辑

1. **两步式采集流**：重要异常登记后，立即流转至资料完善页。支持“跳过”并在档案中心随时补录。
2. **双重周期预警**：
   - **T+7 (初次随访)**：基于 `ZYYCJGTZRQ` (通知日期) 自动触发。若周期内已完成结案，任务物理停办。
   - **T+365 (年度复查)**：基于 `TJBHID` 前 8 位日期自动物理解析并触发。
3. **动态 PACS 集成**：支持通过 `${id}` 占位符配置 PACS 调阅地址，物理唤醒本机浏览器执行影像查阅。
4. **提交防抖锁定**：所有业务提交按钮集成物理锁定机制，点击后立即禁用并展示 Loading，杜绝重复入库。

---

&copy; 2024 重要异常结果管理系统. 全院中心化驱动方案。
