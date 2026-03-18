"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    // 简单的认证检查逻辑
    const checkAuth = () => {
      if (pathname === '/login') {
        setChecking(false)
        return
      }

      const user = localStorage.getItem('currentUser')
      if (!user) {
        router.push('/login')
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
      }
      setChecking(false)
    }

    checkAuth()
  }, [pathname, router])

  // 登录页面不显示侧边栏
  const isLoginPage = pathname === '/login'

  if (checking) {
    return (
      <html lang="zh-CN">
        <body className="bg-background flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-primary font-bold">系统启动中...</div>
        </body>
      </html>
    )
  }

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {isLoginPage ? (
          <main className="w-full h-full">{children}</main>
        ) : (
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto p-6 md:p-8">
                {children}
              </main>
            </div>
          </SidebarProvider>
        )}
        <Toaster />
      </body>
    </html>
  );
}
