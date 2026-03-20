
"use client"

import * as React from 'react'
import { Bell, AlertTriangle, Loader2, Info, Link as LinkIcon } from 'lucide-react'
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
      
      const today = new Date().toISOString().split('T')[0]
      
      // 预警逻辑：到达 NEXT_DATE 且没有随访记录的
      const pending = results.filter(r => {
        const hasFollowUp = followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
        if (hasFollowUp) return false
        
        // 如果没有随访记录，看是否到了 NEXT_DATE
        if (!r.NEXT_DATE) return true // 默认显示所有未随访项
        return r.NEXT_DATE <= today
      })
      
      setTasks(pending)
    } catch (err) {
      console.error("Failed to load notification tasks", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
    const timer = setInterval(loadTasks, 60000)
    return () => clearInterval(timer)
  }, [loadTasks])

  const count = tasks.length

  return (
    <Popover>
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
            <h3 className="font-semibold flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              随访路径到期提醒
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  展示所有已到达临床随访路径预定日期的重要异常记录
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {loading ? "正在同步路径数据" : `当前有 ${count} 例结果已到达路径预警时间`}
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
                  <span className="text-xs font-bold">{task.PERSONNAME || task.PERSONID}</span>
                  <Badge variant="outline" className="text-[9px] h-4">{task.PATH_NAME || '未设路径'}</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">"{task.ZYYCJGXQ}"</span>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[9px] font-bold text-destructive">预定日期: {task.NEXT_DATE || '即刻'}</span>
                  {task.PATH_URL && <LinkIcon className="h-2.5 w-2.5 text-blue-500" />}
                </div>
              </Link>
            )) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic">暂无到期的路径随访任务</div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-center bg-muted/10">
          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-primary" asChild>
            <Link href="/follow-ups">进入路径随访工作台</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
