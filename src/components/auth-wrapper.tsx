
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 身份验证包装器加固：
 * 1. 移除 mounted 阻塞逻辑，防止 Electron 环境下出现无限转圈。
 * 2. 采用静默重定向策略，确保登录页面能瞬间渲染。
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === '/login' || pathname === '/login/';

  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [isAuthPage, router]);

  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen bg-slate-50">{children}</main>
  }

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
