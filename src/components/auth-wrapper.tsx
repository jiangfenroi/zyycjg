
"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

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
   * 终极水合修复逻辑：
   * 在客户端挂载前渲染完全确定的、无文本的占位符。
   * 这彻底消除了服务器与客户端因文本差异导致的水合报错。
   */
  if (!mounted) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
