
"use client"

import * as React from "react"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { DataService } from "@/services/data-service";

/**
 * 根布局加固：
 * 1. 物理移除 Google Fonts 外部依赖，解决内网环境下的 ERR_NAME_NOT_RESOLVED 错误。
 * 2. 采用系统原生字体族（微软雅黑、PingFang SC），确保离线环境下的视觉一致性。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // 启动时触发年龄自动核查流水
    DataService.performMonthlyAgeAudit();
    
    // 初始化主题
    const savedTheme = localStorage.getItem('app-theme') || 'normal';
    document.documentElement.classList.remove('dark', 'eye-care');
    if (savedTheme !== 'normal') {
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>重要异常结果管理中心</title>
        {/* 已物理移除外部字体链接，改用 globals.css 中的本地系统字体定义 */}
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/10">
        {isMounted ? (
          <AuthWrapper>
            {children}
          </AuthWrapper>
        ) : (
          <div className="min-h-screen w-full bg-background flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}
