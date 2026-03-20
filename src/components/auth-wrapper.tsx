
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 核心认证与静默水合包装器
 * 彻底修复 Hydration Mismatch: 在挂载前不渲染任何业务文本
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    const user = localStorage.getItem('currentUser');
    const isAuthPage = pathname === '/login';
    
    if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [pathname, router])

  // 首屏渲染仅输出静态动画容器，不输出任何文本，确保服务端/客户端渲染内容绝对一致
  if (!mounted) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const isAuthPage = pathname === '/login';

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
