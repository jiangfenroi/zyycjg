"use client"

import * as React from 'react'
import { Bell, AlertTriangle, Loader2, Info, RefreshCw } from 'lucide-react'
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

  const loadTasks = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [results, followUps] = await Promise.all([
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      
      const today = new Date().toISOString().split('T')[0]
      const pending = results.filter(r => {
        const hasFollowUp = followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
        if (hasFollowUp) return false
        if (!r.NEXT_DATE) return false 
        return r.NEXT_DATE <= today
      })
      
      setTasks(pending)
    } catch (err) {
      console.error("提醒同步失败", err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
    // 降低压力：每 5 分钟同步一次
    const timer = setInterval(() => loadTasks(true), 300000)
    return () => clearInterval(timer)
  }, [loadTasks])

  const count = tasks.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-6 w-6 text-primary ${count > 0 ? 'animate-pulse' : ''}`} />
          {count > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full border-2 border-white">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl" align="end">
        <div className="p-4 border-b bg-destructive/5 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-semibold flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              随访触发预警
            </h3>
            <span className="text-[10px] text-muted-foreground mt-0.5">{loading ? '同步中...' : `当前 ${count} 项待处理`}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadTasks()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {loading && tasks.length === 0 ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : tasks.length > 0 ? tasks.map((task) => (
              <Link key={task.ID} href="/follow-ups" className="flex flex-col p-3 rounded-md hover:bg-accent border-b last:border-0">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold">{task.PERSONNAME || task.PERSONID}</span>
                  <Badge variant="outline" className="text-[9px] bg-blue-50">待复查</Badge>
                </div>
                <span className="text-[9px] font-bold text-destructive mt-1.5">预定日期: {task.NEXT_DATE}</span>
              </Link>
            )) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic">暂无到期任务</div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-primary" asChild>
            <Link href="/follow-ups">进入闭环工作台</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}