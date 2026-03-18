
# MediTrack Connect - 桌面端构建指南

本项目使用 Next.js 开发，并集成 Electron 以支持 Windows 桌面安装程序。

## 技术栈
- **前端**: Next.js 15, React 19, Tailwind CSS, ShadCN UI
- **桌面环境**: Electron 30
- **数据库交互**: 目前使用 `src/lib/mock-store.ts` 进行本地模拟。

## 数据库配置
若要对接真实的 MySQL Server：
1. **配置文件**: 修改根目录下的 `.env` 文件。
2. **数据流转**: 
   - 由于 Next.js 使用 `output: export` 模式，前端代码无法直接运行 SQL 查询。
   - **推荐方案**: 在 `electron/main.js` 中使用 `mysql2` 库连接数据库，并通过 `ipcMain` / `ipcRenderer` 与前端进行通信。

## 本地构建步骤

### 1. 准备环境
确保本地已安装 [Node.js (v20+)](https://nodejs.org/)。

### 2. 安装依赖
```bash
npm install
```

### 3. 生成安装程序 (.exe)
```bash
# 构建网页并打包成 exe
npm run dist
```

### 4. 查看结果
构建完成后，生成的安装包位于 `dist/` 目录下。
