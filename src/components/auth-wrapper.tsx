
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = React.useState(true)
  const [timeoutReached, setTimeoutReached] = React.useState(false)

  React.useEffect(() => {
    // 设置 3 秒超时保护，解决在 Electron 下由于资源加载延迟引起的黑屏/启动白屏
    const safetyTimer = setTimeout(() => {
      setTimeoutReached(true);
      setChecking(false);
    }, 3000);

    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      const currentHash = window.location.hash || '';
      // 兼容静态导出下的 Hash 路由匹配
      const currentPath = currentHash.replace('#', '') || pathname;
      
      const isAuthPage = currentPath.includes('/login') || currentPath.includes('/setup');
      
      if (isAuthPage) {
        setChecking(false);
        return;
      }

      const user = localStorage.getItem('currentUser');
      if (!user) {
        // 如果没有登录信息，优先检查是否已经配置了数据库
        router.push('/login');
      }
      setChecking(false);
    }

    const timer = setTimeout(checkAuth, 300);
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [pathname, router])

  const isLoading = checking && !timeoutReached;

  if (isLoading) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-primary font-bold animate-pulse text-lg">系统正在同步中心数据库</div>
        </div>
      </div>
    )
  }

  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  const isAuthPage = pathname === '/login' || pathname === '/setup' || currentHash.includes('/login') || currentHash.includes('/setup');

  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen bg-slate-50">{children}</main>
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
