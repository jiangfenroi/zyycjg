"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Skeleton } from "@/components/ui/skeleton";

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

  if (!mounted) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-4xl px-8 space-y-8">
           <Skeleton className="h-12 w-48" />
           <div className="grid grid-cols-4 gap-6">
              <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
           </div>
           <Skeleton className="h-96 w-full" />
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
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-background/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
