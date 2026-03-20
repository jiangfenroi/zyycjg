
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 身份验证包装器物理加固：
 * 1. 采用标准的 mounted 模式解决 Hydration Mismatch (水合不匹配) 错误。
 * 2. 确保所有 Hooks (usePathname, useRouter, useEffect) 在任何条件返回前调用，彻底解决“无限转圈”风险。
 * 3. 初始渲染与服务器保持一致（展示稳定加载动画），挂载后再根据登录状态切换布局。
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname()
  const router = useRouter()
  
  const isAuthPage = pathname === '/login' || pathname === '/login/';

  React.useEffect(() => {
    // 标记已挂载，触发 UI 切换
    setMounted(true);
    
    // 仅在挂载后执行敏感的 localStorage 检查与路由跳转
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [isAuthPage, router]);

  // 1. 初始渲染阶段 (Server + Client 1st pass)：返回稳定的加载结构，必须与 SSR 结果完全一致
  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. 登录/配置页阶段：不加载侧边栏容器
  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen bg-slate-50">{children}</main>
  }

  // 3. 业务功能阶段：展示全院侧边栏闭环布局
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
