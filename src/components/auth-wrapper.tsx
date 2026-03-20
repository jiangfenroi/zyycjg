
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 身份验证包装器（水合增强版）：
 * 1. 彻底移除渲染阻塞：初始挂载阶段直接渲染 children，确保 SSR/CSR 结构一致，物理消除“无限转圈”。
 * 2. 延迟布局注入：仅在挂载成功且确认身份后，动态包裹侧边栏容器。
 * 3. 稳健路径检查：适配 Electron 静态路径模式。
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname()
  const router = useRouter()
  
  // 稳健的登录/配置页识别逻辑
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/setup');

  React.useEffect(() => {
    setMounted(true);
    
    // 仅在挂载后执行敏感的 localStorage 检查
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (!user && !isAuthPage && pathname !== '/') {
        router.push('/login');
      }
    }
  }, [isAuthPage, pathname, router]);

  // 1. 初始及水合阶段：渲染基础容器，必须与 SSR 结果完全一致以防报错
  if (!mounted) {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  // 2. 登录/配置页：不加载侧边栏
  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen bg-slate-50">{children}</main>
  }

  // 3. 业务功能页：挂载成功后动态注入侧边栏架构
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-background/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
