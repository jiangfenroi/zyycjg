
"use client"

import * as React from "react"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { DataService } from "@/services/data-service";

/**
 * 根布局物理加固：
 * 1. 彻底移除首屏阻塞逻辑，确保内容能第一时间到达浏览器。
 * 2. 移除所有外部字体解析请求，解决 ERR_NAME_NOT_RESOLVED。
 * 3. 采用 suppressHydrationWarning 规避由于 Electron 环境导致的微小水合差异。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  React.useEffect(() => {
    // 异步执行审计，不阻塞 UI 挂载
    DataService.performMonthlyAgeAudit().catch(() => {});
    
    // 初始化本地主题
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/10" suppressHydrationWarning>
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
