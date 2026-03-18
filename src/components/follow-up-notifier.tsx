
"use client"

import * as React from 'react'
import { Bell, AlertTriangle, Loader2, Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { DataService } from '@/services/data-service'
import { AbnormalResult } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function FollowUpNotifier() {
  const [tasks, setTasks] = React.useState<AbnormalResult[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadTasks = React.useCallback(async () => {
    try {
      const [results, followUps] = await Promise.all([
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      const pending = results.filter(r => 
        !followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
      )
      setTasks(pending)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.setTaskbarFlash(pending.length > 0)
      }
    } catch (err) {
      console.error("Failed to load notification tasks", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
    const timer = setInterval(loadTasks, 60000)
    return () => {
      clearInterval(timer)
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.setTaskbarFlash(false)
      }
    }
  }, [loadTasks])

  const count = tasks.length

  const handleOpenChange = (open: boolean) => {
    if (open && typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.setTaskbarFlash(false)
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-6 w-6 text-primary ${count > 0 ? 'animate-pulse-red' : ''}`} />
          {count > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full border-2 border-white shadow-sm">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl" align="end">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              重要结果随访提醒
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  展示所有尚未完成随访结案的重要异常记录
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "正在同步中心数据库" : `当前有 ${count} 例结果尚未完成随访结案`}
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : tasks.length > 0 ? tasks.map((task) => (
              <Link
                key={task.ID}
                href="/follow-ups"
                className="flex flex-col p-3 rounded-md hover:bg-accent transition-colors border-b last:border-0"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{task.PERSONNAME || task.PERSONID}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{task.ZYYCJGFL}类</Badge>
                </div>
                <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.ZYYCJGXQ}</span>
                <span className="text-[10px] text-muted-foreground mt-1 bg-muted w-fit px-1.5 py-0.5 rounded">通知日期: {task.ZYYCJGTZRQ}</span>
              </Link>
            )) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic">暂无未处理的预警任务</div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-center bg-muted/10">
          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-primary" asChild>
            <Link href="/follow-ups">进入随访工作台</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
