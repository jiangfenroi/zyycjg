
"use client"

import * as React from "react"
import { LayoutDashboard, Users, AlertCircle, History, FileText, LogOut, Settings, Clock } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { DataService } from "@/services/data-service"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { name: "全院工作台", href: "/", icon: LayoutDashboard },
  { name: "异常结果登记", href: "/abnormal-results", icon: AlertCircle },
  { name: "随访任务管理", href: "/follow-ups", icon: History },
  { name: "病历档案检索", href: "/patients", icon: Users },
  { name: "电子报告中心", href: "/reports", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [settings, setSettings] = React.useState<any>(null)

  const loadSettings = React.useCallback(async (force = false) => {
    try {
      const data = await DataService.getSystemSettings(force)
      setSettings(data)
    } catch (e) {
      console.error("Failed to load settings in sidebar")
    }
  }, [])

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    loadSettings()
  }, [loadSettings])

  const displaySettings = settings || { SYSTEM_NAME: '重要异常结果管理系统', SYSTEM_LOGO_TEXT: '重' };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl overflow-hidden shadow-sm shrink-0">
            {displaySettings.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${displaySettings.SYSTEM_LOGO_URL}`} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              displaySettings.SYSTEM_LOGO_TEXT
            )}
          </div>
          <span className="font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden truncate">
            {displaySettings.SYSTEM_NAME}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="h-11 px-4 transition-colors">
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.ROLE === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-bold">管理中心</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/settings/system')} tooltip="全院管理" className="h-11 px-4 transition-colors">
                    <Link href="/settings/system">
                      <Settings className="size-5" />
                      <span>全院管理中心</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/settings/logs'} tooltip="审计日志" className="h-11 px-4 transition-colors">
                    <Link href="/settings/logs">
                      <Clock className="size-5" />
                      <span>全量审计日志</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/50 space-y-4">
        <div className="flex flex-col gap-3 group-data-[collapsible=icon]:items-center">
           <ThemeToggle className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-9" />
           
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-xs shadow-inner">
                {user?.REAL_NAME?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                <span className="text-xs font-bold truncate max-w-[80px]">{user?.REAL_NAME || '未登录'}</span>
                <span className="text-[10px] opacity-50 uppercase font-mono">{user?.ROLE || 'Guest'}</span>
              </div>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('currentUser'); router.push('/login'); }} 
              className="p-1.5 hover:bg-destructive/10 rounded-md text-destructive transition-colors ml-2"
              title="退出系统"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
