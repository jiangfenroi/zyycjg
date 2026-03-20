
"use client"

import * as React from "react"
import { LayoutDashboard, Users, AlertCircle, History, FileText, LogOut, Settings, Clock } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { DataService } from "@/services/data-service"

const navigation = [
  { name: "工作台", href: "/", icon: LayoutDashboard },
  { name: "重要异常结果登记", href: "/abnormal-results", icon: AlertCircle },
  { name: "随访管理工作台", href: "/follow-ups", icon: History },
  { name: "患者档案检索", href: "/patients", icon: Users },
  { name: "报告附件查询", href: "/reports", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [settings, setSettings] = React.useState<any>({ SYSTEM_NAME: '重要异常结果管理系统', SYSTEM_LOGO_TEXT: '重' })

  const loadSettings = React.useCallback(async () => {
    const data = await DataService.getSystemSettings()
    setSettings(data)
  }, [])

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) setUser(JSON.parse(storedUser))
    loadSettings()
  }, [loadSettings, pathname])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl overflow-hidden">
            {settings.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              settings.SYSTEM_LOGO_TEXT
            )}
          </div>
          <span className="font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden truncate max-w-[150px]">
            {settings.SYSTEM_NAME}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="h-11 px-4">
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
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">管理</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/settings/system'} tooltip="配置中心" className="h-11 px-4">
                    <Link href="/settings/system"><Settings className="size-5" /><span>全院管理中心</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/settings/logs'} tooltip="审计日志" className="h-11 px-4">
                    <Link href="/settings/logs"><Clock className="size-5" /><span>全量审计日志</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-xs">{user?.REAL_NAME?.charAt(0)}</div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-bold truncate">{user?.REAL_NAME}</span>
              <span className="text-[10px] opacity-50 uppercase">{user?.ROLE}</span>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('currentUser'); router.push('/login'); }} className="p-1 hover:bg-destructive/20 rounded-md text-destructive">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
