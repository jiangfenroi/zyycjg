
"use client"

import * as React from "react"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { DataService } from "@/services/data-service";

/**
 * 根布局物理加固：
 * 1. 移除首屏阻塞逻辑，确保 children 能够第一时间到达 AuthWrapper。
 * 2. 采用 suppressHydrationWarning 规避不可避免的浏览器扩展插件干扰。
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
