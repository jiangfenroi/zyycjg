"use client"

import * as React from "react"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { DataService } from "@/services/data-service";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 启动时触发年龄自动核查流水
  React.useEffect(() => {
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
        <title>重要异常结果管理系统</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
