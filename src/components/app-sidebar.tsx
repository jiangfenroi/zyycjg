"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  History,
  Settings,
  Bell,
  Search,
  FileText
} from "lucide-react"
import { usePathname } from "next/navigation"
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

const navigation = [
  { name: "工作台", href: "/", icon: LayoutDashboard },
  { name: "重要异常结果登记", href: "/abnormal-results", icon: AlertCircle },
  { name: "异常结果随访", href: "/follow-ups", icon: History },
  { name: "患者档案管理", href: "/patients", icon: Users },
  { name: "报告查询", href: "/reports", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-xl">
            M
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">MediTrack</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">主要功能</SidebarGroupLabel>
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
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-xs font-medium">AD</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">管理员</span>
            <span className="text-xs opacity-70">yamfanroi</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
