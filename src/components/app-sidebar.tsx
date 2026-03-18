"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  History,
  Settings,
  Bell,
  FileText,
  UserCog,
  LogOut,
  Palette,
  Clock
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import { DataService } from "@/services/data-service"

const navigation = [
  { name: "工作台", href: "/", icon: LayoutDashboard },
  { name: "重要异常结果登记", href: "/abnormal-results", icon: AlertCircle },
  { name: "重要异常结果随访", href: "/follow-ups", icon: History },
  { name: "患者档案管理", href: "/patients", icon: Users },
  { name: "报告查询", href: "/reports", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = React.useState<any>(null)
  const [settings, setSettings] = React.useState({ 
    SYSTEM_NAME: 'MediTrack', 
    SYSTEM_LOGO_TEXT: 'M',
    SYSTEM_LOGO_URL: ''
  })

  const loadSettings = React.useCallback(async () => {
    const data = await DataService.getSystemSettings()
    setSettings(data)
  }, [])

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    
    loadSettings()
    
    // 设置定时刷新配置，实现品牌实时同步
    const timer = setInterval(loadSettings, 30000)
    return () => clearInterval(timer)
  }, [loadSettings, pathname])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/login')
    toast({ title: "已退出登录", description: "您的会话已安全结束。" })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl shadow-inner overflow-hidden">
            {settings.SYSTEM_LOGO_URL ? (
              <img 
                src={`file://${settings.SYSTEM_LOGO_URL}`} 
                alt="Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setSettings(prev => ({ ...prev, SYSTEM_LOGO_URL: '' }));
                }}
              />
            ) : (
              settings.SYSTEM_LOGO_TEXT
            )}
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden truncate max-w-[150px]">
            {settings.SYSTEM_NAME}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">主要业务模块</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-11 px-4"
                  >
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
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">系统管理</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/settings/users'}
                    tooltip="用户权限管理"
                    className="h-11 px-4"
                  >
                    <Link href="/settings/users">
                      <UserCog className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">用户权限管理</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/settings/logs'}
                    tooltip="系统操作日志"
                    className="h-11 px-4"
                  >
                    <Link href="/settings/logs">
                      <Clock className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">系统操作日志</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/settings/system'}
                    tooltip="系统身份设置"
                    className="h-11 px-4 text-secondary hover:text-secondary/80"
                  >
                    <Link href="/settings/system">
                      <Palette className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">系统身份设置</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-white/20 shadow-sm">
              <span className="text-xs font-medium">{user?.REAL_NAME?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden w-24">
              <span className="text-sm font-medium truncate">{user?.REAL_NAME || '未登录'}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-wider">{user?.ROLE || 'visitor'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-destructive/20 rounded-md text-destructive transition-colors"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
