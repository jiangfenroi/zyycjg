"use client"

import * as React from 'react'
import { Bell, AlertTriangle } from 'lucide-react'
import { MOCK_TASKS } from '@/lib/mock-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

export function FollowUpNotifier() {
  const pendingTasks = MOCK_TASKS.filter(t => t.STATUS === 'pending')
  const count = pendingTasks.length

  if (count === 0) return null

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
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            待办随访任务
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            您有 {count} 个待处理的异常结果随访任务。
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {pendingTasks.map((task) => (
              <Link
                key={task.PERSONID}
                href={`/follow-ups?id=${task.PERSONID}`}
                className="flex flex-col p-3 rounded-md hover:bg-accent transition-colors border-b last:border-0"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">档案号: {task.PERSONID}</span>
                  <Badge variant="outline" className="text-[10px]">即将到期</Badge>
                </div>
                <span className="text-xs text-muted-foreground mt-1">应随访日期: {task.XCSFTIME}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/follow-ups">查看全部随访</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
