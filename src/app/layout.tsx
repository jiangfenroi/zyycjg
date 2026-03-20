
import * as React from "react"
import { Metadata } from "next"
import './globals.css';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: '重要异常结果管理系统',
  description: '全院中心化重要异常结果闭环管理工具',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
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
