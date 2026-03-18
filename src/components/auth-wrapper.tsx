
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    // 增加延迟以确保 Next.js 客户端路由已就绪
    const timer = setTimeout(() => {
      const checkAuth = () => {
        const currentPath = window.location.hash.replace('#', '') || pathname;
        
        if (currentPath.includes('/login') || currentPath.includes('/setup')) {
          setChecking(false)
          return
        }

        const user = localStorage.getItem('currentUser')
        if (!user) {
          // 在静态导出环境下，确保跳转到带哈希的路径
          if (window.electronAPI) {
            router.push('/login')
          } else {
            router.push('/login')
          }
        }
        setChecking(false)
      }

      checkAuth()
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, router])

  if (checking) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-primary font-bold animate-pulse">系统正在连接中心数据库...</div>
        </div>
      </div>
    )
  }

  // 判断是否为认证相关页面
  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  const isAuthPage = pathname === '/login' || pathname === '/setup' || currentHash.includes('/login') || currentHash.includes('/setup');

  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen">{children}</main>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
