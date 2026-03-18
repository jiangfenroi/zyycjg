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
      // 逻辑：所有 A 类（危急值）且尚未进行过随访登记的
      const pending = results.filter(r => 
        r.ZYYCJGFL === 'A' && !followUps.some(f => f.PERSONID === r.PERSONID)
      )
      setTasks(pending)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
    const timer = setInterval(loadTasks, 60000) // 每分钟静默刷新
    return () => clearInterval(timer)
  }, [loadTasks])

  const count = tasks.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-6 w-6 text-primary ${count > 0 ? 'animate-pulse-red' : ''}`} />
          {count > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full border-2 border-white">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              危急值随访提醒
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  A类危急值定义：需要立即进行临床干预，否则将危及生命或导致严重不良反应后果的异常结果。
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "正在同步数据库..." : `当前有 ${count} 例 A 类危急值尚未完成随访结案。`}
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : tasks.length > 0 ? tasks.map((task) => (
              <Link
                key={task.ID}
                href="/follow-ups"
                className="flex flex-col p-3 rounded-md hover:bg-accent transition-colors border-b last:border-0"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{task.PERSONNAME || task.PERSONID}</span>
                  <Badge variant="destructive" className="text-[10px]">危急值</Badge>
                </div>
                <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.ZYYCJGXQ}</span>
                <span className="text-[10px] text-muted-foreground mt-1">登记日期: {task.ZYYCJGTZRQ}</span>
              </Link>
            )) : (
              <div className="py-8 text-center text-xs text-muted-foreground">暂无未处理的危急值任务</div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/follow-ups">进入随访工作台</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
