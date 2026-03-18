# MediTrack Connect - 网络版部署手册

本项目是一个采用 **Client-Server (C/S)** 架构的医疗闭环管理系统。客户端基于 Electron + Next.js，服务器端依赖 MySQL 数据库。

## 一、 环境要求

### 1. 服务器端 (Windows Server)
- **数据库**: MySQL 8.0+ (建议安装在高性能磁盘分区)
- **文件存储**: 需要一个用于存放 PDF 附件的目录。
  - **关键步骤**: 在 Windows 中将该目录设置为“共享”，并确保所有客户端计算机均有读写权限。
  - **示例路径**: `\\192.168.1.100\meditrack_storage` 或本地路径 `D:\meditrack_storage`。
- **网络**: 确保服务器 3306 端口对客户端 IP 开放。

### 2. 客户端 (Client PC)
- **操作系统**: Windows 10/11 (x64)
- **运行时**: 无需额外环境（安装包已内置运行时）。

---

## 二、 部署步骤

### 第一步：服务器端配置 (MySQL)
1. 安装 MySQL Server。
2. 执行以下 SQL 创建数据库与账号：
   ```sql
   CREATE DATABASE meditrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'medi_admin'@'%' IDENTIFIED BY 'YourStrongPassword';
   GRANT ALL PRIVILEGES ON meditrack_db.* TO 'medi_admin'@'%';
   FLUSH PRIVILEGES;
   ```

### 第二步：客户端编译与分发
1. 下载源码并在根目录创建 `.env` 文件：
   ```env
   # 中心服务器文件存储路径 (建议使用网络共享路径或固定映射盘符)
   UPLOAD_PATH=C:\meditrack_storage
   # 也可以是 UNC 路径 (需确保权限已放开)
   # UPLOAD_PATH=\\192.168.1.100\meditrack_storage
   ```
2. 安装依赖并编译：
   ```bash
   npm install
   npm run dist
   ```
3. 将 `dist/` 目录下的 `MediTrack Connect Setup.exe` 发送给科室电脑进行安装。

### 第三步：首次运行配置
1. 打开程序，进入 **[网络版接入向导]**。
2. 填写服务器 IP（如 192.168.1.100）、端口、数据库名、账号和密码。
3. 点击“测试并接入”，系统会自动初始化表结构和默认管理员。
4. **默认管理员**: `admin` / **密码**: `123456`。

---

## 三、 PDF 附件功能说明
- **上传**: 支持 PDF/JPG。上传时可自定义“检查日期”，系统会自动重命名文件以避免冲突。
- **存储**: 文件物理存储在 `UPLOAD_PATH` 指定的服务器位置。
- **预览**: 在档案页面点击“预览”图标，系统会启动内置安全协议加载 PDF。
- **下载**: 点击“下载”图标，可将文件另存为到本地电脑任意位置。

## 四、 常见问题
- **PDF 无法加载**: 请检查客户端是否能通过资源管理器直接打开服务器的共享路径。
- **连接超时**: 请检查服务器防火墙入站规则，确保 3306 端口开放。
- **Logo 更新不及时**: 修改系统身份设置后，其他客户端可能需要重新打开或等待 30 秒自动同步。