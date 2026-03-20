
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

/**
 * 核心认证与水合加固包装器
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    const user = localStorage.getItem('currentUser');
    const isAuthPage = pathname === '/login' || pathname === '/setup';
    
    if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [pathname, router])

  /**
   * 彻底解决水合冲突：
   * 在组件挂载（Mounted）之前，不再渲染任何带有业务文本的内容。
   * 服务器端和客户端首屏渲染将输出完全一致的静态动画容器。
   */
  if (!mounted) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const isAuthPage = pathname === '/login' || pathname === '/setup';

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
