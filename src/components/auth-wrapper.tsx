
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 鉴权包装组件
 * 处理静态导出模式下的路由保护与中心数据库同步状态
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [checking, setChecking] = React.useState(true)
  const [timeoutReached, setTimeoutReached] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // 设置 3 秒超时保护，防止在 Electron 环境下由于资源解析缓慢导致的无限加载
    const safetyTimer = setTimeout(() => {
      setTimeoutReached(true);
      setChecking(false);
    }, 3000);

    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      const currentHash = window.location.hash || '';
      // 兼容静态导出下的 Hash 路由匹配，确保能正确识别配置与登录页面
      const currentPath = currentHash.replace('#', '') || pathname;
      
      const isAuthPage = currentPath.includes('/login') || currentPath.includes('/setup');
      
      if (isAuthPage) {
        setChecking(false);
        return;
      }

      // 检查本地存储的登录凭据
      const user = localStorage.getItem('currentUser');
      if (!user) {
        router.push('/login');
      }
      setChecking(false);
    }

    // 给 Next.js 路由解析留出微小缓冲时间
    const timer = setTimeout(checkAuth, 300);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [pathname, router])

  // 在组件挂载前（SSR阶段），返回空或者一个绝对静态的占位符以避免水合错误
  if (!mounted) {
    return null;
  }

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
