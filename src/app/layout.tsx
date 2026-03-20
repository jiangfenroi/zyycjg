
"use client"

import * as React from "react"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { DataService } from "@/services/data-service";

/**
 * 根布局加固：
 * 1. 物理移除加载阻塞逻辑，彻底解决 Electron 环境下的无限转圈问题。
 * 2. 物理移除外部字体依赖，确保内网离线环境零报错 (ERR_NAME_NOT_RESOLVED)。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  React.useEffect(() => {
    // 异步执行审计，不阻塞 UI 挂载
    DataService.performMonthlyAgeAudit().catch(() => {});
    
    // 初始化主题
    const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('app-theme') || 'normal' : 'normal';
    document.documentElement.classList.remove('dark', 'eye-care');
    if (savedTheme !== 'normal') {
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>重要异常结果管理中心</title>
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/10">
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
