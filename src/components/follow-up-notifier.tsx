
"use client"

import * as React from 'react'
import { Bell, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
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

const addYears = (dateStr: string, years: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
};

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
        if (r.STATUS === 'deceased') return false;

        const recordFollowUps = followUps.filter(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID);
        
        // 1. 初次随访 (T[通知日期] + 7)
        const hasInitialFollowUp = recordFollowUps.length > 0;
        const initialTargetDate = r.NEXT_DATE || addYears(r.ZYYCJGTZRQ, 0);
        const isInitialPending = !hasInitialFollowUp && initialTargetDate <= today;

        // 2. 年度复查 (T[体检日期] + 365)
        const peDate = DataService.getPEDateFromID(r.TJBHID || '', r.ZYYCJGTZRQ);
        const oneYearMark = addYears(peDate, 1);
        const hasAnnualFollowUp = recordFollowUps.some(f => f.SFTIME >= oneYearMark);
        const isAnnualPending = today >= oneYearMark && !hasAnnualFollowUp;

        return isInitialPending || isAnnualPending;
      })
      
      setTasks(pending)
    } catch (err) {
      console.error("提醒中心同步失败", err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
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
              重要异常随访预警
            </h3>
            <span className="text-[10px] text-muted-foreground mt-0.5">{loading ? '正在同步中心库...' : `当前 ${count} 项待结案任务`}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadTasks()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {loading && tasks.length === 0 ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : tasks.length > 0 ? tasks.map((task) => {
              const today = new Date().toISOString().split('T')[0];
              const peDate = DataService.getPEDateFromID(task.TJBHID || '', task.ZYYCJGTZRQ);
              const oneYearMark = addYears(peDate, 1);
              const isAnnual = today >= oneYearMark;
              return (
                <Link key={task.ID} href="/follow-ups" className="flex flex-col p-3 rounded-md hover:bg-accent border-b last:border-0 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold">{task.PERSONNAME || task.PERSONID}</span>
                    <Badge variant={isAnnual ? "destructive" : "secondary"} className="text-[9px] px-1.5 h-4">
                      {isAnnual ? '年度复查' : '初次随访'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-[9px] font-bold text-destructive">
                        应结案日期: {isAnnual ? oneYearMark : (task.NEXT_DATE || task.ZYYCJGTZRQ)}
                     </span>
                     <span className="text-[8px] text-muted-foreground font-mono">{task.TJBHID}</span>
                  </div>
                </Link>
              );
            }) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic">暂无到期预警任务</div>
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
