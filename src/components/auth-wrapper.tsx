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
    const checkAuth = () => {
      if (pathname === '/login' || pathname === '/setup') {
        setChecking(false)
        return
      }

      const user = localStorage.getItem('currentUser')
      if (!user) {
        router.push('/login')
      }
      setChecking(false)
    }

    checkAuth()
  }, [pathname, router])

  if (checking) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="animate-pulse text-primary font-bold">系统启动中...</div>
      </div>
    )
  }

  const isLoginPage = pathname === '/login'
  const isSetupPage = pathname === '/setup'

  if (isLoginPage || isSetupPage) {
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
