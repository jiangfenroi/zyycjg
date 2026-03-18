# MediTrack Connect - 网络版部署手册

本项目是一个采用 **Client-Server (C/S)** 架构的医疗管理系统。客户端基于 Electron + Next.js，服务器端依赖 MySQL 数据库。

## 一、 环境要求

### 1. 服务器端 (Server)
- **数据库**: MySQL 8.0+
- **存储**: 需要一个用于存放 PDF 附件的目录（建议设置为服务器共享目录）。
- **网络**: 确保服务器 3306 端口对客户端 IP 开放。

### 2. 客户端 (Client)
- **操作系统**: Windows 10/11 (x64)
- **运行时**: Node.js v20+ (仅开发/编译时需要)

---

## 二、 部署步骤

### 第一步：服务器端配置 (MySQL)
1. 安装 MySQL Server。
2. 创建一个名为 `meditrack_db` 的数据库：
   ```sql
   CREATE DATABASE meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 创建一个远程访问账号并授权：
   ```sql
   CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'YourStrongPassword';
   GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
   FLUSH PRIVILEGES;
   ```

### 第二步：客户端编译与分发
1. 下载源码并安装依赖：
   ```bash
   npm install
   ```
2. 执行打包命令生成安装包 (.exe)：
   ```bash
   npm run dist
   ```
3. 将 `dist/` 目录下生成的 `MediTrack Connect Setup.exe` 分发给科室人员安装。

### 第三步：客户端首次运行
1. 打开程序，系统会检测到无连接并跳转至 **[网络版接入向导]**。
2. 填写服务器 IP、端口、数据库名、用户名及密码。
3. 点击“测试并接入”，连接成功后程序会自动在服务器上创建业务表、初始化默认管理员并生成系统设置表。
4. **默认管理员账号**: `admin` / **密码**: `123456`。

---

## 三、 功能特性
- **数据同步**: 全院多台终端实时共享患者档案、重要异常结果及随访动态。
- **品牌自定义**: 管理员可在 [系统身份设置] 中统一修改程序名称、上传医院 Logo 图片。
- **审计日志**: 系统自动记录所有关键业务操作（建档、登记、随访等），仅管理员可见。
- **A/B类管理**: 严格按照临床标准区分 A 类（需立即干预）和 B 类（需进一步检查）任务。

---

## 四、 常见问题
- **无法连接服务器**: 请检查服务器防火墙是否允许 3306 端口 TCP 入站。
- **Logo 显示不出**: 请确保上传的图片为 PNG/JPG 格式，且服务器存储路径对当前客户端有读取权限。
- **中文乱码**: 系统导出 CSV 采用 UTF-8 BOM 编码，推荐使用 Office 2016+ 或 WPS 开启。