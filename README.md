# MediTrack Connect - 桌面端构建指南

本项目使用 Next.js 开发，并集成 Electron 以支持 Windows 桌面安装程序。

## 技术栈
- **前端**: Next.js 15, React 19, Tailwind CSS, ShadCN UI
- **桌面环境**: Electron 30
- **构建工具**: Electron Builder

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

## 注意事项
- 本程序使用 `next export` 模式，所有页面均在本地静态运行。
- AI 摘要功能已切换为本地模拟算法，以支持离线运行和无服务器打包。